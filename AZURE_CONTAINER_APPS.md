# Azure Container Apps Setup for KFC Microservices

This guide explains how to deploy the cart, orders, users, products, and frontend services to Azure Container Apps as internal/private applications, then expose them through Azure Application Gateway.

## 1. Prerequisites

Make sure you have:

- An Azure subscription
- Azure CLI installed and logged in
- An Azure Container Registry (ACR) created
- A Container Apps environment created
- An Azure Application Gateway configured to route traffic to the internal apps

Example:

```bash
az login
az account set --subscription <subscription-id>

az group create --name kfc-rg --location eastus
az acr create --resource-group kfc-rg --name <acrname> --sku Basic
az extension add --name containerapp --upgrade
az provider register --namespace Microsoft.App
az provider register --namespace Microsoft.OperationalInsights

az containerapp env create \
  --name kfc-env \
  --resource-group kfc-rg \
  --location eastus
```

---

## 2. Build and Push Images

Build each service image and push it to ACR.

```bash
az acr login --name <acrname>
```

### Cart service

```bash
docker build -t <acrname>.azurecr.io/cart-service:latest ./cartMicroservice
docker push <acrname>.azurecr.io/cart-service:latest
```

### Orders service

```bash
docker build -t <acrname>.azurecr.io/orders-service:latest ./OrdersMicroservice
docker push <acrname>.azurecr.io/orders-service:latest
```

### Users service

```bash
docker build -t <acrname>.azurecr.io/users-service:latest ./UserMicroservice
docker push <acrname>.azurecr.io/users-service:latest
```

### Products service

```bash
docker build -t <acrname>.azurecr.io/products-service:latest ./ProductMicroservice
docker push <acrname>.azurecr.io/products-service:latest
```

### Frontend

The frontend is a React app, so the environment variables must be baked during the image build.

```bash
docker build \
  --build-arg REACT_APP_CART_SERVICE_URL=https://<cart-app-url> \
  --build-arg REACT_APP_ORDERS_URL=https://<orders-app-url> \
  --build-arg REACT_APP_USERS_URL=https://<users-app-url> \
  --build-arg REACT_APP_PRODUCTS_URL=https://<products-app-url> \
  -t <acrname>.azurecr.io/frontend:latest ./Frontend
docker push <acrname>.azurecr.io/frontend:latest
```

> Note: Runtime environment variables will not update a React build. The frontend values must be provided at build time.

---

## 3. Create Container App Secrets

Create secrets for sensitive values.

```bash
az containerapp secret set \
  --name cart-service \
  --resource-group kfc-rg \
  --secrets db-url="mongodb://<user>:<password>@<host>:<port>/carts-database?authSource=admin"

az containerapp secret set \
  --name users-service \
  --resource-group kfc-rg \
  --secrets db-url="mongodb://<user>:<password>@<host>:<port>/users-database?authSource=admin" \
  --secrets jwt-secret="your-super-secret-jwt-key"

az containerapp secret set \
  --name orders-service \
  --resource-group kfc-rg \
  --secrets db-url="mongodb://<user>:<password>@<host>:<port>/orders-database?authSource=admin"

az containerapp secret set \
  --name products-service \
  --resource-group kfc-rg \
  --secrets db-url="mongodb://<user>:<password>@<host>:<port>/products-database?authSource=admin"
```

---

## 4. Create Each Container App

All services should be deployed as internal Container Apps. Application Gateway will be the public entry point and will forward traffic to these private apps.

### Cart service

```bash
az containerapp create \
  --name cart-service \
  --resource-group kfc-rg \
  --environment kfc-env \
  --image <acrname>.azurecr.io/cart-service:latest \
  --target-port 8080 \
  --ingress internal \
  --registry-server <acrname>.azurecr.io \
  --cpu 0.5 \
  --memory 1.0Gi \
  --env-vars PORT=8080 DB_URL=secretref:db-url FRONTEND_URL=https://frontend.<your-domain-or-default-domain>
```

