# Kudwa ETL — Backend

Financial data ETL integration API. Reads two JSON financial datasets, normalises and merges them into a unified Postgres schema, computes a full Profit & Loss report, and exposes the result through a REST API.

---

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 22 |
| Language | TypeScript 5 |
| Framework | Express 4 |
| Validation | Zod 4 |
| ORM | Sequelize 6 + pg |
| Database | PostgreSQL |
| API Docs | Swagger / OpenAPI 3.0 |
| Test runner | Jest + ts-jest |
| Dev server | ts-node + nodemon |

---

## Project Structure

```
backend/
├── config/
│   └── config.js               # Sequelize CLI database config
├── data/
│   ├── data_set_1.json         # QuickBooks P&L export
│   └── data_set_2.json         # Time-series financial data
├── migrations/                 # Sequelize migrations
├── tests/
│   └── unit/                   # Unit tests for ETL transform functions
├── src/
│   ├── api/
│   │   ├── controllers/        # Request handlers (health, integration, reports)
│   │   └── routes/             # Express routers with Swagger annotations
│   ├── config/
│   │   ├── database.ts         # Sequelize connection
│   │   ├── logger.ts           # Logger
│   │   └── swagger.ts          # Swagger/OpenAPI setup
│   ├── etl/
│   │   ├── extract/            # Read raw JSON from disk
│   │   ├── transform/          # Normalise, merge, and build the P&L report
│   │   ├── load/               # Write normalised data to Postgres
│   │   └── index.ts            # Pipeline entry point
│   ├── middleware/
│   │   ├── errorHandler.ts     # Centralised error responses
│   │   ├── requestLogger.ts    # Per-request logging
│   │   └── responseFormatter.ts # Response wrapper
│   ├── models/                 # Sequelize model definitions
│   ├── schemas/                # Zod schemas for raw input validation
│   └── types/                  # Shared TypeScript types and constants
└── server.ts
```

---

## Database Schema

### `accounts`
Stores the normalised chart of accounts from both datasets.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `external_id` | STRING (unique) | Prefixed source id, e.g. `dataset_1__123` |
| `source` | STRING | `dataset_1` or `dataset_2` |
| `name` | STRING | Human-readable account name |
| `account_type` | STRING | `revenue`, `expense`, or `other` |
| `pl_group` | STRING | Raw P&L group from source, e.g. `Income`, `operating_expenses` |
| `currency` | STRING | ISO currency code |
| `depth` | INTEGER | Nesting depth in the source tree |
| `parent_external_id` | STRING | `external_id` of the parent account, or null |

### `transactions`
Stores one record per account-period pair — the financial amount for an account in a given reporting period.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `external_id` | STRING (unique) | `source__accountId__periodStart` |
| `source` | STRING | `dataset_1` or `dataset_2` |
| `date` | DATEONLY | Period start date |
| `period_end` | DATEONLY | Period end date |
| `amount` | DECIMAL | Balance for this account in this period |
| `currency` | STRING | ISO currency code |
| `description` | STRING | Account label |
| `transaction_type` | ENUM | `credit` or `debit` |
| `pl_group` | STRING | P&L category group |
| `account_id` | UUID (FK) | References `accounts` |

### `profit_loss_reports`
One record per pipeline run, storing the computed waterfall totals.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `period_start` | DATE | Earliest transaction date |
| `period_end` | DATE | Latest period end date |
| `period_label` | STRING | Human-readable range, e.g. `Jan 2020 – Aug 2022` |
| `currency` | STRING | ISO currency code |
| `total_revenue` | DECIMAL | Sum of all revenue |
| `total_cogs` | DECIMAL | Sum of cost of goods sold |
| `gross_profit` | DECIMAL | `total_revenue − total_cogs` |
| `total_expenses` | DECIMAL | Sum of operating expenses |
| `net_operating_income` | DECIMAL | `gross_profit − total_expenses` |
| `total_other_income` | DECIMAL | Sum of non-operating revenue |
| `total_other_expenses` | DECIMAL | Sum of non-operating expenses |
| `net_profit` | DECIMAL | Final bottom-line profit |
| `sources_integrated` | ARRAY | `["dataset_1", "dataset_2"]` |
| `status` | ENUM | `processing`, `complete`, or `failed` |

