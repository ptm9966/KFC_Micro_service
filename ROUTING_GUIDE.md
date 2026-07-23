# Kubernetes Routing Guide for Frontend and Microservices

This document explains how the frontend can reach microservices in a Kubernetes environment using two common patterns:

1. Path-based routing
2. Host-based routing

In Kubernetes, these patterns are typically implemented using Ingress resources and Services.

---

## 1. Path-based routing in Kubernetes

In this approach, the frontend accesses a single entry point and the Ingress routes requests by URL path.

### Example

- Frontend: frontend-service
- Cart service: cart-service
- Orders service: orders-service
- Users service: users-service
- Products service: products-service

### Example path mapping

- /cart/* -> cart-service
- /orders/* -> orders-service
- /users/* -> users-service
- /products/* -> products-service

### Ingress example

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
spec:
  rules:
    - host: example.com
      http:
        paths:
          - path: /cart
            pathType: Prefix
            backend:
              service:
                name: cart-service
                port:
                  number: 8080
          - path: /orders
            pathType: Prefix
            backend:
              service:
                name: orders-service
                port:
                  number: 8081
          - path: /users
            pathType: Prefix
            backend:
              service:
                name: users-service
                port:
                  number: 8082
          - path: /products
            pathType: Prefix
            backend:
              service:
                name: products-service
                port:
                  number: 8083
```

### Frontend usage

The frontend can call the services using relative paths such as:

```js
fetch('/cart/api/cart')
fetch('/orders/api/orders')
fetch('/products/api/products')
```

### Advantages

- One public entry point
- Easy to manage from a single Ingress
- Good for internal APIs and a single domain

### Best use case

Use path-based routing when the frontend is served from one domain and you want centralized traffic control.

---

## 2. Host-based routing in Kubernetes

In this approach, each microservice is exposed through its own hostname, and the Ingress routes by host name.

### Example

- cart.example.com -> cart-service
- orders.example.com -> orders-service
- users.example.com -> users-service
- products.example.com -> products-service

### Ingress example

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: host-based-ingress
spec:
  rules:
    - host: cart.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: cart-service
                port:
                  number: 8080
    - host: orders.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: orders-service
                port:
                  number: 8081
```

### Frontend usage

The frontend can use separate base URLs:

```js
const CART_API = 'https://cart.example.com';
const ORDERS_API = 'https://orders.example.com';
```

### Advantages

- Each service looks like an independent application
- Good for multi-domain deployments
- Cleaner separation between services

### Best use case

Use host-based routing when each microservice should be exposed as its own domain or subdomain.

---

## Service-to-service communication inside Kubernetes

Microservices can also communicate with each other without going through the Ingress.

### Example

If the cart service needs to call the orders service, it should use the Kubernetes Service DNS name:

```js
const ordersUrl = 'http://orders-service:8081';
```

This works because Kubernetes gives each Service its own DNS entry inside the cluster.

### Important note

- Frontend -> microservice: use Ingress or external URL
- Microservice -> microservice: use Service DNS name

---

## Recommended approach for this project

For this project, path-based routing is the simplest option for the frontend.

Recommended mapping:

- /api/cart -> cart-service
- /api/orders -> orders-service
- /api/users -> users-service
- /api/products -> products-service

This keeps the frontend simple and avoids cross-origin issues.

---

## Kubernetes deployment flow

1. Deploy each microservice as a Kubernetes Deployment.
2. Expose each one with a Kubernetes Service.
3. Create an Ingress resource to route external traffic.
4. The frontend calls the appropriate route through the Ingress.

This is the most practical pattern for production-grade Kubernetes deployments.
