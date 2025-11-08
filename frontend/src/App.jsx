import React, { useEffect, useState } from 'react';
import ProductGrid from './components/ProductGrid.jsx';
import Cart from './components/Cart.jsx';
import CheckoutModal from './components/CheckoutModal.jsx';

export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [showCheckout, setShowCheckout] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchProducts() {
    const res = await fetch('/api/products');
    setProducts(await res.json());
  }
  async function fetchCart() {
    const res = await fetch('/api/cart');
    setCart(await res.json());
  }

  useEffect(() => { fetchProducts(); fetchCart(); }, []);

  async function addToCart(productId, qty = 1) {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/cart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId, qty }) });
      if (!res.ok) throw new Error('Add to cart failed');
      setCart(await res.json());
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  async function updateQty(cartItemId, productId, qty) {
    await addToCart(productId, qty);
  }

  async function removeItem(id) {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/cart/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Remove failed');
      await fetchCart();
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  async function checkout(form) {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');
      setReceipt(data);
      await fetchCart();
      setShowCheckout(false);
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
