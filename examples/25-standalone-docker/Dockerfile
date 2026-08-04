# ---- 1단계: 의존성 설치 ----
FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable pnpm || npm i -g pnpm
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install

# ---- 2단계: 빌드 ----
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable pnpm || npm i -g pnpm
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# ---- 3단계: 실행 ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

# standalone 출력만 복사합니다. node_modules 전체가 필요 없습니다.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
