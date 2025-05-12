FROM nginx:stable-alpine

RUN apk update && \
	apk add --no-cache openssl

COPY nginx.conf /etc/nginx/nginx.conf
