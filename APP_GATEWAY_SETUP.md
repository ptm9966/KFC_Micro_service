# Azure App Gateway Deployment Guide

## Architecture: App Gateway with Direct Microservice Routing

```
┌─────────────────────────────────────────────────────────┐
│   Azure Application Gateway (yourdomain.com)            │
│   - SSL/TLS termination                                 │
│   - Path-based routing rules                            │
│   - WAF, rate limiting, monitoring                      │
└─────────────────────────────────────────────────────────┘
         │
    ┌────┼──────────┬──────────────┬──────────────┐
    ↓    ↓          ↓              ↓              ↓
  / /api/cart  /api/orders   /api/products   /api/users
  │
┌─────────────┐
│   React     │  (CDN or Static Storage Recommended)
│  Static App │
└─────────────┘

Or if hosting in ACI/Container Apps:

┌─────────────────────────────────────────────────────────┐
│   Azure Application Gateway (Port 443/80)               │
└─────────────────────────────────────────────────────────┘
         │
    ┌────┼──────────┬──────────────┬──────────────┐
    ↓    ↓          ↓              ↓              ↓
 Frontend Cart   Orders        Products        User
 (React)   Service Service     Service        Service
 Port 80   Port 8080 Port 8081 Port 8082     Port 8083
```

## Setup Options

### Option 1: React on Azure Storage + App Gateway (Recommended) ✅

**Benefits:**
- Fastest delivery (CDN)
- Cheapest option
- Best for static React apps
- App Gateway routes all API calls

**Steps:**

1. Build React app:
```bash
cd Frontend
npm run build
```

2. Upload to Azure Storage:
```bash
az storage account create \
  --name kfcstorageaccount \
  --resource-group myResourceGroup \
  --location eastus

# Enable static website
az storage blob service-properties update \
  --account-name kfcstorageaccount \
  --static-website \
  --index-document index.html \
  --404-document index.html

# Upload build files
az storage blob upload-batch \
  --account-name kfcstorageaccount \
  --destination '$web' \
  --source ./Frontend/build \
  --overwrite
```

3. Create App Gateway routing to static storage + microservices

### Option 2: Container Instances + App Gateway

**Steps:**

1. Build and push Docker image:
```bash
docker build -t myregistry.azurecr.io/kfc-frontend:latest ./Frontend
docker push myregistry.azurecr.io/kfc-frontend:latest
```

2. Deploy microservices to Azure Container Instances:
```bash
az container create \
  --name cart-service \
  --image myregistry.azurecr.io/cart-service:latest \
  --resource-group myResourceGroup \
  --ports 8080 \
  --environment-variables \
  PORT=8080 \
  NODE_ENV=production

# Repeat for orders, products, users services
```

3. Deploy frontend container
4. Create App Gateway with backend pools

### Option 3: Azure Container Apps + App Gateway

**Steps:**

1. Create container app environment:
```bash
az containerapp env create \
  --name kfc-env \
  --resource-group myResourceGroup \
  --location eastus
```

2. Deploy services:
```bash
az containerapp create \
  --name cart-service \
  --resource-group myResourceGroup \
  --environment kfc-env \
  --image myregistry.azurecr.io/cart-service:latest \
  --target-port 8080 \
  --ingress internal

# Repeat for all services (internal ingress - only App Gateway can reach)

# Deploy frontend
az containerapp create \
  --name kfc-frontend \
  --resource-group myResourceGroup \
  --environment kfc-env \
  --image myregistry.azurecr.io/kfc-frontend:latest \
  --target-port 80 \
  --ingress external  # Public, but only serves React
```

3. Create App Gateway pointing to services

---

## Azure Application Gateway Configuration

### Create the Application Gateway

```bash
# Create Application Gateway
az network application-gateway create \
  --name kfc-app-gateway \
  --location eastus \
  --resource-group myResourceGroup \
  --capacity 1 \
  --sku Standard_v2 \
  --http-settings-cookie-based-affinity Disabled \
  --frontend-port 80 \
  --http-settings-port 80 \
  --cert-file /path/to/cert.pfx \
  --cert-password yourpassword \
  --priority 1
```

### Create Backend Address Pools

