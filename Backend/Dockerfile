FROM node:20-alpine

WORKDIR /app

# Environment variables
ENV NODE_ENV=production
ENV FRONTEND_URL=$FRONTEND_URL
ENV DB_URL=$DB_URL

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application code
COPY . .

# Expose port
EXPOSE 8080

# Health check

# Start application
CMD ["npm", "start"]
