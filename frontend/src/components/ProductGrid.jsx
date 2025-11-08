import React from 'react';

export default function ProductGrid({ products, addToCart }) {
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