```bash
# Frontend pool (React static app)
az network application-gateway address-pool create \
  --gateway-name kfc-app-gateway \
  --resource-group myResourceGroup \
  --name frontend-pool \
  --servers <frontend-container-ip>:80

# Cart service pool
az network application-gateway address-pool create \
  --gateway-name kfc-app-gateway \
  --resource-group myResourceGroup \
  --name cart-pool \
  --servers cart-service.eastus.azurecontainer.io:8080

# Orders service pool
az network application-gateway address-pool create \
  --gateway-name kfc-app-gateway \
  --resource-group myResourceGroup \
  --name orders-pool \
  --servers orders-service.eastus.azurecontainer.io:8081

# Products service pool
az network application-gateway address-pool create \
  --gateway-name kfc-app-gateway \
  --resource-group myResourceGroup \
  --name products-pool \
  --servers products-service.eastus.azurecontainer.io:8082

# Users service pool
az network application-gateway address-pool create \
  --gateway-name kfc-app-gateway \
  --resource-group myResourceGroup \
  --name users-pool \
  --servers users-service.eastus.azurecontainer.io:8083
```

### Create HTTP Settings

```bash
# Create HTTP settings for services
az network application-gateway http-settings create \
  --gateway-name kfc-app-gateway \
  --resource-group myResourceGroup \
  --name http-settings \
  --port 8080 \
  --protocol Http \
  --cookie-based-affinity Disabled

# For frontend (port 80)
az network application-gateway http-settings create \
  --gateway-name kfc-app-gateway \
  --resource-group myResourceGroup \
  --name frontend-settings \
  --port 80 \
  --protocol Http \
  --cookie-based-affinity Disabled
```

### Create Listeners

```bash
# Frontend listener
az network application-gateway http-listener create \
  --gateway-name kfc-app-gateway \
  --resource-group myResourceGroup \
  --name frontend-listener \
  --frontend-port 80 \
  --frontend-ip appGatewayFrontendIP

# API listener
az network application-gateway http-listener create \
  --gateway-name kfc-app-gateway \
  --resource-group myResourceGroup \
  --name api-listener \
  --frontend-port 80 \
  --frontend-ip appGatewayFrontendIP
```

### Create URL Path Map (Path-Based Routing)

```bash
# Create path map for APIs
az network application-gateway url-path-map create \
  --gateway-name kfc-app-gateway \
  --resource-group myResourceGroup \
  --name api-path-map \
  --paths "/api/cart/*" \
  --address-pool cart-pool \
  --http-settings http-settings

# Add more paths
az network application-gateway url-path-map rule create \
  --gateway-name kfc-app-gateway \
  --resource-group myResourceGroup \
  --name orders-rule \
  --url-path-map api-path-map \
  --paths "/api/orders/*" \
  --address-pool orders-pool \
  --http-settings http-settings

az network application-gateway url-path-map rule create \
  --gateway-name kfc-app-gateway \
  --resource-group myResourceGroup \
  --name products-rule \
  --url-path-map api-path-map \
  --paths "/api/products/*" \
  --address-pool products-pool \
  --http-settings http-settings

az network application-gateway url-path-map rule create \
  --gateway-name kfc-app-gateway \
  --resource-group myResourceGroup \
  --name users-rule \
  --url-path-map api-path-map \
  --paths "/api/users/*" \
  --address-pool users-pool \
  --http-settings http-settings

# Auth endpoints also to users pool
az network application-gateway url-path-map rule create \
  --gateway-name kfc-app-gateway \
  --resource-group myResourceGroup \
  --name auth-rule \
  --url-path-map api-path-map \
  --paths "/auth/*" \
  --address-pool users-pool \
  --http-settings http-settings
```

### Create Routing Rules

```bash
# Default rule for static app
az network application-gateway rule create \
  --gateway-name kfc-app-gateway \
  --resource-group myResourceGroup \
  --name default-rule \
  --priority 100 \
  --http-listener frontend-listener \
  --rule-type Basic \
  --address-pool frontend-pool \
  --http-settings frontend-settings

# API routing rule
az network application-gateway rule create \
  --gateway-name kfc-app-gateway \
  --resource-group myResourceGroup \
  --name api-rule \
  --priority 200 \
  --http-listener api-listener \
  --rule-type PathBasedRouting \
  --url-path-map api-path-map
```

