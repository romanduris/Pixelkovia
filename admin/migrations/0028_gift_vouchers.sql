-- Gift codes are server-owned and never included in the public catalog.
CREATE TABLE gift_vouchers (
  code TEXT PRIMARY KEY
);
INSERT INTO gift_vouchers(code) VALUES ('kovo'),('sandy'),('rosos');
ALTER TABLE checkout_attempts ADD COLUMN gift_voucher_code TEXT REFERENCES gift_vouchers(code);

-- Inserted in the checkout transaction. The primary key prevents two
-- devices from obtaining separate live Sessions for the same gift code.
CREATE TABLE gift_voucher_claims (
  code TEXT PRIMARY KEY REFERENCES gift_vouchers(code),
  attempt_id TEXT NOT NULL UNIQUE REFERENCES checkout_attempts(id),
  UNIQUE(code,attempt_id)
);

-- Inserted in the order/entitlement/delivery batch. The composite foreign
-- key requires ownership of the claim and prevents releasing a used gift.
CREATE TABLE gift_voucher_redemptions (
  code TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL UNIQUE,
  redeemed_at INTEGER NOT NULL,
  FOREIGN KEY(code,attempt_id) REFERENCES gift_voucher_claims(code,attempt_id)
);
