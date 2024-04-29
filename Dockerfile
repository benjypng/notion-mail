FROM --platform=linux/amd64 node:18-alpine

WORKDIR /app

COPY package.json pnpm-lock.json ./

RUN npm install -g pnpm

RUN pnpm install

COPY . .

CMD pnpm run start
