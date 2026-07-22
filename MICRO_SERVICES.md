# Microservices Architecture Guide

## Overview

This document outlines the microservices architecture for the KFC/KGF fullstack application. The application has been refactored from a monolithic backend into multiple independent microservices, each with its own database and responsibilities.

## Current Architecture

### Monolithic Backend (Original)
- Single Node.js/Express application
- Single MongoDB database
- All features (auth, products, cart, orders) in one service

### Microservices Architecture (Current)
- **Main Backend**: Cart functionality (Port 8080)
- **Orders Microservice**: Order management (Port 8081) ✅
- **User/Auth Microservice**: User authentication (Port 8082) ✅
- **Product Microservice**: Product catalog management (Port 8083) ✅
- **Frontend**: React application (Port 3000)
- **Databases**: Separate MongoDB instances for each service

## Available Microservices

Based on the current codebase, you can create up to **4 microservices**:

### 1. User/Auth Microservice
**Port**: 8082
**Database**: `users-database`
**Responsibilities**:
- User registration and authentication
- Password hashing and JWT token management
- User profile management

**Endpoints**:
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login
- `GET /auth/profile` - Get user profile

### 2. Product Microservice (Already Implemented)
**Port**: 8083
**Database**: `products-database`
**Responsibilities**:
- Product catalog management
- Category-based filtering
- Product search functionality

**Endpoints**:
- `GET /api/product` - Get all products (with optional category filter)
- `GET /api/product/search` - Search products
- `POST /api/product` - Add new product (admin)
- `PUT /api/product/:id` - Update product (admin)
- `DELETE /api/product/:id` - Delete product (admin)

### 3. Cart Microservice
**Port**: 8084
**Database**: `cart-database`
**Responsibilities**:
- Shopping cart management
- Add/remove cart items
- Update item quantities

**Endpoints**:
- `GET /api/cart` - Get all cart items
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:id` - Update cart item quantity
- `DELETE /api/cart/:id` - Remove item from cart
- `DELETE /api/cart` - Clear entire cart

### 4. Order Microservice (Already Implemented)
**Port**: 8081
**Database**: `orders-database`
**Responsibilities**:
- Order creation and management
- Order status updates
- Order history retrieval

**Endpoints**:
- `GET /api/orders` - Get all orders (with optional userId filter)
- `GET /api/orders/:id` - Get specific order
- `POST /api/orders` - Create new order
- `PATCH /api/orders/:id/status` - Update order status

## Architecture Options

### Option 1: Full Microservices (4 Services)
```
Frontend (3000)
├── User Service (8082)
├── Product Service (8083)
├── Cart Service (8084)
└── Order Service (8081)
```

**Pros**: Maximum scalability, independent deployment
**Cons**: Complex orchestration, inter-service communication

### Option 2: Hybrid Approach (3 Services)
```
Frontend (3000)
├── Catalog Service (8082) [User + Product]
├── Cart Service (8084)
└── Order Service (8081)
```

**Pros**: Balanced complexity, easier management
**Cons**: Less granular scaling

### Option 3: Minimal Microservices (2 Services)
```
Frontend (3000)
├── Core Service (8080) [User + Product + Cart]
└── Order Service (8081)
```

**Pros**: Simple to implement, maintain
**Cons**: Limited scalability benefits

## Service Dependencies

```
Order Service
├── Cart Service (for cart items)
└── User Service (for user data)

Cart Service
└── Product Service (for product validation)

Product Service
└── Independent

User Service
└── Independent
```

## Database Architecture

Each microservice maintains its own MongoDB database:

- **users-database**: User profiles, authentication data
- **products-database**: Product catalog, categories
- **cart-database**: Shopping cart items
- **orders-database**: Order history, status tracking

## Inter-Service Communication

### Synchronous Communication (REST APIs)
- Services communicate via HTTP REST calls
- Frontend calls multiple services directly
- Services call each other when needed
fw
### Data Flow Patterns
1. **Direct Service Calls**: Frontend → Service A → Service B
2. **Data Duplication**: Services store necessary data from other services
3. **Eventual Consistency**: Cached data is updated asynchronously

## Implementation Guide

### Current Setup (Orders + Users + Products Services)

The Orders, User, and Product microservices are now implemented and running. The main backend handles cart functionality, while users, orders, and products are handled by dedicated microservices.

1. **Create Service Structure**
   ```bash
   mkdir UserMicroservice
   cd UserMicroservice
   npm init -y
   ```

2. **Extract Code**
   - Copy relevant routes from `Backend/features/`
   - Copy models and create separate database connection
   - Update API endpoints and remove dependencies

3. **Update Frontend**
   - Add new API base URLs in `config/api.js`
   - Update components to use appropriate services

4. **Update Docker Compose**
   - Add new service definitions
   - Add new MongoDB instances
   - Configure networking and dependencies

### Example: Creating User Microservice

```bash
# Create directory structure
mkdir -p UserMicroservice/{config,features/user}

