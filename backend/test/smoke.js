// Simple smoke test for API endpoints
const BASE = 'http://localhost:4000';

async function get(path, opts={}) { return fetch(BASE+path, opts).then(r => r.json()); }
async function post(path, body) { return fetch(BASE+path, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)}).then(r => r.json().then(j=>({status:r.status, body:j}))); }
async function del(path) { return fetch(BASE+path, { method:'DELETE' }).then(r => ({ status:r.status })); }

(async () => {
  try {
    console.log('Health:', await get('/api/health'));
    const products = await get('/api/products');
    console.log('Products count:', products.length);
    const first = products[0];
    let addRes = await post('/api/cart', { productId: first.id, qty: 2 });
    console.log('Add cart status:', addRes.status, 'Total:', addRes.body.total);
    let checkout = await post('/api/checkout', { name: 'Test User', email: 'test@example.com' });
    console.log('Checkout status:', checkout.status, 'Order ID:', checkout.body.orderId);
    if (checkout.status !== 201) throw new Error('Checkout failed');
    console.log('Smoke test PASS');
  } catch (e) {
    console.error('Smoke test FAIL', e);
    process.exit(1);
  }
})();
