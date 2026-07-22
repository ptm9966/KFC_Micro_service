FROM node:20-alpine

WORKDIR /app

# Environment variables
ENV NODE_ENV=production
ENV DB_URL=$DB_URL
ENV JWT_SECRET=$JWT_SECRET

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application code
COPY . .

# Expose port
EXPOSE 8082

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8082/auth/profile', {headers: {'Authorization': 'Bearer test'}}, (res) => { process.exit(res.statusCode === 401 ? 0 : 1) })" || exit 1

# Start application
CMD ["npm", "start"]