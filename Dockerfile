FROM node:16

WORKDIR /stonk-bot

COPY package.json ./
COPY tsconfig.json ./
COPY yarn.lock ./
COPY .eslintrc.js ./
COPY .env ./
COPY src ./src

RUN sed -i 's/PREFIX=!/PREFIX=$/' .env && umask 0077 && yarn && yarn build

CMD [ "node", "./dist/index.js" ]
