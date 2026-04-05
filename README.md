# Medical Inventory Management System

A full-stack web application for managing medical supplies and inventory. Built with Spring Boot on the backend and Angular on the frontend.

---

## Features

### Inventory Management
- Add, edit, and delete inventory items
- Track item name, category, quantity, reorder level, unit price, supplier, expiry date, and status
- Search by item name, category, or supplier
- Filter by category and status
- Sort by quantity, unit price, or expiry date
- Paginated inventory table (5 / 10 / 20 items per page)

### Low Stock Management
- Dedicated low stock view showing items below reorder threshold
- Per-item reorder modal with suggested and custom order quantities
- Select multiple low stock items and build a reorder order list
- Priority classification (High / Medium / Low) based on stock vs reorder level

### Analytics
- Summary cards: total items, low stock count, available items, category count
- Pie chart: quantity share by category
- Donut chart: stock health breakdown (In Stock / Low Stock / Out of Stock)
- Filter charts by stock status

### Reports and Export
- Export all inventory items as CSV
- Export low stock order list as CSV
- Print-friendly PDF report for all items
- Print-friendly PDF report for reorder order list

### Authentication
- User registration and login
- JWT-based stateless authentication
- Passwords hashed with BCrypt
- HTTP interceptor attaches Bearer token on all API requests
- Route guard redirects unauthenticated users to login

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Spring Boot 3.5, Java 17 |
| Security | Spring Security, JWT (jjwt 0.12.6) |
| Database | MySQL 8, Spring Data JPA / Hibernate |
| Frontend | Angular 21, Angular Material |
| Testing | JUnit 5, Mockito, Vitest |
| Build | Maven (mvnw wrapper), npm |

---

## Project Structure

```
medical-inventory/
├── medical_inventory_backend/
│   ├── src/
│   │   ├── main/java/com/medicalinventory/backend/
│   │   │   ├── config/       # SecurityConfig (CORS + JWT filter)
│   │   │   ├── controller/   # AuthController, InventoryItemController
│   │   │   ├── dto/          # AuthRequest, AuthResponse
│   │   │   ├── entity/       # User, InventoryItem
│   │   │   ├── repository/   # JPA repositories
│   │   │   └── service/      # AuthService, InventoryItemService, JwtService
│   │   └── resources/
│   │       └── application.properties
│   └── pom.xml
└── medical-inventory-ui/
    └── src/app/
        ├── pages/
        │   ├── login/
        │   ├── signup/
        │   ├── dashboard/
        │   └── services/     # AuthService, InventoryService
        ├── auth.guard.ts     # Protects /dashboard route
        ├── auth.interceptor.ts  # Attaches JWT to all requests
        ├── app.routes.ts
        └── app.config.ts
```

---

## Getting Started

### Prerequisites

- Java 17
- Node.js 18+ and npm
- MySQL 8

### Database Setup

```sql
CREATE DATABASE medical_inventory;
```

Start MySQL and ensure it is running on `localhost:3306`.

### Backend Setup

```bash
cd medical_inventory_backend

# First-time setup: copy the example env file and fill in your values
cp .env.example .env
# Edit .env and set JWT_SECRET, DB_USERNAME, DB_PASSWORD

# Load env vars — required in every new terminal session before running
source .env

./mvnw spring-boot:run
```

Backend runs on `http://localhost:8080`.

### Frontend Setup

```bash
cd medical-inventory-ui

npm install
npm start
```

Frontend runs on `http://localhost:4200`.

---

## API Endpoints

### Auth — `/api/auth`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login, returns JWT token |
| POST | `/api/auth/register` | Register new user |

### Inventory — `/api/items` *(requires Bearer token)*

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/items` | Get all inventory items |
| GET | `/api/items/low-stock` | Get items below reorder level |
| POST | `/api/items` | Add new item |
| PUT | `/api/items/{id}` | Update item |
| DELETE | `/api/items/{id}` | Delete item |

---

## Running Tests

### Backend

```bash
cd medical_inventory_backend
./mvnw test
```

### Frontend

```bash
cd medical-inventory-ui
npm test
```
