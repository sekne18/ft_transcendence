FROM node:22.15.0-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY ./dist .

COPY jwtRS256.key* .

EXPOSE 3000

CMD ["node", "server.js"]
