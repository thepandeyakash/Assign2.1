const { useState, useEffect } = React;

function ProductGrid({ products, addToCart }) {
  return (
    <div className="product-grid">
      {products.map(p => (
        <div key={p.id} className="product-card">
          {p.image && <img src={p.image} alt={p.name} />}
          <h3>{p.name}</h3>
          <p className="price">${p.price.toFixed(2)}</p>
          <button onClick={() => addToCart(p.id, 1)}>Add to Cart</button>
        </div>
      ))}
    </div>
  );
}

function Cart({ cart, updateQty, removeItem }) {
  return (
    <div className="cart-panel">
      <h2>Cart</h2>
      {cart.items.length === 0 && <p>No items yet.</p>}
      <ul className="cart-items">
        {cart.items.map(it => (
          <li key={it.id} className="cart-item">
            <div className="info">
              <strong>{it.name}</strong>
              <span>${it.price.toFixed(2)} each</span>
            </div>
            <div className="qty">
              <input
                type="number"
                min={1}
                max={99}
                value={it.qty}
                onChange={e => {
                  const n = parseInt(e.target.value, 10);
                  if (Number.isNaN(n)) return; // ignore invalid typing states
                  const val = Math.min(99, Math.max(1, n));
                  updateQty(it.id, it.productId, val);
                }}
              />
              <span>${it.lineTotal.toFixed(2)}</span>
            </div>
            <button className="remove" onClick={() => removeItem(it.id)}>✕</button>
          </li>
        ))}
      </ul>
      <div className="cart-total">Total: ${cart.total.toFixed(2)}</div>
    </div>
  );
}

function CheckoutModal({ onClose, onSubmit, total }) {
  const [form, setForm] = useState({ name: '', email: '' });
  function handleChange(e) { setForm({ ...form, [e.target.name]: e.target.value }); }
  function submit(e) { e.preventDefault(); onSubmit(form); }
  return (
    <div className="checkout-modal" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Checkout</h2>
        <p>Total: ${total.toFixed(2)}</p>
        <form onSubmit={submit} className="checkout-form">
          <label>
            Name
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>
          <label>
            Email
            <input name="email" type="email" value={form.email} onChange={handleChange} required />
          </label>
          <div className="actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={!form.name || !form.email}>Submit</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [showCheckout, setShowCheckout] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchProducts() { const res = await fetch('/api/products'); setProducts(await res.json()); }
  async function fetchCart() { const res = await fetch('/api/cart'); setCart(await res.json()); }
  useEffect(() => { fetchProducts(); fetchCart(); }, []);

  async function addToCart(productId, qty = 1) {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/cart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId, qty }) });
      if (!res.ok) throw new Error('Add to cart failed');
      setCart(await res.json());
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }
  async function updateQty(_cartItemId, productId, qty) { await addToCart(productId, qty); }
    async function updateQty(cartItemId, productId, qty) {
      // Optimistic UI: update local cart first for snappy feel
      setCart(prev => {
        const items = prev.items.map(i => i.id === cartItemId ? { ...i, qty, lineTotal: i.price * qty } : i);
        const total = items.reduce((s, i) => s + i.lineTotal, 0);
        return { items, total: Number(total.toFixed(2)) };
      });
      await addToCart(productId, qty);
    }
  async function removeItem(id) {
    setLoading(true); setError(null);
    try { const res = await fetch(`/api/cart/${id}`, { method: 'DELETE' }); if (!res.ok && res.status !== 204) throw new Error('Remove failed'); await fetchCart(); }
    catch (e) { setError(e.message); } finally { setLoading(false); }
  }
  async function checkout(form) {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');
      setReceipt(data); await fetchCart(); setShowCheckout(false);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  return (
    <div className="app-container">
      <header>
        <h1>Mock E-Com Cart</h1>
        <div className="cart-summary" onClick={() => setShowCheckout(true)}>
          Cart: {cart.items.length} items (${cart.total.toFixed(2)})
        </div>
      </header>
      {error && <div className="error">{error}</div>}
      <main>
        <ProductGrid products={products} addToCart={addToCart} />
        <Cart cart={cart} updateQty={updateQty} removeItem={removeItem} />
      </main>
      <button className="checkout-btn" disabled={cart.items.length === 0} onClick={() => setShowCheckout(true)}>Checkout</button>
      {showCheckout && <CheckoutModal onClose={() => setShowCheckout(false)} onSubmit={checkout} total={cart.total} />}
      {receipt && (
        <div className="receipt-modal" onClick={() => setReceipt(null)}>
          <div className="receipt" onClick={e => e.stopPropagation()}>
            <h2>Receipt</h2>
            <p>Order #{receipt.orderId}</p>
            <p>Total: ${receipt.total.toFixed(2)}</p>
            <p>Date: {new Date(receipt.timestamp).toLocaleString()}</p>
            <ul>
              {receipt.items.map(it => <li key={it.productId}>{it.qty} x {it.name} @ ${it.price.toFixed(2)}</li>)}
            </ul>
            <button onClick={() => setReceipt(null)}>Close</button>
          </div>
        </div>
      )}
      {loading && <div className="loading">Loading...</div>}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
