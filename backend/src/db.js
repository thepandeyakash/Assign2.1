import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price_cents: { type: Number, required: true },
  image: { type: String }
});

const CartItemSchema = new mongoose.Schema({
  userId: { type: Number, required: true }, // mock user
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  qty: { type: Number, required: true, min: 1 }
});

const OrderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  qty: { type: Number, required: true },
  price_cents: { type: Number, required: true },
  name: { type: String, required: true }
});

const OrderSchema = new mongoose.Schema({
  userId: { type: Number, required: true },
  total_cents: { type: Number, required: true },
  created_at: { type: Date, default: () => new Date() },
  name: { type: String, required: true },
  email: { type: String, required: true },
  items: [OrderItemSchema]
});

export const Product = mongoose.model('Product', ProductSchema);
export const CartItem = mongoose.model('CartItem', CartItemSchema);
export const Order = mongoose.model('Order', OrderSchema);

let memoryServer = null;
export async function connectMongo() {
  let uri = process.env.MONGODB_URI;
  if (!uri) {
    // Fallback to in-memory Mongo for easy local runs
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri();
    process.env.MONGODB_URI = uri;
    // eslint-disable-next-line no-console
    console.log('[Mongo] Using in-memory MongoDB instance');
  }
  try {
    await mongoose.connect(uri, {});
  } catch (err) {
    // As a second attempt, try memory server if provided URI failed
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri();
    process.env.MONGODB_URI = uri;
    // eslint-disable-next-line no-console
    console.log('[Mongo] Connection failed, falling back to in-memory MongoDB instance');
    await mongoose.connect(uri, {});
  }
}

export async function closeMongo() {
  await mongoose.connection.close();
  if (memoryServer) await memoryServer.stop();
  memoryServer = null;
}

export async function seedProductsIfEmpty() {
  const count = await Product.estimatedDocumentCount();
  if (count > 0) return;
  const img = (q) => `https://source.unsplash.com/featured/400x300?${encodeURIComponent(q)}`;
  const products = [
    { name: 'Wireless Headphones', price_cents: 4999, image: img('headphones, wireless, audio') },
    { name: 'Smart Watch', price_cents: 7999, image: img('smartwatch, wearable, watch') },
    { name: 'Bluetooth Speaker', price_cents: 2999, image: img('bluetooth speaker, portable speaker') },
    { name: 'USB-C Charger', price_cents: 1999, image: img('usb-c charger, power adapter') },
    { name: 'Mechanical Keyboard', price_cents: 8999, image: img('mechanical keyboard, keycaps') },
    { name: 'Gaming Mouse', price_cents: 3999, image: img('gaming mouse, rgb mouse') },
    { name: 'HD Webcam', price_cents: 5499, image: img('webcam, hd webcam') },
    { name: 'Portable SSD 1TB', price_cents: 10999, image: img('portable ssd, external ssd') }
  ];
  await Product.insertMany(products);
}

// Update legacy images (picsum) to relevant ones based on product name
export async function refreshProductImages() {
  const products = await Product.find({}).lean();
  const img = (q) => `https://source.unsplash.com/featured/400x300?${encodeURIComponent(q)}`;
  const queryFor = (name) => {
    const n = name.toLowerCase();
    if (n.includes('headphone')) return 'headphones, wireless, audio';
    if (n.includes('smart watch') || n.includes('smartwatch')) return 'smartwatch, wearable, watch';
    if (n.includes('speaker')) return 'bluetooth speaker, portable speaker';
    if (n.includes('charger')) return 'usb-c charger, power adapter';
    if (n.includes('keyboard')) return 'mechanical keyboard, keycaps';
    if (n.includes('mouse')) return 'gaming mouse, rgb mouse';
    if (n.includes('webcam')) return 'webcam, hd webcam';
    if (n.includes('ssd')) return 'portable ssd, external ssd';
    return name;
  };
  const ops = [];
  for (const p of products) {
    if (!p.image || (typeof p.image === 'string' && p.image.includes('picsum.photos'))) {
      ops.push(Product.updateOne({ _id: p._id }, { $set: { image: img(queryFor(p.name)) } }));
    }
  }
  if (ops.length) await Promise.all(ops);
}

export function toDollars(cents) { return Number((cents / 100).toFixed(2)); }
export function toCents(amount) { return Math.round(Number(amount) * 100); }
