# Orders Microservice

This is the Orders microservice for the KFC fullstack application. It handles order creation, retrieval, and status updates.

## Features

- Create orders from cart items
- Retrieve orders (all or filtered by user)
- Get specific order details
- Update order status
- Separate MongoDB database for orders

## API Endpoints

### GET /api/orders
Retrieve all orders, optionally filtered by userId.

**Query Parameters:**
- `userId` (optional): Filter orders by user ID

### GET /api/orders/{orderId}
Retrieve a specific order by ID.

### POST /api/orders
Create a new order.

**Request Body:**
```json
{
  "userId": "string",
  "userName": "string",
  "userMobile": "string",
  "items": [
    {
      "productId": "string",
      "title": "string",
      "image": "string",
      "desc": "string",
      "price": number,
      "qty": number
    }
  ],
  "totalPrice": number,
  "paymentMethod": "string"
}
```

### PATCH /api/orders/{orderId}/status
Update the status of an order.

**Request Body:**
```json
{
  "status": "string"
}
```

## Environment Variables

- `PORT`: Port for the service (default: 8081)
- `DB_URL`: MongoDB connection URL for orders database

## Running the Service

```bash
npm install
npm start
```

## Docker

The service includes a Dockerfile for containerization and is configured in the main docker-compose.yml file.