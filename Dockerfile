FROM oven/bun:1.3.13 AS build
WORKDIR /app
COPY package.json bun.lock ./
COPY server/package.json server/
COPY web/package.json web/
RUN bun install --frozen-lockfile
COPY server server
COPY web web
RUN bun run --cwd web build \
 && bun build server/src/index.ts --target bun --outfile server/dist/server.js

FROM oven/bun:1.3.13-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3000 DB_PATH=/data/preco-vivo.db WEB_DIST=/app/web
COPY --from=build /app/server/dist/server.js ./server.js
COPY --from=build /app/web/dist ./web
RUN mkdir -p /data && chown bun:bun /data
USER bun
VOLUME /data
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD ["bun", "-e", "const r = await fetch('http://127.0.0.1:3000/health'); process.exit(r.ok ? 0 : 1)"]
CMD ["bun", "server.js"]
