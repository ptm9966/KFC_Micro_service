FROM node:20-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
ARG REACT_APP_BACKEND_URL
ARG REACT_APP_ORDERS_URL
ARG REACT_APP_USERS_URL
ARG REACT_APP_PRODUCTS_URL
ARG REACT_APP_AUTH0_DOMAIN
ARG REACT_APP_AUTH0_CLIENT_ID
ARG REACT_APP_AUTH0_CALLBACK_URL
ARG REACT_APP_AUTH0_AUDIENCE
ARG REACT_APP_AUTH0_SCOPE

ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL \
    REACT_APP_ORDERS_URL=$REACT_APP_ORDERS_URL \
    REACT_APP_USERS_URL=$REACT_APP_USERS_URL \
    REACT_APP_PRODUCTS_URL=$REACT_APP_PRODUCTS_URL \
    REACT_APP_AUTH0_DOMAIN=$REACT_APP_AUTH0_DOMAIN \
    REACT_APP_AUTH0_CLIENT_ID=$REACT_APP_AUTH0_CLIENT_ID \
    REACT_APP_AUTH0_CALLBACK_URL=$REACT_APP_AUTH0_CALLBACK_URL \
    REACT_APP_AUTH0_AUDIENCE=$REACT_APP_AUTH0_AUDIENCE \
    REACT_APP_AUTH0_SCOPE=$REACT_APP_AUTH0_SCOPE

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
