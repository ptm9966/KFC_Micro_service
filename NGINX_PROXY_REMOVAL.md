# Nginx Proxy Removal - App Gateway Setup

**Date**: 2025-01-25  
**Change**: Removed nginx reverse proxy, now using Azure Application Gateway for path-based routing

## What Changed

### ✅ Removed

1. **Nginx proxy configuration** - No more `/api/*` route handling in nginx
2. **Environment variables for microservice URLs** - No longer needed in nginx
3. **Entrypoint script for environment substitution** - Not required
4. **Docker environment variable processing** - Simplified Dockerfile

### ✅ Simplified

**Before (Nginx Proxy):**
```
Client → Nginx (Proxy) → Microservices
         Port 80      (cart:8080, orders:8081, etc)
```

**After (App Gateway):**
```
Client → App Gateway (Path Routing) → Microservices
         yourdomain.com
           /api/cart/* → cart-service:8080
           /api/orders/* → orders-service:8081
           /api/products/* → products-service:8082
           /api/users/* → users-service:8083
```

## Files Updated

### Frontend/nginx.conf
- ✂️ Removed all `upstream` definitions
- ✂️ Removed all `proxy_pass` configurations
- ✂️ Removed `/api/*` and `/auth` location blocks
- ✅ Kept: Static file serving, SPA routing, security headers, compression
- ✅ Added: `/health` endpoint for App Gateway health checks

**Before:** ~180 lines with proxy configuration  
**After:** ~40 lines, pure static file serving

### Frontend/Dockerfile
- ✂️ Removed `gettext-base` installation
- ✂️ Removed entrypoint script
- ✂️ Removed `envsubst` configuration
- ✂️ Updated React build-time args to point to App Gateway domain
- ✅ Simplified to basic nginx container

### docker-compose.yml
- ✂️ Removed `CART_SERVICE_URL`, `ORDERS_SERVICE_URL`, etc. environment variables
- ✂️ Removed microservice URL configuration from frontend
- ✅ Frontend now only serves static React files
- ✅ Microservices exposed on their original ports (8080-8083)

### Frontend/.env.example
- ✂️ Removed nginx proxy variable documentation
- ✅ Added App Gateway routing explanation
- ✅ Clear examples for local development vs production

### Frontend/README_PRODUCTION.md
- ✂️ Removed nginx proxy deployment instructions
- ✅ Added App Gateway deployment quick start
- ✅ Link to complete [APP_GATEWAY_SETUP.md](./APP_GATEWAY_SETUP.md)

### New Files

1. **APP_GATEWAY_SETUP.md** - Complete Azure App Gateway setup guide
   - Path-based routing configuration
   - Backend pool setup
   - CLI commands for deployment
   - Traffic flow examples
   - Troubleshooting guide

## Architecture Benefits

### Before (Nginx Proxy)
```
Pro:
✅ Works without cloud infrastructure
✅ Flexible - can use with any platform
✅ Single image for all environments

Con:
❌ Extra hop/latency (client → nginx → service)
❌ Complex environment variable configuration
❌ Duplicate functionality of App Gateway
❌ Nginx needs custom configuration
```

### After (App Gateway)
```
Pro:
✅ Direct routing (client → service)
✅ Built-in SSL/TLS management
✅ WAF, rate limiting, monitoring
✅ Auto-scaling
✅ No proxy overhead
✅ Simpler configuration

Con:
❌ Requires Azure
❌ Not cloud-agnostic
❌ Higher cost than nginx
```

## Development vs Production

### Local Development (docker-compose)
```bash
docker-compose up

# Access directly:
# Frontend: http://localhost:3000
# Cart API: http://localhost:8080
# Orders API: http://localhost:8081
# Products API: http://localhost:8082
# Users API: http://localhost:8083
```

React API calls configured in `.env`:
```env
REACT_APP_CART_SERVICE_URL=http://localhost:8080
REACT_APP_ORDERS_URL=http://localhost:8081
REACT_APP_PRODUCTS_URL=http://localhost:8082
REACT_APP_USERS_URL=http://localhost:8083
```

### Production (Azure App Gateway)
```bash
# Build React app with App Gateway URLs
REACT_APP_CART_SERVICE_URL=https://yourdomain.com/api/cart \
REACT_APP_ORDERS_URL=https://yourdomain.com/api/orders \
REACT_APP_PRODUCTS_URL=https://yourdomain.com/api/products \
REACT_APP_USERS_URL=https://yourdomain.com/api/users \
npm run build

# Deploy frontend + setup App Gateway routing
# See APP_GATEWAY_SETUP.md for detailed steps
```

## Deployment Steps

### 1. Local Testing
```bash
docker-compose up
# Test at http://localhost:3000
```

### 2. Build Production Image
```bash
docker build -t myregistry.azurecr.io/kfc-frontend:latest ./Frontend
docker push myregistry.azurecr.io/kfc-frontend:latest
```

### 3. Deploy to Azure
- Deploy microservices to Azure Container Instances or Container Apps
- Deploy frontend container
- Create Application Gateway with path-based routing
- See [APP_GATEWAY_SETUP.md](./APP_GATEWAY_SETUP.md) for complete CLI commands

### 4. Configure React App
Build React with production App Gateway URLs before deployment.

## What This Means

✂️ **Simpler Frontend** - Nginx now only serves static React files  
✂️ **No Proxy Logic** - App Gateway handles all routing  
✂️ **No Environment Variables for Services** - Point React to App Gateway domain  
✅ **Cloud-Native** - Optimized for Azure deployment  

## Migration Guide (If Coming from Nginx Proxy)

If you were previously using the nginx proxy setup:

1. **Stop using environment variables:**
   - Remove `CART_SERVICE_URL`, `ORDERS_SERVICE_URL`, etc.
   - These are now configured in App Gateway instead

2. **Update React API endpoints:**
   - Change from `http://localhost/api/cart` to service URLs
   - In production, use App Gateway domain: `https://yourdomain.com/api/cart`

3. **Deploy differently:**
   - Build React with correct API URLs (not localhost)
   - Deploy frontend container without proxy configuration
   - Configure App Gateway path-based routing

## Files Reference

| File | Purpose |
|------|---------|
| [APP_GATEWAY_SETUP.md](./APP_GATEWAY_SETUP.md) | Azure App Gateway complete setup guide |
| [Frontend/nginx.conf](./Frontend/nginx.conf) | Simple static file serving only |
| [Frontend/Dockerfile](./Frontend/Dockerfile) | Simplified Docker build |
| [docker-compose.yml](./docker-compose.yml) | Local development setup |
| [Frontend/.env.example](./Frontend/.env.example) | Environment variables for API endpoints |

## Support

For Azure App Gateway setup issues, see [APP_GATEWAY_SETUP.md](./APP_GATEWAY_SETUP.md)

For local development issues, run `docker-compose up` with `-v` for verbose logging.

---

**Summary:** Clean, simple architecture using App Gateway for routing instead of nginx proxy. Better performance, better monitoring, cloud-native design.
