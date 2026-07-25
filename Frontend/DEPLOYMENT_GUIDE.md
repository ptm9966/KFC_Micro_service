# Nginx Deployment Guide - Environment Variables

## Overview

The nginx configuration now supports dynamic environment variables, making it easy to deploy to different environments (development, staging, production) without rebuilding the Docker image.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend Container (Nginx)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  React Static App (Port 80)                             │    │
│  └─────────────────────────────────────────────────────────┘    │
│                            │                                      │
│                    ┌───────┴────────┐                            │
│                    │  Nginx Proxy   │                            │
│                    └───────┬────────┘                            │
│                            │                                      │
│      ┌─────────────────────┼─────────────────────┐              │
│      │                     │                     │              │
│  /api/cart          /api/orders         /api/products      /api/users  │
│      │                     │                     │              │
└──────┼─────────────────────┼─────────────────────┼──────────────┘
       │                     │                     │
       ▼                     ▼                     ▼              ▼
   Cart-Service      Orders-Service      Products-Service   User-Service
   (Port 8080)       (Port 8081)          (Port 8082)       (Port 8083)
```

## Environment Variables

### Nginx Proxy Configuration Variables

These variables configure the nginx reverse proxy to route requests to backend microservices:

| Variable | Purpose | Default | Example |
|----------|---------|---------|---------|
| `CART_SERVICE_URL` | Cart microservice URL | `cart-service:8080` | `http://cart-api.example.com:8080` |
| `ORDERS_SERVICE_URL` | Orders microservice URL | `orders-service:8081` | `http://orders-api.example.com:8081` |
| `PRODUCTS_SERVICE_URL` | Products microservice URL | `products-service:8082` | `http://products-api.example.com:8082` |
| `USER_SERVICE_URL` | User/Auth microservice URL | `users-service:8083` | `http://auth-api.example.com:8083` |

### React Application Variables

These are baked into the static build and used by React for client-side API calls:

| Variable | Purpose | Default | Example |
|----------|---------|---------|---------|
| `REACT_APP_CART_SERVICE_URL` | Cart service endpoint | `http://localhost/api/cart` | `https://api.example.com/api/cart` |
| `REACT_APP_ORDERS_URL` | Orders service endpoint | `http://localhost/api/orders` | `https://api.example.com/api/orders` |
| `REACT_APP_USERS_URL` | User service endpoint | `http://localhost/api/users` | `https://api.example.com/api/users` |
| `REACT_APP_PRODUCTS_URL` | Products service endpoint | `http://localhost/api/products` | `https://api.example.com/api/products` |

## Deployment Scenarios

### 1. Local Development with Docker Compose

```bash
# Use default values from docker-compose.yml
docker-compose up
```

The services communicate via Docker network:
- Nginx proxies to `cart-service:8080` (internal Docker network)
- React app at `http://localhost:3000`
- API routes: `http://localhost/api/*`

### 2. Staging/Production with External Services

#### Option A: Using Environment Variables in Docker

```bash
# Set environment variables before running container
docker run \
  -e CART_SERVICE_URL=http://cart-api-staging.example.com:8080 \
  -e ORDERS_SERVICE_URL=http://orders-api-staging.example.com:8081 \
  -e PRODUCTS_SERVICE_URL=http://products-api-staging.example.com:8082 \
  -e USER_SERVICE_URL=http://auth-api-staging.example.com:8083 \
  -p 3000:80 \
  kfc-frontend:latest
```

#### Option B: Using .env File in Docker Compose

Create `.env` file in project root:

```env
CART_SERVICE_URL=http://cart-api.production.example.com:8080
ORDERS_SERVICE_URL=http://orders-api.production.example.com:8081
PRODUCTS_SERVICE_URL=http://products-api.production.example.com:8082
USER_SERVICE_URL=http://auth-api.production.example.com:8083
```

Then run:

```bash
docker-compose up -f docker-compose.prod.yml
```

#### Option C: Azure Container Apps

In Azure Container Apps environment settings:

```
CART_SERVICE_URL=https://cart-api.azurecontainerapps.io:8080
ORDERS_SERVICE_URL=https://orders-api.azurecontainerapps.io:8081
PRODUCTS_SERVICE_URL=https://products-api.azurecontainerapps.io:8082
USER_SERVICE_URL=https://auth-api.azurecontainerapps.io:8083
```

