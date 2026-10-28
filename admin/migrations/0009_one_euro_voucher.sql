-- Preserve existing checkout rows and the original free-voucher constraint.
ALTER TABLE checkout_attempts ADD COLUMN fixed_total_voucher TEXT
  CHECK(fixed_total_voucher IS NULL OR (fixed_total_voucher='1e' AND voucher_code IS NULL));
