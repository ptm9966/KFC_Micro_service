# Docker Compose Setup Guide

## Overview

This Docker Compose configuration runs the complete KFC application stack with:
- **MongoDB containers** for Cart, Orders, Users, and Products
- **Backend microservices** for Cart, Orders, Users, and Products
- **Frontend React app** served by Nginx
- **A shared Docker network** so containers can communicate by service name

## How service communication works

### Docker Compose network

All services are attached to the same Docker network:
```yaml
networks:
  kfc-network:
    driver: bridge
```

This allows containers to resolve each other by service name inside Docker.

### Backend services -> MongoDB

Each service connects to its own MongoDB container using the service hostname in `DB_URL`:
- `cart-service` -> `mongodb`
- `orders-service` -> `orders-mongodb`
- `users-service` -> `users-mongodb`
- `products-service` -> `products-mongodb`

Example for cart service:
```yaml
DB_URL: mongodb://admin:admin123456@mongodb:27017/kfc-database?authSource=admin
```

Because `cart-service` and `mongodb` are on the same Docker network, the hostname `mongodb` resolves to the MongoDB container.

### Frontend -> Backend

The frontend is a static React app served by the `frontend` container on port `80`, exposed to the host on port `3000`.

Frontend API URLs are provided at build time using environment variables:
- `REACT_APP_BACKEND_URL` = `http://localhost:8080`
- `REACT_APP_ORDERS_URL` = `http://localhost:8081`
- `REACT_APP_USERS_URL` = `http://localhost:8082`
- `REACT_APP_PRODUCTS_URL` = `http://localhost:8083`

Because the React app runs in the browser, `localhost` refers to the host machine. Docker Compose publishes the backend ports to the host so the browser can reach them.

### Request flow

1. User opens `http://localhost:3000`
2. Browser downloads the React app from the `frontend` container
3. React code calls backend APIs on `http://localhost:8080`, `8081`, `8082`, and `8083`
4. Docker forwards those host ports to the correct backend containers
5. Each backend service uses its internal MongoDB hostname to access its database

## Prerequisites

### Required Software

