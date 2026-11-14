FROM node:22-bookworm-slim AS deps
WORKDIR /repo
ENV HUSKY=0
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY web/package.json web/
COPY expo-app/package.json expo-app/
RUN npm ci --workspace=liftledger-web --include-workspace-root=false
FROM deps AS build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build --workspace=liftledger-web
FROM node:22-bookworm-slim AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build /repo/web/.next/standalone ./
COPY --from=build /repo/web/.next/static ./web/.next/static
COPY --from=build /repo/web/public ./web/public
USER node
EXPOSE 3000
CMD ["node", "web/server.js"]