### Orders service

```bash
az containerapp create \
  --name orders-service \
  --resource-group kfc-rg \
  --environment kfc-env \
  --image <acrname>.azurecr.io/orders-service:latest \
  --target-port 8081 \
  --ingress internal \
  --registry-server <acrname>.azurecr.io \
  --cpu 0.5 \
  --memory 1.0Gi \
  --env-vars PORT=8081 DB_URL=secretref:db-url
```

### Users service

```bash
az containerapp create \
  --name users-service \
  --resource-group kfc-rg \
  --environment kfc-env \
  --image <acrname>.azurecr.io/users-service:latest \
  --target-port 8082 \
  --ingress internal \
  --registry-server <acrname>.azurecr.io \
  --cpu 0.5 \
  --memory 1.0Gi \
  --env-vars PORT=8082 DB_URL=secretref:db-url JWT_SECRET=secretref:jwt-secret
```

### Products service

```bash
az containerapp create \
  --name products-service \
  --resource-group kfc-rg \
  --environment kfc-env \
  --image <acrname>.azurecr.io/products-service:latest \
  --target-port 8083 \
  --ingress internal \
  --registry-server <acrname>.azurecr.io \
  --cpu 0.5 \
  --memory 1.0Gi \
  --env-vars PORT=8083 DB_URL=secretref:db-url
```

### Frontend

```bash
az containerapp create \
  --name frontend \
  --resource-group kfc-rg \
  --environment kfc-env \
  --image <acrname>.azurecr.io/frontend:latest \
  --target-port 80 \
  --ingress internal \
  --registry-server <acrname>.azurecr.io \
  --cpu 0.5 \
  --memory 1.0Gi \
  --env-vars REACT_APP_ENV=production
```

---

## 5. Required Environment Variables by Service

| Service | Required environment variables |
| --- | --- |
| Cart service | `PORT`, `DB_URL`, `FRONTEND_URL` |
| Orders service | `PORT`, `DB_URL` |
| Users service | `PORT`, `DB_URL`, `JWT_SECRET` |
| Products service | `PORT`, `DB_URL` |
| Frontend | `REACT_APP_CART_SERVICE_URL`, `REACT_APP_ORDERS_URL`, `REACT_APP_USERS_URL`, `REACT_APP_PRODUCTS_URL`, `REACT_APP_ENV` |

### Frontend values

Use the internal Application Gateway or internal DNS names for the backend services. The frontend should be built with the URLs that Application Gateway will expose.

```text
REACT_APP_CART_SERVICE_URL=https://<your-app-gateway-domain>/api/cart
REACT_APP_ORDERS_URL=https://<your-app-gateway-domain>/api/orders
REACT_APP_USERS_URL=https://<your-app-gateway-domain>/auth
REACT_APP_PRODUCTS_URL=https://<your-app-gateway-domain>/api/product
REACT_APP_ENV=production
```

---

## 6. Application Gateway Routing

After deployment:

1. Configure Azure Application Gateway with listeners and routing rules.
2. Expose only the frontend or the gateway public endpoint to users.
3. Route traffic to the internal Container Apps using backend pools and path-based rules.
4. Keep the backend and frontend Container Apps private by using internal ingress.

Example routing idea:

- `/` → frontend Container App
- `/api/cart/*` → cart Container App
- `/api/orders/*` → orders Container App
- `/auth/*` → users Container App
- `/api/product/*` → products Container App

## 7. Post-Deployment Checks

After deployment:

1. Open the Application Gateway public URL.
2. Verify each service health endpoint through the gateway:
   - Cart: `/api/cart`
   - Orders: `/api/orders`
   - Users: `/auth/login` or `/api-docs`
   - Products: `/api/product`
3. Confirm the frontend can reach the backend services through the gateway.

If you use a custom domain, update the frontend build args and the `FRONTEND_URL` value to the custom domain.
