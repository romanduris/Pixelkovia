-- Keep historical product IDs: orders and entitlements reference these keys.
-- Only the visible names change. Prices, rights and purchase behavior stay intact.
UPDATE products SET name = 'Pingy – bonusová misia' WHERE id = 'listok-mission';
UPDATE products SET name = 'Miky – bonusová misia' WHERE id = 'kvak-mission';
