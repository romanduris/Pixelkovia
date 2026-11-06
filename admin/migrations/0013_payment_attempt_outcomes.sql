-- Durable, bounded monitoring snapshot of the existing checkout attempt.
-- No additional purchase, email, card data or provider error text is stored here.
CREATE TABLE payment_attempt_outcomes (
  attempt_id TEXT PRIMARY KEY REFERENCES checkout_attempts(id),
  webhook_confirmed_at INTEGER,
  cancelled_at INTEGER,
  problem_kind TEXT CHECK(problem_kind IN('technical','bank','unknown')),
  problem_type TEXT,
  problem_code TEXT NOT NULL DEFAULT '',
  problem_method TEXT NOT NULL DEFAULT 'unknown' CHECK(problem_method IN('unknown','card','apple_pay','google_pay','wallet')),
  problem_at INTEGER
);
-- Historical orders were fulfilled by the existing verified server flow.
INSERT INTO payment_attempt_outcomes(attempt_id,webhook_confirmed_at)
SELECT a.id,min(o.created_at) FROM checkout_attempts a JOIN orders o
ON o.external_reference=a.stripe_session_id GROUP BY a.id;
-- Preserve known historical failures using only the existing safe event codes.
INSERT INTO payment_attempt_outcomes(attempt_id,problem_kind,problem_type,problem_code,problem_at)
SELECT attempt_id,
  CASE WHEN type='payment_failed' THEN CASE WHEN code='processing_error' THEN 'technical' WHEN code IN('card_declined','insufficient_funds','do_not_honor','generic_decline','fraudulent','lost_card','stolen_card','transaction_not_allowed','issuer_not_available','try_again_later') THEN 'bank' ELSE 'unknown' END ELSE 'technical' END,
  CASE WHEN type='payment_failed' AND code='processing_error' THEN 'payment_processing_error' WHEN type='payment_failed' AND code NOT IN('card_declined','insufficient_funds','do_not_honor','generic_decline','fraudulent','lost_card','stolen_card','transaction_not_allowed','issuer_not_available','try_again_later') THEN 'payment_failed_unknown' ELSE type END,
  code,created_at FROM (
    SELECT *,row_number() OVER(PARTITION BY attempt_id ORDER BY created_at DESC,id) AS latest
    FROM payment_log WHERE attempt_id IS NOT NULL AND (
      type IN('session_error','config_error','sdk_error','element_error','wallet_error','validation_connection_error')
      OR (type='confirm_error' AND code IN('billing_phone_missing','billing_email_missing','return_url_conflict','sdk_integration_error','StripeAPIError','StripeConnectionError'))
      OR (type='payment_failed' AND source='stripe')
    )
  ) WHERE latest=1
ON CONFLICT(attempt_id) DO UPDATE SET problem_kind=excluded.problem_kind,problem_type=excluded.problem_type,problem_code=excluded.problem_code,problem_at=excluded.problem_at;
-- A later successful preparation is a recovered preparation error.
UPDATE payment_attempt_outcomes SET problem_kind=NULL,problem_type=NULL,problem_code='',problem_at=(
  SELECT max(l.created_at) FROM payment_log l WHERE l.attempt_id=payment_attempt_outcomes.attempt_id AND l.type='session_created' AND l.source='server'
)
WHERE problem_type='session_error' AND EXISTS(
  SELECT 1 FROM payment_log l WHERE l.attempt_id=payment_attempt_outcomes.attempt_id
    AND l.type='session_created' AND l.source='server' AND l.created_at>=payment_attempt_outcomes.problem_at
);
CREATE INDEX checkout_attempts_time ON checkout_attempts(created_at);
