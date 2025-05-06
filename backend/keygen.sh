#!/bin/bash

openssl genpkey -algorithm RSA -out jwtRS256.key -pkeyopt rsa_keygen_bits:2048
openssl rsa -pubout -in jwtRS256.key -out jwtRS256.key.pub