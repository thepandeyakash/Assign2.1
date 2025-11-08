import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { connectMongo, seedProductsIfEmpty, refreshProductImages, Product, CartItem, Order, toDollars } from './db.js';

dotenv.config();
const PORT = process.env.PORT || 4000;
export async function createApp() {
  const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MOCK_USER_ID = 1;

app.use(cors());
app.use(express.json());
  // Serve frontend statically (CDN-based React, no build step required)
  app.use(express.static(path.join(__dirname, '..', '..', 'frontend')));

  // Initialize MongoDB and seed products
  await connectMongo();
  await seedProductsIfEmpty();
  // Ensure images match product names (also updates any legacy seeded URLs)
  await refreshProductImages();

function mapProduct(row) {
  return {
    id: row.id,
    name: row.name,
    price: toDollars(row.price_cents),
    image: row.image || null,
  };
}

// GET /api/products
app.get('/api/products', async (req, res) => {
  const rows = await Product.find({}).lean();
  res.json(rows.map(r => ({ id: r._id, name: r.name, price: toDollars(r.price_cents), image: r.image || null })));
});

// GET /api/cart => items with product info + totals
app.get('/api/cart', async (req, res) => {
  const items = await CartItem.find({ userId: MOCK_USER_ID }).populate('product').lean();
  const mapped = items.map(ci => ({
    id: ci._id,
    productId: ci.product._id,
    name: ci.product.name,
    price: toDollars(ci.product.price_cents),
    qty: ci.qty,
    image: ci.product.image,
    lineTotal: toDollars(ci.product.price_cents * ci.qty)
  }));
  const total = mapped.reduce((sum, it) => sum + it.lineTotal, 0);
  res.json({ items: mapped, total: Number(total.toFixed(2)) });
});

// POST /api/cart { productId, qty }
app.post('/api/cart', async (req, res) => {
  try {
    const { productId, qty } = req.body || {};
    if (!Number.isInteger(qty) || qty <= 0 || !productId || typeof productId !== 'string') {
      return res.status(400).json({ error: 'Invalid productId or qty' });
    }
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const existing = await CartItem.findOne({ userId: MOCK_USER_ID, product: productId });
    if (existing) {
      existing.qty = qty;
      await existing.save();
    } else {
      await CartItem.create({ userId: MOCK_USER_ID, product: productId, qty });
    }
    const items = await CartItem.find({ userId: MOCK_USER_ID }).populate('product').lean();
    const mapped = items.map(ci => ({
      id: ci._id,
      productId: ci.product._id,
      name: ci.product.name,
      price: toDollars(ci.product.price_cents),
      qty: ci.qty,
      image: ci.product.image,
      lineTotal: toDollars(ci.product.price_cents * ci.qty)
    }));
    const total = mapped.reduce((sum, it) => sum + it.lineTotal, 0);
    res.status(201).json({ items: mapped, total: Number(total.toFixed(2)) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to add to cart' });
  }
});

// DELETE /api/cart/:id  => id can be cart item id or productId
app.delete('/api/cart/:id', async (req, res) => {
  const id = req.params.id;
  const byCart = await CartItem.deleteOne({ _id: id, userId: MOCK_USER_ID });
  if (byCart.deletedCount === 0) {
    await CartItem.deleteOne({ product: id, userId: MOCK_USER_ID });
  }
  return res.status(204).send();
});

// POST /api/checkout { name, email }
app.post('/api/checkout', async (req, res) => {
  try {
    const { name, email } = req.body || {};
    if (!name || !email) return res.status(400).json({ error: 'Name and email required' });

    const cartItems = await CartItem.find({ userId: MOCK_USER_ID }).populate('product').lean();
    if (cartItems.length === 0) return res.status(400).json({ error: 'Cart is empty' });

    const detailed = cartItems.map(ci => ({
      product: ci.product._id,
      qty: ci.qty,
      price_cents: ci.product.price_cents,
      name: ci.product.name
    }));
    const totalCents = detailed.reduce((sum, it) => sum + it.price_cents * it.qty, 0);
    const order = await Order.create({
      userId: MOCK_USER_ID,
      total_cents: totalCents,
      name,
      email,
      items: detailed
    });
    await CartItem.deleteMany({ userId: MOCK_USER_ID });

    const receipt = {
      orderId: order._id,
      total: toDollars(totalCents),
      totalCents: totalCents,
      timestamp: order.created_at || new Date().toISOString(),
      items: detailed.map(i => ({ productId: i.product, name: i.name, qty: i.qty, price: toDollars(i.price_cents) })),
      customer: { name, email }
    };
    res.status(201).json(receipt);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Checkout failed' });
  }
});

// BONUS: Order history endpoint
app.get('/api/orders', async (req, res) => {
  const orders = await Order.find({ userId: MOCK_USER_ID }).sort({ created_at: -1 }).lean();
  res.json({ orders: orders.map(o => ({ id: o._id, total: toDollars(o.total_cents), created_at: o.created_at, name: o.name, email: o.email })) });
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Admin utility (optional): refresh product images to match names
app.post('/api/admin/refresh-images', async (req, res) => {
  try {
    await refreshProductImages();
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to refresh images' });
  }
});

  return app;
}

// If run directly, start the server
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createApp().then(app => {
    app.listen(PORT, () => console.log(`API server listening on http://localhost:${PORT}`));
  }).catch(err => {
    console.error('Failed to start server', err);
    process.exit(1);
  });
}
