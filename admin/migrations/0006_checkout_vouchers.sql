-- The server records the approved voucher before creating the Stripe Session.
ALTER TABLE checkout_attempts ADD COLUMN voucher_code TEXT CHECK(voucher_code IS NULL OR voucher_code='free');
ALTER TABLE checkout_attempts ADD COLUMN item_prices TEXT;
UPDATE products SET name='Hra Pixelkovia – Stratený signál' WHERE id='episode-1';
