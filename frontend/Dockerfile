FROM node:20

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY postcss.config.js tailwind.config.js ./
RUN npm install
RUN npm install -D tailwindcss@latest postcss@latest autoprefixer@latest

# Copy the rest of the application
COPY . .

# Use node for production or npm run dev for development
CMD ["npm", "run", "dev"]