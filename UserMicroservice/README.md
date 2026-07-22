# User Microservice

This is the User/Auth microservice for the KFC/KGF fullstack application. It handles user authentication, registration, and profile management.

## Features

- User registration with password hashing
- User login with JWT token generation
- User profile retrieval
- Token verification
- Secure password storage with salt

## API Endpoints

### POST /auth/signup
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "mobile": "9876543210",
  "password": "secret123"
}
```

**Response:**
```json
{
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "john@example.com",
    "mobile": "9876543210"
  },
  "message": "Signup successful"
}
```

### POST /auth/login
Authenticate user and get JWT token.

**Request Body:**
```json
{
  "mobile": "9876543210",
  "password": "secret123"
}
```

**Response:**
```json
{
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "john@example.com",
    "mobile": "9876543210"
  },
  "message": "Login successful"
}
```

### GET /auth/profile
Get current user profile (requires Bearer token).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "id": "user-id",
  "name": "John Doe",
  "email": "john@example.com",
  "mobile": "9876543210",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### POST /auth/verify
Verify JWT token and get user info.

**Request Body:**
```json
{
  "token": "jwt-token-here"
}
```

**Response:**
```json
{
  "valid": true,
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "john@example.com",
    "mobile": "9876543210"
  }
}
```

## Environment Variables

- `PORT`: Port for the service (default: 8082)
- `DB_URL`: MongoDB connection URL for users database
- `JWT_SECRET`: Secret key for JWT token signing

## Security Features

- Password hashing with scrypt algorithm
- Unique salt for each password
- JWT token-based authentication
- Password validation with timing-safe comparison
- Input validation and sanitization

## Running the Service

```bash
npm install
npm start
```

## Docker

The service includes a Dockerfile for containerization and is configured in the main docker-compose.yml file.

## Database

Uses MongoDB with the following schema:
- `name`: String (required)
- `email`: String (required, unique)
- `mobile`: String (required, unique)
- `passwordHash`: String (required)
- `passwordSalt`: String (required)
- `createdAt`: Date (auto-generated)
- `updatedAt`: Date (auto-generated)