# ── Stage 1: Install all dependencies (including dev) ─────────────────────────
FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci


# ── Stage 2: Compile TypeScript ───────────────────────────────────────────────
FROM deps AS builder

COPY tsconfig.json ./
COPY tsconfig.build.json ./
COPY src/ ./src/
COPY server.ts ./
RUN npm run build


# ── Stage 3: Production image ─────────────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Copy production node_modules (built clean, no src files)
COPY --from=deps /app/node_modules ./node_modules

# Copy compiled output
COPY --from=builder /app/dist ./dist

# Copy runtime assets
COPY .sequelizerc ./
COPY config/ ./config/
COPY migrations/ ./migrations/
COPY data/ ./data/

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3000

# Run pending migrations then start the server.
# sequelize-cli is available through node_modules/.bin since we copied the full
# node_modules from the deps stage.
CMD ["sh", "-c", "./node_modules/.bin/sequelize-cli db:migrate && node dist/server.js"]
