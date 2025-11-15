FROM node:24-slim

WORKDIR /stonk-bot

RUN umask 0022

COPY package.json ./
COPY pnpm-lock.yaml ./
COPY eslint.config.mjs ./
COPY .env ./
COPY src ./src

# Enable corepack
RUN chmod 644 .env && sed -i 's/PREFIX=!/PREFIX=$/' .env && corepack enable

# build
RUN pnpm install

# run
CMD [ "pnpm", "start" ]
