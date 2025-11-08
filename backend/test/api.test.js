import { createApp } from '../src/index.js';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { connectMongo, seedProductsIfEmpty } from '../src/db.js';

let mongod, app, server;

async function setupMemoryMongo() {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  await connectMongo();
  await seedProductsIfEmpty();
}

async function teardownMemoryMongo() {
  await mongoose.connection.close();
  if (mongod) await mongod.stop();
}

(async () => {
  try {
    await setupMemoryMongo();
    app = await createApp();

    const agent = request(app);

    const health = await agent.get('/api/health');
    console.log('Health:', health.body);

    const productsRes = await agent.get('/api/products');
    console.log('Products:', productsRes.body.length);
    const first = productsRes.body[0];

    const addRes = await agent.post('/api/cart').send({ productId: first.id, qty: 2 });
    console.log('Add cart:', addRes.status, addRes.body.total);

    const checkoutRes = await agent.post('/api/checkout').send({ name: 'Tester', email: 't@example.com' });
    console.log('Checkout:', checkoutRes.status, checkoutRes.body.orderId ? 'ok' : 'fail');

    const orders = await agent.get('/api/orders');
    console.log('Orders:', orders.body.orders.length);

    console.log('API tests PASS');
    await teardownMemoryMongo();
  } catch (e) {
    console.error('API tests FAIL', e);
    await teardownMemoryMongo();
    process.exit(1);
  }
})();