### `profit_loss_line_items`
The full line item tree for a report — section rows (depth 0) with account children (depth 1).

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `report_id` | UUID (FK) | References `profit_loss_reports` |
| `parent_id` | UUID (FK, self) | References another line item, or null for section rows |
| `name` | STRING | Account or section label |
| `category` | STRING | `revenue`, `expense`, or `calculated` |
| `pl_group` | STRING | Raw P&L group |
| `amount` | DECIMAL | Amount for this line |
| `depth` | INTEGER | `0` = section, `1` = account |
| `sort_order` | INTEGER | Controls display ordering |
| `period_start` | DATEONLY | |
| `period_end` | DATEONLY | |

---

## ETL Pipeline

The pipeline runs in three stages triggered by `POST /api/integration/run`.

```
Extract → Transform → Load
```

### Extract
Both datasets are read from disk in parallel.

### Transform
Four sequential steps:

1. **Normalise accounts** — traverse each dataset's account tree, producing a flat list of `NormalizedAccount` objects with consistent shape (same fields regardless of source)
2. **Normalise transactions** — extract one `NormalizedTransaction` per account-period pair. DS1 encodes periods as matrix columns; DS2 encodes them as separate period records
3. **Merge sources** — combine both datasets into a single deduplicated list. DS2 records win on `external_id` collision. Cross-source collisions cannot happen because each source prefixes its own ids
4. **Build P&L report** — aggregate the merged transactions into the financial waterfall:
   - Revenue → COGS → **Gross Profit** → Expenses → **Net Operating Income** → Other Income/Expenses → **Net Income**

### Load
All database writes happen inside a single Sequelize transaction so a partial failure leaves no orphaned rows. If the load fails, the transaction is rolled back and the report record is marked `failed`.

A concurrency guard at the top of the pipeline rejects new runs with `409` if a run with `status: processing` already exists.

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health/ready` | Readiness probe — checks DB connection |
| `GET` | `/api/health/live` | Liveness probe — confirms process is running |
| `POST` | `/api/integration/run` | Trigger the ETL pipeline |
| `GET` | `/api/integration/status` | Latest pipeline run status |
| `GET` | `/api/reports` | List all P&L reports (paginated) |
| `GET` | `/api/reports/:id` | Get a report with its full line item tree |
| `GET` | `/api-docs` | Swagger UI |

### Query parameters

`GET /api/reports` accepts:
- `limit` — number of results per page (default `20`, max `100`)
- `offset` — number of results to skip (default `0`)

### Response envelope

All endpoints return the same JSON shape:

```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "message": "error description" }
```

---

## Getting Started

There are two ways to run the backend: with Docker (recommended, no local setup required) or directly with Node.js.

---

### Option A — Docker (recommended)

#### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

#### 1. Start everything

```bash
cd backend
docker-compose up --build
```

This builds the image, starts a Postgres container, waits for it to be healthy, runs migrations, and starts the API — all in one command.

The server starts at `http://localhost:3000`.  
Swagger UI is available at `http://localhost:3000/api-docs`.

#### Other Docker commands

```bash
docker-compose up --build    # rebuild after code changes
docker-compose down          # stop and remove containers
docker-compose down -v       # stop and wipe the database volume
```

---

### Option B — Local Node.js

#### Prerequisites

- Node.js 22+
- PostgreSQL running locally

#### 1. Install dependencies

```bash
cd backend
npm install
```

#### 2. Configure environment

```bash
cp .env.template .env
```

Edit `.env`:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=kudwa
DB_USER=postgres
DB_PASSWORD=your_password

DATASET_1_PATH=./data/data_set_1.json
DATASET_2_PATH=./data/data_set_2.json
```

#### 3. Create the database

```bash
psql -U postgres -c "CREATE DATABASE kudwa;"
```

#### 4. Run migrations

```bash
npm run migrate
```

#### 5. Start the development server

```bash
npm run dev
```

The server starts at `http://localhost:3000`.  
Swagger UI is available at `http://localhost:3000/api-docs`.

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start with ts-node + nodemon (hot reload) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled output from `dist/` |
| `npm run typecheck` | Type-check without emitting files |
| `npm run migrate` | Run all pending migrations |
| `npm run migrate:create -- --name <name>` | Scaffold a new migration file |
| `npm run migrate:undo` | Roll back the last migration |
| `npm run migrate:undo:all` | Roll back all migrations |
| `npm test` | Run Jest test suite |
| `npm run test:watch` | Run Jest in watch mode |
