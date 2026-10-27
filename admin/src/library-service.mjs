import before from '../../books-content/before.json' with {type:'json'};
import after from '../../books-content/after.json' with {type:'json'};
import {query} from './db.mjs';
import {HttpError} from './auth.mjs';
const books=[before,after];
export async function customerLibrary(db,customerId,at=Date.now()){
  const rows=await query(db,`SELECT DISTINCT e.product_id FROM entitlements e
    JOIN products p ON p.id=e.product_id
    JOIN order_items i ON i.id=e.order_item_id AND i.product_id=e.product_id
    JOIN orders o ON o.id=i.order_id AND o.customer_id=e.customer_id
    WHERE e.customer_id=? AND e.status='valid' AND o.status='paid'
      AND p.content_ready=1 AND (e.expires_at IS NULL OR e.expires_at>?)`,customerId,at);
  // A book remains readable independently of the game's activation/replay window.
  return {books:books.map(book=>({id:book.id,owned:rows.some(row=>row.product_id===book.id)}))};
}
export async function readBook(db,customerId,id,at=Date.now()){
  const book=books.find(b=>b.id===id);if(!book)throw new HttpError(404,'Kniha neexistuje.');
  const library=await customerLibrary(db,customerId,at);
  if(!library.books.find(b=>b.id===id)?.owned)throw new HttpError(403,'Kniha nie je súčasťou platných nákupov.');
  return book;
}
