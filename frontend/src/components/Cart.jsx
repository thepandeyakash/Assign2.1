import React from 'react';

export default function Cart({ cart, updateQty, removeItem }) {
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
                value={it.qty}
                onChange={e => updateQty(it.id, it.productId, Number(e.target.value))}
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
