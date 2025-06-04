FROM node:22-slim

WORKDIR /stonk-bot

RUN umask 0022

COPY package.json ./
COPY tsconfig.json ./
COPY pnpm-lock.yaml ./
COPY eslint.config.mjs ./
COPY .env ./
COPY src ./src

# Enable corepack
RUN chmod 644 .env && sed -i 's/PREFIX=!/PREFIX=$/' .env && corepack enable

# build
RUN pnpm install && pnpm run build

# run
CMD [ "node", "./dist/index.js" ]
