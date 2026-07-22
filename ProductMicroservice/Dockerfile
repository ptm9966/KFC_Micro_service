FROM node:20-alpine

WORKDIR /app

# Environment variables
ENV NODE_ENV=production
ENV DB_URL=$DB_URL

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application code
COPY . .

# Expose port
EXPOSE 8083

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8083/api-docs || exit 1

# Start application
CMD ["npm", "start"]