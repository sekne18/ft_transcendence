FROM node:22.15.0-alpine

# Install build dependencies
RUN apk update && apk add --no-cache \
  python3 \
  py3-pip \
  make \
  g++ \
  bash

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY dist/ /app/

COPY jwtRS256.key* .

EXPOSE 3000

CMD ["node", "server.js"]
