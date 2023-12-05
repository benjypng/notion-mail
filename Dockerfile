FROM --platform=linux/amd64 node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

CMD npm start
