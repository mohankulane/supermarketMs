# FreshMart Supermarket Management

FreshMart is a responsive supermarket management app with a blue-themed POS, inventory, invoices, customers, purchases, suppliers, returns, expenses, reports, settings, and MongoDB.

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

On the first visit, create the single Owner account with the first-run setup
form. The Owner can add team accounts, assign page and management permissions,
and issue temporary passwords. New users must change their temporary password
at first sign-in. Cashier accounts start with Sales/POS access only. In
production, set a persistent, randomly generated `SESSION_SECRET` and set
`CLIENT_ORIGIN` to the exact HTTPS URL serving the frontend in `server/.env`.
For example, generate a secret with
`node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"`.

## Project structure

- `src/pages/` contains one React page per file; shared UI components live in `src/components/`.
- `server/src/models/`, `controllers/`, `services/`, and `routes/` keep each API resource in its own file. For example, products use `Product.model.js`, `product.controller.js`, `product.service.js`, and `product.routes.js`.
- `server/src/app.js` mounts the individual API route modules, while `server/src/server.js` connects to MongoDB and starts the server.

## Included operations

- Sales: product search, categories, cart quantities, remove items, payment method selection, checkout, and automatic stock deduction.
- Inventory: searchable products, low-stock status, add product modal, stock receive/adjust controls, and SKU tracking.
- Purchases and suppliers: record partial/full invoice payments, track paid and outstanding balances per supplier, and add a new product while creating a purchase.
- Dashboard: sales and expense totals from all available records, with weekly, monthly, and yearly sales charts.
- Customers: customer directory with visits, spend, and last visit.
- Reports: exportable sales, inventory valuation, expenses, supplier balances, purchases, customer activity, returns, and top-selling products with date filters.
- Settings: store information, logo, payment methods, team permissions, and audit history.
- Access control: email/password sign-in with server-enforced page and action permissions.

## API endpoints

The API includes permission-protected routes for products, suppliers, customers,
purchases, sales, returns, expenses, dashboard aggregates, and reports. Sales
reduce product stock and create stock movement records. Shifts are not part of
the system.