---

## Docker Compose for Local Development

For testing locally with all services:

```bash
docker-compose up
```

Then access:
- Frontend: `http://localhost:3000`
- Cart API: `http://localhost:8080`
- Orders API: `http://localhost:8081`
- Products API: `http://localhost:8082`
- Users API: `http://localhost:8083`

---

## React Environment Configuration

Update React API calls to use App Gateway domain:

**For local development:**
```javascript
// src/config/api.js
const API_ENDPOINTS = {
  CART: process.env.REACT_APP_CART_SERVICE_URL || 'http://localhost:8080',
  ORDERS: process.env.REACT_APP_ORDERS_URL || 'http://localhost:8081',
  PRODUCTS: process.env.REACT_APP_PRODUCTS_URL || 'http://localhost:8082',
  USERS: process.env.REACT_APP_USERS_URL || 'http://localhost:8083',
};
```

**Build for production with App Gateway:**
```bash
# Build React app
REACT_APP_CART_SERVICE_URL=https://yourdomain.com/api/cart \
REACT_APP_ORDERS_URL=https://yourdomain.com/api/orders \
REACT_APP_PRODUCTS_URL=https://yourdomain.com/api/products \
REACT_APP_USERS_URL=https://yourdomain.com/api/users \
npm run build
```

---

## Traffic Flow Example

### User visits `https://yourdomain.com/`

1. Request hits App Gateway
2. Default rule routes to frontend pool
3. React app loads from frontend container
4. React app is served on path `/`

### User calls API: `https://yourdomain.com/api/cart/items`

1. Request hits App Gateway
2. Path-based routing detects `/api/cart/*`
3. Routes to cart-pool (Backend: `cart-service:8080`)
4. Request forwarded to cart microservice
5. Response returned through App Gateway to client

### Request to `/api/orders`

1. Path-based routing detects `/api/orders/*`
2. Routes to orders-pool
3. Forwarded to orders microservice

---

## Key Advantages

✅ **One entry point** - yourdomain.com  
✅ **SSL/TLS termination** at gateway  
✅ **Path-based routing** - no nginx needed  
✅ **WAF protection** available  
✅ **Auto-scaling** - microservices scale independently  
✅ **Geo-redundancy** - distribute across regions  
✅ **Performance** - optimized routing  

---

## Monitoring & Logging

```bash
# Check gateway status
az network application-gateway show \
  --gateway-name kfc-app-gateway \
  --resource-group myResourceGroup

# Enable diagnostics
az monitor diagnostic-settings create \
  --name gateway-diagnostics \
  --resource /subscriptions/{sub-id}/resourceGroups/myResourceGroup/providers/Microsoft.Network/applicationGateways/kfc-app-gateway \
  --logs '[{"category":"ApplicationGatewayAccessLog","enabled":true},{"category":"ApplicationGatewayPerformanceLog","enabled":true}]' \
  --workspace /subscriptions/{sub-id}/resourcegroups/myResourceGroup/providers/microsoft.operationalinsights/workspaces/myWorkspace
```

---

## Troubleshooting

### Backend not responding

```bash
# Check backend pool health
az network application-gateway probe show \
  --gateway-name kfc-app-gateway \
  --resource-group myResourceGroup \
  --name health-probe
```

### Route not working

1. Verify backend pool address
2. Check HTTP settings match backend port
3. Ensure path rules are correct
4. Check firewall rules allow traffic

### SSL certificate issues

```bash
# Renew certificate
az network application-gateway ssl-cert update \
  --gateway-name kfc-app-gateway \
  --resource-group myResourceGroup \
  --name cert-name \
  --cert-file newcert.pfx \
  --cert-password password
```

---

## Related Documentation

- [Azure Application Gateway Documentation](https://docs.microsoft.com/en-us/azure/application-gateway/)
- [Path-Based Routing](https://docs.microsoft.com/en-us/azure/application-gateway/url-route-overview)
- [Azure Container Instances](https://docs.microsoft.com/en-us/azure/container-instances/)
- [Azure Storage Static Websites](https://docs.microsoft.com/en-us/azure/storage/blobs/storage-blob-static-website)
