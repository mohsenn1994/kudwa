# Kudwa ETL — Backend

Financial data ETL integration API. Reads two JSON financial datasets, normalises and merges them into a unified Postgres schema, computes a full Profit & Loss report, and exposes the result through a REST API.

---

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 22 |
| Language | TypeScript 5 |
| Framework | Express 4 |
| ORM | Sequelize 6 + pg |
| Database | PostgreSQL |
| API Docs | Swagger / OpenAPI 3.0 |
| Dev server | ts-node + nodemon |

---

## Project Structure

---

## Database Schema

---

## ETL Pipeline

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health/ready` | Readiness probe — returns 200 when API is ready, 409 otherwise |
| `GET` | `/api/health/live` | Liveness probe — returns 200 when API is live, 409 otherwise |
| `GET` | `/api-docs` | Swagger UI |

### Responses

All endpoints return the same JSON shape:

```json
// Success
{ "success": true, "message": "OK", "data": { ... } }

// Error
{ "success": false, "error": "message", "code": 404 }
```

---

## Getting Started

### Prerequisites

- Node.js 22+
- PostgreSQL running locally (or via Docker)

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment

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

### 3. Create the database

```bash
psql -U postgres -c "CREATE DATABASE kudwa;"
```

### 4. Start the development server

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
| `npm run migrate` | Run pending migrations |
| `npm run migrate:undo` | Roll back the last migration |
| `npm run migrate:undo:all` | Roll back all migrations |
| `npm run seed` | Seed the database |
| `npm test` | Run Jest test suite |
| `npm run test:watch` | Run Jest in watch mode |
