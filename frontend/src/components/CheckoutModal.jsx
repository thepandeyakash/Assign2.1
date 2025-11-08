import React, { useState } from 'react';

export default function CheckoutModal({ onClose, onSubmit, total }) {
  const [form, setForm] = useState({ name: '', email: '' });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function submit(e) {
    e.preventDefault();
    onSubmit(form);
  }

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
