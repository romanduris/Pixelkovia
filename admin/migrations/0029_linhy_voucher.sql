-- Keep existing gifts free. Paid single-use codes share their atomic claims.
ALTER TABLE gift_vouchers ADD COLUMN total_cents INTEGER NOT NULL DEFAULT 0
  CHECK(total_cents IN (0,100));
INSERT INTO gift_vouchers(code,total_cents) VALUES ('linhy',100);
