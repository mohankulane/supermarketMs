# FreshMart Supermarket Management

FreshMart is a complete supermarket management starter: a teal POS dashboard, catalog + cart workflow, combined product and stock workspace, supplier purchasing workspace, customers, reports, settings, and MongoDB via Docker.

## Run it locally

Set the same local-only MongoDB password in the root `.env` and
`server/.env` files using the provided examples. The actual `.env` files are
ignored by Git.

In the repository root, copy `.env.example` to `.env`, then start MongoDB and
the frontend:

```bash
cp .env.example .env
docker compose up -d
npm install
npm run dev
```

In a second terminal, configure and start the API:

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example .env` for each copy step.
Use a URL-encoded password in `MONGODB_URI` if it contains URI-reserved
characters.

## Project structure

- `src/pages/` contains one React page per file; shared UI components live in `src/components/`.
- `server/src/models/`, `controllers/`, `services/`, and `routes/` keep each API resource in its own file. For example, products use `Product.model.js`, `product.controller.js`, `product.service.js`, and `product.routes.js`.
- `server/src/app.js` mounts the individual API route modules, while `server/src/server.js` connects to MongoDB and starts the server.

## Included operations

- Sales: product search, categories, cart quantities, remove items, payment method selection, checkout, and automatic stock deduction.
- Inventory: searchable products, low-stock status, add product modal, stock receive/adjust controls, and SKU tracking.
- Suppliers: supplier cards, contact details, purchase metrics, and add supplier modal.
- Customers: customer directory with visits, spend, and last visit.
- Reports: revenue chart, payment mix, top products, and KPI summaries.
- Settings: store information, tax rate, receipt footer, and notification preferences.

## API endpoints

The API includes CRUD routes for products, suppliers, customers, purchases, sales, stock movements, dashboard aggregates, and sales reports. Sales reduce product stock and create stock movement records.
