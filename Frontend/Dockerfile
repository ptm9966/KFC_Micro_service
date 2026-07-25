FROM node:20-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build-time args for React envs (these are baked into the static build)
# Point to App Gateway or your API endpoint
ARG REACT_APP_CART_SERVICE_URL=https://yourdomain.com/api/cart
ARG REACT_APP_ORDERS_URL=https://yourdomain.com/api/orders
ARG REACT_APP_USERS_URL=https://yourdomain.com/api/users
ARG REACT_APP_PRODUCTS_URL=https://yourdomain.com/api/products
ARG REACT_APP_ENV=production

# Export them as ENV so the React build picks them up
ENV REACT_APP_CART_SERVICE_URL=$REACT_APP_CART_SERVICE_URL
ENV REACT_APP_ORDERS_URL=$REACT_APP_ORDERS_URL
ENV REACT_APP_USERS_URL=$REACT_APP_USERS_URL
ENV REACT_APP_PRODUCTS_URL=$REACT_APP_PRODUCTS_URL
ENV REACT_APP_ENV=$REACT_APP_ENV

# Build the application
RUN npm run build

# Production stage - using Nginx
FROM nginx:1.27-alpine

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built app from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost || exit 1

EXPOSE 80


CMD ["nginx", "-g", "daemon off;"]
