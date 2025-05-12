FROM nginx:stable-alpine

RUN apk update && \
	apk add --no-cache openssl

RUN mkdir -p nginx/ssl

RUN openssl req -x509 -nodes -days 365 \
  -newkey rsa:2048 \
  -keyout nginx/ssl/selfsigned.key \
  -out nginx/ssl/selfsigned.crt \
  -subj "/CN=localhost"

COPY nginx.conf /etc/nginx/nginx.conf
