# Product Microservice

A dedicated microservice for managing KFC product catalog and inventory.

## Features

- Product CRUD operations (Create, Read, Update, Delete)
- Product search by title
- Product filtering by category
- Swagger API documentation
- MongoDB integration
- Docker containerization

## API Endpoints

### Products
- `GET /api/product` - Get all products or filter by category
- `GET /api/product/search?q={query}` - Search products by title
- `GET /api/product/{productId}` - Get product by ID
- `POST /api/product` - Create new product
- `PATCH /api/product/{productId}` - Update product
- `DELETE /api/product/{productId}` - Delete product

### Documentation
- `GET /api-docs` - Swagger API documentation

## Environment Variables

- `PORT` - Server port (default: 8083)
- `DB_URL` - MongoDB connection string

## Running the Service

### Development
```bash
npm install
npm run dev
```

### Production
```bash
npm install --production
npm start
```

### Docker
```bash
docker build -t product-microservice .
docker run -p 8083:8083 product-microservice
```