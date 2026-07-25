# Nginx & Environment Variables Configuration - Update Summary

**Date**: 2025-01-14  
**Updated**: Frontend nginx configuration with environment variable support

## Overview

The frontend nginx configuration has been updated to support **dynamic environment variables**, enabling seamless deployment across different environments (local, staging, production) without rebuilding the Docker image.

## What Changed

### 1. **Frontend/nginx.conf** - Updated Configuration

**Before:** Hardcoded proxy addresses
```nginx
location /api {
    proxy_pass http://cart-service:8080;
}
```

**After:** Dynamic upstream configuration with environment variables
```nginx
upstream cart_service {
    server ${CART_SERVICE_URL};
}

location /api/cart {
    proxy_pass http://cart_service;
}
```

#### Key Improvements:
- ✅ Separate upstream blocks for each microservice
- ✅ Environment variable placeholders for all backend URLs
- ✅ Individual route prefixes for better API organization (`/api/cart`, `/api/orders`, etc.)
- ✅ Enhanced proxy headers including `X-Forwarded-Host` and `X-Forwarded-Port`
- ✅ Extended timeout settings (90 seconds)
- ✅ Support for WebSocket upgrades
- ✅ Better error handling and health checks

### 2. **Frontend/Dockerfile** - Added Environment Variable Support

**Key Changes:**
- Installs `gettext-base` package (provides `envsubst` command)
- Renames nginx.conf to template: `nginx.conf.template`
- Sets default environment variables for microservices
- Creates entrypoint script that:
  - Substitutes environment variables into nginx config at startup
  - Starts nginx with the dynamically configured proxy

**Default Environment Variables:**
```dockerfile
ENV CART_SERVICE_URL=cart-service:8080
ENV ORDERS_SERVICE_URL=orders-service:8081
ENV PRODUCTS_SERVICE_URL=products-service:8082
ENV USER_SERVICE_URL=users-service:8083
```

### 3. **docker-compose.yml** - Updated Frontend Service

**Before:**
```yaml
frontend:
  environment:
    REACT_APP_ENV: production
  depends_on:
    - cart-service
    - orders-service
```

**After:**
```yaml
frontend:
  environment:
    REACT_APP_ENV: production
    # Nginx upstream service URLs
    CART_SERVICE_URL: cart-service:8080
    ORDERS_SERVICE_URL: orders-service:8081
    USER_SERVICE_URL: users-service:8082
    PRODUCTS_SERVICE_URL: products-service:8083
  depends_on:
    cart-service:
      condition: service_healthy
    orders-service:
      condition: service_healthy
    users-service:
      condition: service_healthy
    products-service:
      condition: service_healthy
  healthcheck:
    test: curl -f http://localhost/health || exit 1
```

**Improvements:**
- Environment variables passed to nginx proxy
- Health checks on all dependencies before starting
- Added health check endpoint for the frontend

### 4. **Frontend/.env.example** - Comprehensive Environment Template

Updated with clear sections for:
- **Nginx Proxy Configuration** - Backend microservice URLs
- **React Application Variables** - Frontend API endpoints

### 5. **Frontend/DEPLOYMENT_GUIDE.md** - New Comprehensive Guide

Complete deployment documentation including:
- Architecture overview with diagrams
- Environment variable reference
- 4 deployment scenarios:
  1. Local development with Docker Compose
  2. Staging/Production with external services
  3. Azure Container Apps configuration
  4. Kubernetes deployment example
- API routing documentation
- Troubleshooting guide
- Security best practices

### 6. **Frontend/README_PRODUCTION.md** - Updated with Deployment Info

Added new section covering:
- Quick start Docker commands
- Environment variable table
- Docker Compose deployment
- Links to full deployment guide

## API Routing Architecture

```
Client Request
    ↓
┌─────────────────────────────────┐
│   Frontend Container (Nginx)    │
│   Listening on Port 80          │
└─────────────────────────────────┘
    ↓
    ├─ /api/cart         → ${CART_SERVICE_URL}
    ├─ /api/orders       → ${ORDERS_SERVICE_URL}
    ├─ /api/products     → ${PRODUCTS_SERVICE_URL}
    ├─ /api/users        → ${USER_SERVICE_URL}
    └─ /auth             → ${USER_SERVICE_URL}
    ↓
Backend Microservices (Docker Network or External)
```

## Deployment Examples

### Local Development
```bash
cd KFC_Micro_service
docker-compose up
# Accesses services via Docker network: cart-service:8080, etc.
```

