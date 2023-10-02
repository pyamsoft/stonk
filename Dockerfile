FROM node:18-slim

WORKDIR /stonk-bot

RUN umask 0022

COPY package.json ./
COPY tsconfig.json ./
COPY yarn.lock ./
COPY .eslintrc.cjs ./
COPY .env ./
COPY src ./src

RUN chmod 644 .env && sed -i 's/PREFIX=!/PREFIX=$/' .env && yarn && yarn build

CMD [ "node", "./dist/index.js" ]