1. **Docker** - [Download](https://www.docker.com/products/docker-desktop)
   - Windows: Docker Desktop
   - Mac: Docker Desktop
   - Linux: Install Docker Engine and Docker Compose

2. **Docker Compose** - Usually included with Docker Desktop
   ```bash
   docker-compose --version
   ```

### Verify Installation

```bash
docker --version
docker-compose --version
```

## Quick Start

### 1. Start All Services

```bash
docker-compose up -d
```

**Output:**
```
Creating kfc-mongodb   ... done
Creating kfc-backend   ... done
Creating kfc-frontend  ... done
```

### 2. Check Service Status

```bash
docker-compose ps
```

**Output:**
```
NAME              STATUS              PORTS
kfc-mongodb       Up 2 minutes        27017/tcp
kfc-backend       Up 1 minute         0.0.0.0:8080->8080/tcp
kfc-frontend      Up 30 seconds       0.0.0.0:3000->3000/tcp
```

### 3. Access Applications

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8080
- **API Documentation:** http://localhost:8080/api-docs
- **MongoDB:** localhost:27017

### 4. Stop All Services

```bash
docker-compose down
```

To also remove volumes:
```bash
docker-compose down -v
```

## Service Configuration

### MongoDB Services

Each microservice uses its own MongoDB instance:
- `mongodb` for cart-service
- `orders-mongodb` for orders-service
- `users-mongodb` for users-service
- `products-mongodb` for products-service

Example connection string for cart-service:
```yaml
DB_URL: mongodb://admin:admin123456@mongodb:27017/kfc-database?authSource=admin
```

Use Docker service hostnames from inside Docker containers, and use `localhost` from the host machine or browser.

- Inside a container: `mongodb`, `cart-service`, `orders-service`, `users-service`, `products-service` are valid hostnames.
- From the browser: service names are not resolvable, so you must use host ports like `http://localhost:8080`.

### Backend microservices

#### Cart microservice
```yaml
cart-service:
  ports:
    - "8080:8080"
  environment:
    PORT: 8080
    DB_URL: mongodb://admin:admin123456@mongodb:27017/kfc-database?authSource=admin
    FRONTEND_URL: http://localhost:3000
```

#### Orders microservice
```yaml
orders-service:
  ports:
    - "8081:8081"
  environment:
    PORT: 8081
    DB_URL: mongodb://admin:admin123456@orders-mongodb:27017/orders-database?authSource=admin
```

#### Users microservice
```yaml
users-service:
  ports:
    - "8082:8082"
  environment:
    PORT: 8082
    DB_URL: mongodb://admin:admin123456@users-mongodb:27017/users-database?authSource=admin
    JWT_SECRET: your-super-secret-jwt-key-change-this-in-production
```

#### Products microservice
```yaml
products-service:
  ports:
    - "8083:8083"
  environment:
    PORT: 8083
    DB_URL: mongodb://admin:admin123456@products-mongodb:27017/products-database?authSource=admin
```

### Frontend service

The frontend container exposes port `80` inside Docker and maps it to host port `3000`.

```yaml
frontend:
  ports:
    - "3000:80"
  build:
    args:
      REACT_APP_BACKEND_URL: http://localhost:8080
      REACT_APP_ORDERS_URL: http://localhost:8081
      REACT_APP_USERS_URL: http://localhost:8082
      REACT_APP_PRODUCTS_URL: http://localhost:8083
```

The React app uses these values to call the backend APIs from the browser.

> Note: In this project, the frontend is built to call backend APIs using absolute host URLs (`http://localhost:8080`, etc.). That means those API requests go directly from the browser to the backend host ports, so the Nginx proxy in the `frontend` container is not used for those requests.
>
> Nginx still serves the static React files, but it only proxies API requests if the app uses relative paths like `/api` or `/auth` instead of absolute host URLs.
>
> If you want to use Docker service names, change the frontend to call relative URLs and let Nginx proxy them inside Docker. For example:
>
> - React client uses `/api/cart` instead of `http://localhost:8080/api/cart`
> - Nginx proxies `/api` to `http://cart-service:8080`
>
> Then the browser only talks to `http://localhost:3000`, and Nginx forwards the request to the internal service name `cart-service`.
>
> This is the only way the browser can indirectly use Docker service names: the request is routed through `frontend` Nginx, not by the browser directly resolving `cart-service`.

## Common Commands

### View Logs

**All services:**
```bash
docker-compose logs
```

**Specific service:**
```bash
docker-compose logs backend
docker-compose logs mongodb
docker-compose logs frontend
```

**Follow logs in real-time:**
```bash
docker-compose logs -f backend
```

### Execute Commands in Container

**Run command in backend:**
```bash
docker-compose exec backend npm list
```

**Access MongoDB shell:**
```bash
docker-compose exec mongodb mongosh --username admin --password admin123456
```

**Run command in frontend:**
```bash
docker-compose exec frontend npm list
```

### Rebuild Containers

After code changes:
```bash
docker-compose up -d --build
```

To rebuild specific service:
```bash
docker-compose up -d --build backend
```

### Remove Everything and Start Fresh

```bash
docker-compose down -v
docker-compose up -d
```

## Environment Variables

### Backend (.env)

Located in `Backend/.env`:
```env
PORT=8080
DB_URL=mongodb://admin:admin123456@mongodb:27017/kfc-database?authSource=admin
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)

Located in `Frontend/kfc-react-app/.env`:
```env
REACT_APP_BACKEND_URL=http://localhost:8080
REACT_APP_ENV=production
```

## Troubleshooting

### Issue: Port Already in Use

**Error:**
```
Error response from daemon: driver failed programming external connectivity on endpoint
```

**Solution:**

Option 1 - Change port in docker-compose.yml:
```yaml
ports:
  - "8081:8080"  # Use 8081 instead of 8080
```

Option 2 - Stop conflicting service:
```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :8080
kill -9 <PID>
```

### Issue: MongoDB Connection Refused

**Error:**
```
ECONNREFUSED 127.0.0.1:27017
```

**Solution:**
1. Check MongoDB is running:
   ```bash
   docker-compose ps mongodb
   ```

2. Check MongoDB logs:
   ```bash
   docker-compose logs mongodb
   ```

3. Verify connection string uses service name:
   ```
   mongodb://admin:admin123456@mongodb:27017/...
   ```

### Issue: Backend Connection Timeout

**Error:**
```
MongooseError: Cannot connect to MongoDB
```

**Solution:**
1. Ensure MongoDB is healthy:
   ```bash
   docker-compose logs mongodb
   ```

2. Rebuild services:
   ```bash
   docker-compose down -v
   docker-compose up -d --build
   ```

### Issue: Frontend Cannot Reach Backend

**Error:**
```
Failed to fetch http://localhost:8080/...
```

**Solution:**
1. Verify backend is running:
   ```bash
   curl http://localhost:8080/api/product
   ```

2. Check REACT_APP_BACKEND_URL in frontend .env

3. View frontend logs:
   ```bash
   docker-compose logs frontend
   ```

### Issue: Containers Not Starting

**Solution:**
1. Check logs:
   ```bash
   docker-compose logs
   ```

2. Rebuild images:
   ```bash
   docker-compose build --no-cache
   ```

3. Start again:
   ```bash
   docker-compose up -d
   ```

## Performance Optimization

### Memory Limits

Add to services in docker-compose.yml:
```yaml
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 512M
    reservations:
      cpus: '0.25'
      memory: 256M
```

### Database Persistence

Data is stored in Docker volumes:
```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect dramatic-road-5348_mongodb_data
```

## Production Considerations

### Change Default Credentials

1. Update MongoDB credentials in docker-compose.yml:
   ```yaml
   MONGO_INITDB_ROOT_USERNAME: your_username
   MONGO_INITDB_ROOT_PASSWORD: your_strong_password
   ```

2. Update Backend DB_URL:
   ```
   mongodb://your_username:your_strong_password@mongodb:27017/...
   ```

### Use Environment Files

Create `.env.production`:
```env
MONGO_ROOT_USERNAME=prodadmin
MONGO_ROOT_PASSWORD=strong_password_here
FRONTEND_URL=https://yourdomain.com
```

Load with:
```bash
docker-compose --env-file .env.production up -d
```

### Add Reverse Proxy (Nginx)

Add to docker-compose.yml:
```yaml
nginx:
  image: nginx:alpine
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./nginx.conf:/etc/nginx/nginx.conf
    - ./ssl:/etc/nginx/ssl
  depends_on:
    - backend
    - frontend
  networks:
    - kfc-network
```

### Enable Docker Logging

```yaml
services:
  backend:
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
```

## Backup and Restore

### Backup MongoDB Data

```bash
docker-compose exec mongodb mongodump --username admin --password admin123456 --out /data/db/backup
```

### Restore MongoDB Data

```bash
docker-compose exec mongodb mongorestore --username admin --password admin123456 /data/db/backup
```

## Monitoring

### Check Resource Usage

```bash
docker stats
```

### View Container Details

```bash
docker-compose ps -a
```

### Inspect Service Network

```bash
docker network inspect dramatic-road-5348_kfc-network
```

## Development Workflow

### Hot Reload

Frontend and Backend have volume mounts for development:
```yaml
volumes:
  - ./Backend:/app          # Hot reload backend
  - /app/node_modules       # Preserve node_modules
```

Changes are automatically detected and reloaded.

### Debug Container

```bash
# Start shell in container
docker-compose exec backend sh

# Run commands inside
# npm test
# npm run lint
```

## Deployment to Cloud

### Azure Container Instances

```bash
# Tag images
docker tag kfc-backend:latest your-registry.azurecr.io/kfc-backend:latest

# Push to registry
docker push your-registry.azurecr.io/kfc-backend:latest

# Deploy with ACI
az container create --resource-group mygroup --name kfc-app \
  --image your-registry.azurecr.io/kfc-backend:latest
```

### AWS ECS

```bash
# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account.dkr.ecr.us-east-1.amazonaws.com

docker tag kfc-backend:latest your-account.dkr.ecr.us-east-1.amazonaws.com/kfc-backend:latest

docker push your-account.dkr.ecr.us-east-1.amazonaws.com/kfc-backend:latest
```

### Docker Swarm

```bash
docker swarm init
docker stack deploy -c docker-compose.yml kfc-app
```

### Kubernetes

```bash
# Convert docker-compose to Kubernetes manifests
kompose convert -f docker-compose.yml

# Deploy
kubectl apply -f *.yaml
```

## Cleanup

### Remove All Containers and Images

```bash
# Stop all containers
docker-compose down

# Remove images
docker rmi kfc-backend kfc-frontend mongo:7.0-alpine

# Remove volumes
docker volume prune

# Remove networks
docker network prune
```

### Remove Dangling Images

```bash
docker image prune -a
```

## Reference

### Docker Compose Files
- Main: `docker-compose.yml`
- Backend Dockerfile: `Backend/Dockerfile`
- Frontend Dockerfile: `Frontend/kfc-react-app/Dockerfile`

### Network Diagram

```
┌─────────────────────────────────────┐
│       Docker Compose Network        │
│        (kfc-network bridge)         │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────┐  ┌──────────┐        │
│  │ Frontend │  │ Backend  │        │
│  │  Port    │  │  Port    │        │
│  │  3000    │  │  8080    │        │
│  └────┬─────┘  └────┬─────┘        │
│       │             │              │
│       └──────┬──────┘              │
│              │                     │
│         ┌────▼─────┐               │
│         │ MongoDB  │               │
│         │ Port     │               │
│         │ 27017    │               │
│         └──────────┘               │
│                                     │
└─────────────────────────────────────┘
```

---

**Last Updated:** May 3, 2026
**Docker Compose Version:** 3.8
**MongoDB Version:** 7.0
**Node.js Version:** 20 LTS
