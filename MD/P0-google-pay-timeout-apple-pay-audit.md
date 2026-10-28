# P0 – Google Pay callback timeout; prevent double payment and audit Apple Pay

**Project:** Pixelkovia · WEB & BUSINESS  
**Priority:** P0 / release blocker for wallet payments  
**Status:** Approved investigation and fix request; not yet implemented  
**Scope:** Payment confirmation, wallet callbacks, checkout recovery, webhook/order status. **Do not modify login passwords or password generation.**

## Observed production behavior (user confirmed)

- One live card payment for **€14.99** completed and displayed correctly.
- Two separate live **Google Pay** payments for **€1.00** each were successfully charged, yet both showed **callback timeout** in the browser.
- The user nearly attempted another payment because the checkout appeared to have failed.
- Many other created, abandoned, or expired Checkout Sessions came from manually opening and previewing the checkout. Do **not** count them as actual failed payment attempts.
- A purchased-access email arrived, indicating that the successful-payment fulfillment path worked at least in that instance.
- **Apple Pay has not been tested by the user** (no Apple device). The same class of problem must be proactively examined for Apple Pay; do not claim Apple Pay is broken without evidence.

**Critical requirement:** No ambiguous client-side error or timeout may encourage a customer to pay a second time when the first payment could have succeeded.

## 1. Investigate the root cause

Review the latest actual implementation, in particular:

- `checkout.js`: Express Checkout Element wallet `confirm` event, `checkout.actions.confirm()`, handling of `result.type`, `event.paymentFailed()`, callback completion timing, retry paths, `paymentStatus()`, session persistence, page reload and navigation;
- `admin/src/commerce.mjs`: `createCheckout()`, Checkout Session idempotency, `checkoutStatus()`, `fulfill()`, `paymentWebhook()`, `sendPending()`;
- routes for `/api/checkout/session`, `/api/checkout/status` and `/api/stripe/webhook`, related D1 tables and deployment logs;
- relevant official **current Stripe documentation** for Checkout Elements SDK, Express Checkout Element, Google Pay **and** Apple Pay.

Determine whether the wallet callback waits too long for server-side fulfillment, whether callback lifecycle is correctly settled per Stripe API, and what happens when the confirmation is successful but the client times out. Do not assume that the approximately 12-second status poll is necessarily the actual Google Pay callback timeout: verify with traces or reproducible tests.

**Avoid live charges during investigation.** Use test mode, mocked Stripe API and/or isolated worker/D1 fixtures.

## 2. Fix Google Pay without losing payment correctness

- Properly settle the wallet `confirm` event following the documented Checkout Elements SDK contract, without blocking the wallet callback on webhook delivery or email dispatch.
- Distinguish **confirmed payment**, **pending/unknown status**, and **confirmed declined/canceled payment**.
- Never invoke wallet `paymentFailed()` solely because an application callback/status fetch times out while the charge outcome is unknown.
- On ambiguous outcome show a clear state such as:
  **„Overujeme vašu platbu. Prosíme, neplaťte znova. Potvrdenie a prístup vám po úspešnej úhrade prídu e-mailom.“**
- Keep the existing Checkout Session identifier and show a safe status/recovery UI after reload, redirect or temporary network failure.
- Prevent double-click, concurrent Checkout Session creation, and unintentional repeat charges while the previous attempt remains unresolved. A browser-only disabled button is insufficient: verify robust server-side checks, purchase-attempt state and idempotency.
- A successful payment should lead to a clear success state even if sending the access email is delayed.
- For a truly failed/declined payment, permit a deliberate and safe retry.
- Preserve server-verified amount/currency, webhook signature verification, order/entitlement idempotency, refund handling and existing prices.

## 3. Apple Pay preventive audit (mandatory)

The user cannot test Apple Pay on their phone. **Audit and harden it anyway.**

- Check whether Google Pay and Apple Pay use exactly the same `ExpressCheckoutElement.on('confirm')` and `actions.confirm()` flow.
- If they share the callback logic, apply the same protections to both wallets.
- Verify supported Apple Pay browser/device behavior and wallet availability handling.
- Check cancellation, network loss, delayed server confirmation and browser-return cases.
- Add automated tests with a **mocked Apple Pay confirm event** covering callback success, rejection, timeout/unknown, delayed webhook, page refresh and retry safety.
- If real Apple Pay end-to-end testing requires an Apple device or Safari, **state this as an explicit remaining validation requirement**. Never claim full E2E verification based solely on mocked tests; obtain a device/browser test before enabling Apple Pay for public sales or leave it disabled until validated.
- Do not alter SCA/3D Secure requirements or try to mimic native wallet behavior with custom DOM/CSS.

## 4. Acceptance tests

1. Successful Google Pay + delayed webhook: no timeout-as-failure, no double charge.
2. Successful Google Pay + delayed email: success shown, email status described separately.
3. Google Pay callback network timeout with unknown outcome: clear warning to avoid repaying, recover original session.
4. Google Pay real decline/cancel: appropriate failure state and controlled retry.
5. Double-click, repeat confirmation, reload, back navigation and reopening checkout: no duplicate charge.
6. Duplicate/out-of-order Stripe webhook: single order, one set of entitlements, no duplicate access emails.
7. Apple Pay mocked success, delay, cancel, unknown outcome and retry behavior: same protections.
8. Ordinary card checkout remains functional and unchanged.
9. Existing totals €14.99, €19.98, €19.99 and gift-game calculations remain correct.
10. No real paid tests without explicit user authorization.

## 5. Delivery

Before release report:
- confirmed vs. suspected timeout root cause, with code/log evidence;
- changed files and code-level explanation;
- test commands/results and any unresolved risks;
- proof that ambiguous outcomes cannot trigger an easy second charge;
- Apple Pay status: **code reviewed / automated mock tests passed / real Apple-device test pending** as applicable.

**Do not change password generation, customer login design, or email password length.** These are explicitly out of scope.

**Operational safeguard:** If ambiguity or repeat-payment risk remains, keep Google Pay and/or Apple Pay disabled in public checkout until verified. Do not silently activate live wallet payments.