# Copy and modify files
cp Backend/features/user/user.* UserMicroservice/features/user/
cp Backend/config/db.js UserMicroservice/config/
cp Backend/config/swagger.js UserMicroservice/config/

# Create main index.js
# Update package.json
# Create Dockerfile
```

## Environment Variables

Each service requires specific environment variables:

### User Service (.env)
```
PORT=8082
DB_URL=mongodb://admin:admin123456@users-mongodb:27017/users-database?authSource=admin
JWT_SECRET=your-secret-key
```

### Product Service (.env)
```
PORT=8083
DB_URL=mongodb://admin:admin123456@products-mongodb:27017/products-database?authSource=admin
```

### Cart Service (.env)
```
PORT=8084
DB_URL=mongodb://admin:admin123456@cart-mongodb:27017/cart-database?authSource=admin
PRODUCTS_API_URL=http://product-service:8083
```

### Order Service (.env)
```
PORT=8081
DB_URL=mongodb://admin:admin123456@orders-mongodb:27017/orders-database?authSource=admin
CART_API_URL=http://cart-service:8084
USER_API_URL=http://user-service:8082
```

## Docker Compose Configuration

For full microservices setup, update `docker-compose.yml`:

```yaml
services:
  # Existing services...
  orders-service:
    # Already configured

  # New services
  users-service:
    build: ./UserMicroservice
    ports: ["8082:8082"]
    depends_on:
      - users-mongodb
    environment:
      - DB_URL=mongodb://admin:admin123456@users-mongodb:27017/users-database?authSource=admin

  users-mongodb:
    image: mongo:7.0
    ports: ["27020:27017"]
    environment:
      MONGO_INITDB_DATABASE: users-database
    volumes:
      - users_mongodb_data:/data/db

  # Similar for products-service, cart-service...
```

## API Gateway (Future Enhancement)

For production deployments, consider adding an API Gateway:

- **Single Entry Point**: All requests go through gateway
- **Load Balancing**: Distribute requests across service instances
- **Authentication**: Centralized auth handling
- **Rate Limiting**: Protect services from abuse

## Monitoring and Logging

Implement monitoring for each service:

- **Health Checks**: `/health` endpoint for each service
- **Metrics**: Response times, error rates, throughput
- **Logging**: Centralized logging with correlation IDs
- **Tracing**: Distributed tracing across services

## Deployment Strategy

### Development
```bash
# Run all services
docker-compose up --build

# Run specific service
docker-compose up orders-service
```

### Production
- Use Kubernetes for orchestration
- Implement service mesh (Istio/Linkerd)
- Set up CI/CD pipelines
- Configure auto-scaling
- Implement blue-green deployments

## Migration Strategy

To migrate from monolithic to microservices:

1. **Start with Orders Service** ✅ (Already done)
2. **Extract User/Auth Service** ✅ (Already done)
3. **Extract Product Service** ✅ (Already done)
4. **Extract Cart Service** (Next)
5. **Update Frontend** incrementally
6. **Test Integration** thoroughly
7. **Monitor Performance** and optimize

## Benefits of Microservices

- **Scalability**: Scale individual services based on load
- **Technology Diversity**: Use different tech stacks per service
- **Team Autonomy**: Teams can work independently
- **Fault Isolation**: Failure in one service doesn't affect others
- **Easier Deployment**: Deploy services independently

## Challenges

- **Complexity**: More moving parts to manage
- **Data Consistency**: Managing distributed data
- **Testing**: Integration testing becomes complex
- **Debugging**: Tracing issues across services
- **Operational Overhead**: More infrastructure to maintain

## Conclusion

The current codebase supports creating up to 4 microservices. Start with the Orders service (already implemented) and gradually extract other services based on your team's capacity and requirements. The hybrid approach (3 services) often provides the best balance of benefits and complexity for most applications.