# --- Build Stage ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY postcss.config.js ./
COPY tailwind.config.ts ./
COPY drizzle.config.ts ./
COPY client ./client
COPY server ./server
COPY shared ./shared
RUN npm install
RUN npm run build

# --- Production Stage ---
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist/public ./dist/public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/shared/schema.ts ./shared/schema.ts
COPY package*.json ./
RUN test -f ./dist/public/index.html || (echo "ERROR: Frontend build missing!" && exit 1)
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/index.js"]