### Production with External Services
```bash
docker run \
  -e CART_SERVICE_URL=https://cart-api.prod.example.com:8080 \
  -e ORDERS_SERVICE_URL=https://orders-api.prod.example.com:8081 \
  -e PRODUCTS_SERVICE_URL=https://products-api.prod.example.com:8082 \
  -e USER_SERVICE_URL=https://auth-api.prod.example.com:8083 \
  -p 3000:80 \
  kfc-frontend:latest
```

### Azure Container Apps
Set environment variables in Container Apps portal or via Azure CLI:
```bash
az containerapp create \
  --environment-variables \
  CART_SERVICE_URL=https://cart-api.azurecontainerapps.io:8080 \
  ORDERS_SERVICE_URL=https://orders-api.azurecontainerapps.io:8081 \
  # ... etc
```

## File Structure After Update

```
Frontend/
├── nginx.conf              ← Updated config template markers
├── Dockerfile              ← Added envsubst support
├── DEPLOYMENT_GUIDE.md     ← NEW: Comprehensive deployment guide
├── README_PRODUCTION.md    ← Updated with deployment info
├── .env.example            ← Updated with full variable docs
└── [other files...]
```

## How It Works

1. **Container Build Time:**
   - `gettext-base` is installed (provides `envsubst`)
   - React app is built with static paths pointing to `/api/*`

2. **Container Startup:**
   - Entrypoint script executes
   - `envsubst` reads environment variables
   - Dynamically generates nginx config from template
   - Nginx starts with the configured upstream servers

3. **Runtime:**
   - Requests to `/api/cart` → proxied to `CART_SERVICE_URL`
   - Requests to `/api/orders` → proxied to `ORDERS_SERVICE_URL`
   - Static assets are cached (30 days)
   - Security headers are applied
   - Gzip compression is enabled

## Benefits

✅ **Single Docker image for all environments** - no rebuild needed  
✅ **Environment-specific configuration** - easy environment switching  
✅ **Better microservice organization** - separate routes per service  
✅ **Production-ready** - security headers, compression, caching  
✅ **Scalable** - works with Docker, Kubernetes, cloud platforms  
✅ **Documented** - comprehensive deployment guide included  

## Testing the Configuration

### Build and Run
```bash
# Build the image
docker build -t kfc-frontend:latest ./Frontend

# Run with default settings
docker run -p 3000:80 kfc-frontend:latest

# Check if frontend is accessible
curl http://localhost/health
```

### Verify Nginx Configuration
```bash
# View generated nginx config
docker exec kfc-frontend cat /etc/nginx/conf.d/default.conf

# Test nginx config syntax
docker exec kfc-frontend nginx -t

# Reload configuration
docker exec kfc-frontend nginx -s reload
```

### Test Proxy Routes
```bash
# Test cart service proxy
docker exec kfc-frontend curl -v http://localhost/api/cart

# Check environment variables
docker inspect <container-id> | grep -A 30 '"Env"'
```

## Backward Compatibility

✅ **Fully backward compatible** - Default environment variables work with existing docker-compose.yml  
✅ **No breaking changes** - Existing deployments will work as-is  
✅ **Optional enhancement** - Use only when deploying to custom environments  

## Documentation

- **[DEPLOYMENT_GUIDE.md](./Frontend/DEPLOYMENT_GUIDE.md)** - Complete deployment scenarios and troubleshooting
- **[README_PRODUCTION.md](./Frontend/README_PRODUCTION.md)** - Production setup and API integration
- **[.env.example](./Frontend/.env.example)** - Environment variable reference

## Next Steps

1. **Test locally:**
   ```bash
   docker-compose up
   curl http://localhost:3000
   ```

2. **Deploy to production:**
   - Set environment variables for your backend services
   - Use the same Docker image across environments
   - See [DEPLOYMENT_GUIDE.md](./Frontend/DEPLOYMENT_GUIDE.md) for specific platforms

3. **Monitor:**
   - Check `/health` endpoint for frontend status
   - Review nginx access logs for traffic patterns
   - Monitor microservice connectivity

---

**For detailed information, see:**
- [Frontend/DEPLOYMENT_GUIDE.md](./Frontend/DEPLOYMENT_GUIDE.md)
- [Frontend/README_PRODUCTION.md](./Frontend/README_PRODUCTION.md)
- [Frontend/.env.example](./Frontend/.env.example)
