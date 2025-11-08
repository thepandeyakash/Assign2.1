# Mock E-Com Cart 

Full-stack shopping cart demo for internship screening.

- Backend: Node + Express + MongoDB (Mongoose)
- Frontend: React + Vite
- REST APIs with simple persistence and mock checkout

## Quick start

Open two terminals in this folder and run backend then frontend.

### Backend
1. Configure MongoDB
	- Local: Install MongoDB Community Server (default URI `mongodb://127.0.0.1:27017/vibe_cart`).
	- Atlas: Create free cluster; copy connection string.
2. Create environment file
```
powershell
cd backend
Copy-Item .env.example .env
# Edit .env and set MONGODB_URI if using Atlas
```
3. Install deps & run
```
powershell
npm install
npm run dev
```
Server runs on http://localhost:4000 and seeds products on first run.

### Frontend
No build step required (CDN React). The backend serves the static files.

Start only the backend server, then open http://localhost:4000 in your browser.

## Features
- Product grid with Add to Cart
- Cart view: list items, change quantities, remove items, live totals
- Checkout form (name/email) -> receipt modal; persists order and clears cart
- Responsive layout
- Bonus: Persistence (JSON file), basic error handling; easy swap to SQLite/Mongo later

### Persistence Implementation
MongoDB via Mongoose models (`Product`, `CartItem`, `Order`). Orders embed order items. Products are seeded automatically if empty.

## API
- GET /api/products
- GET /api/cart
- POST /api/cart { productId, qty }
- DELETE /api/cart/:id
- POST /api/checkout { name, email }
- GET /api/orders (bonus)

