# Build Stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy source code
COPY . .

# Build the project
RUN npm run build

# Production Stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy built files from build stage
COPY --from=build /app/dist ./dist

# Expose the port the app runs on
EXPOSE 4000

# Set environment variables
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]
