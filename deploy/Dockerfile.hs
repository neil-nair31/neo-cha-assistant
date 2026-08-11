FROM node:20-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package.json package-lock.json ./
COPY hs-lookup/package.json ./hs-lookup/
COPY server/package.json ./server/
COPY widget/package.json ./widget/
COPY notifications-digest/package.json ./notifications-digest/
COPY client-portal/package.json ./client-portal/
RUN npm ci --workspace=@neo-cha/hs-lookup --include-workspace-root 2>/dev/null || npm ci

COPY hs-lookup ./hs-lookup
COPY .env.example ./.env.example

ENV NODE_ENV=production
# Railway injects PORT; local docker default 8790
ENV PORT=8790
EXPOSE 8790
WORKDIR /app
CMD ["npm", "run", "start", "-w", "@neo-cha/hs-lookup"]
