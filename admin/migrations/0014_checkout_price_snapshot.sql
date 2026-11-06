-- Exact quote at attempt creation. Leave historical quotes unknown, never
-- reconstruct a past voucher discount from today's product prices.
ALTER TABLE checkout_attempts ADD COLUMN subtotal_cents INTEGER CHECK(subtotal_cents IS NULL OR subtotal_cents>=0);
ALTER TABLE checkout_attempts ADD COLUMN bundle_discount_cents INTEGER CHECK(bundle_discount_cents IS NULL OR bundle_discount_cents>=0);
ALTER TABLE checkout_attempts ADD COLUMN voucher_discount_cents INTEGER CHECK(voucher_discount_cents IS NULL OR voucher_discount_cents>=0);
