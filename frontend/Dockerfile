FROM node:20

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Use node for production or npm run dev for development
CMD ["npm", "run", "dev"]