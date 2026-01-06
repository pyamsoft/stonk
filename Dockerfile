FROM node:24-slim

WORKDIR /stonk-bot

# Permissive umask
RUN umask 0022

# Copy src files
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY eslint.config.mjs ./
COPY src ./src

# Copy environment for Production
COPY .env.prod ./

# Build
RUN corepack enable && pnpm install

# run
CMD [ "pnpm", "start" ]