#### Option D: Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
spec:
  template:
    spec:
      containers:
      - name: frontend
        image: kfc-frontend:latest
        ports:
        - containerPort: 80
        env:
        - name: CART_SERVICE_URL
          value: "http://cart-service.default.svc.cluster.local:8080"
        - name: ORDERS_SERVICE_URL
          value: "http://orders-service.default.svc.cluster.local:8081"
        - name: PRODUCTS_SERVICE_URL
          value: "http://products-service.default.svc.cluster.local:8082"
        - name: USER_SERVICE_URL
          value: "http://users-service.default.svc.cluster.local:8083"
```

## API Routing

Once the container is running, the nginx proxy routes requests as follows:

### Cart API
- **Frontend to Nginx:** `POST /api/cart/add`
- **Nginx to Cart Service:** `POST http://<CART_SERVICE_URL>/api/cart/add`

### Orders API
- **Frontend to Nginx:** `GET /api/orders`
- **Nginx to Orders Service:** `GET http://<ORDERS_SERVICE_URL>/api/orders`

### Products API
- **Frontend to Nginx:** `GET /api/products`
- **Nginx to Products Service:** `GET http://<PRODUCTS_SERVICE_URL>/api/products`

### User/Auth API
- **Frontend to Nginx:** `POST /api/users/login`
- **Nginx to User Service:** `POST http://<USER_SERVICE_URL>/api/users/login`

### Authentication
- **Frontend to Nginx:** `POST /auth/login`
- **Nginx to Auth Service:** `POST http://<USER_SERVICE_URL>/auth/login`

## How It Works

1. **Build Time:** React app is built with static asset URLs pointing to nginx paths (`/api/cart`, `/api/orders`, etc.)

2. **Container Start:** 
   - Dockerfile reads environment variables
   - `envsubst` processes `nginx.conf.template` and substitutes variable values
   - Nginx starts with the dynamically configured upstream servers

3. **Runtime:**
   - Nginx acts as a reverse proxy, routing requests to backend services
   - Security headers are automatically added
   - Gzip compression is enabled
   - Static assets are cached appropriately

## Troubleshooting

### Check Nginx Configuration

```bash
# Verify nginx config was properly generated
docker exec kfc-frontend cat /etc/nginx/conf.d/default.conf

# Reload nginx without restarting
docker exec kfc-frontend nginx -s reload

# Test nginx configuration
docker exec kfc-frontend nginx -t
```

### Test Proxy Connectivity

```bash
# Test from within the container
docker exec kfc-frontend curl -v http://cart-service:8080/api/cart

# View nginx access logs
docker logs kfc-frontend
```

### Verify Environment Variables

```bash
# Check if environment variables are being passed correctly
docker inspect kfc-frontend | grep -A 20 '"Env"'

# Or in docker-compose
docker-compose config | grep -A 10 "environment"
```

## Best Practices

1. **Use DNS Names:** In Docker/Kubernetes, use service names (e.g., `cart-service:8080`) instead of hardcoded IPs

2. **Separate React API URLs:** Keep `REACT_APP_*` variables pointing to `/api/*` paths on localhost, so they go through nginx

3. **Environment-Specific Configs:** Create separate `.env` files for different environments:
   - `.env.local` - Local development
   - `.env.staging` - Staging environment
   - `.env.production` - Production environment

4. **Health Checks:** Use the `/health` endpoint for monitoring:
   ```bash
   curl http://localhost/health
   ```

5. **Logging:** Monitor nginx access logs for traffic patterns and errors

## Security Considerations

- ✅ X-Frame-Options header prevents clickjacking
- ✅ X-Content-Type-Options prevents MIME sniffing
- ✅ X-XSS-Protection enables browser XSS filters
- ✅ Referrer-Policy protects user privacy
- ✅ SSL/TLS recommended for production

## Related Files

- [nginx.conf](./nginx.conf) - Nginx configuration template
- [Dockerfile](./Dockerfile) - Container build configuration
- [.env.example](./.env.example) - Example environment variables
- [docker-compose.yml](../docker-compose.yml) - Full stack composition

