-- One verified Checkout Session may fund two independent customer accounts.
ALTER TABLE checkout_attempts ADD COLUMN gift_game INTEGER NOT NULL DEFAULT 0 CHECK(gift_game IN(0,1));
ALTER TABLE checkout_attempts ADD COLUMN gift_price_cents INTEGER NOT NULL DEFAULT 0 CHECK(gift_price_cents>=0);
CREATE TABLE checkout_orders (
  attempt_id TEXT NOT NULL REFERENCES checkout_attempts(id),
  kind TEXT NOT NULL CHECK(kind IN('primary','gift')),
  order_id TEXT NOT NULL UNIQUE REFERENCES orders(id),
  PRIMARY KEY(attempt_id,kind)
);
INSERT INTO checkout_orders(attempt_id,kind,order_id)
SELECT a.id,'primary',o.id FROM checkout_attempts a JOIN orders o ON o.external_reference=a.stripe_session_id;
