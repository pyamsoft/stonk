FROM node:18-slim

WORKDIR /stonk-bot

RUN umask 0022

COPY package.json ./
COPY tsconfig.json ./
COPY yarn.lock ./
COPY .yarnrc.yml ./
COPY .eslintrc.cjs ./
COPY .env ./
COPY src ./src

# Yarn build file
COPY .yarn/releases/yarn-4.2.2.cjs ./.yarn/releases/yarn-4.2.2.cjs

# Enable corepack
RUN chmod 644 .env && sed -i 's/PREFIX=!/PREFIX=$/' .env && corepack enable

# build
RUN yarn && yarn build

# run
CMD [ "node", "./dist/index.js" ]
