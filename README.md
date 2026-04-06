# Medical Inventory Management System

A full-stack web application for managing medical supplies and inventory. Built with Spring Boot on the backend and Angular on the frontend.

---

## Features

### Inventory Management
- Add, edit, and delete inventory items
- Track item name, category, quantity, reorder level, unit price, supplier, expiry date, and status
- Item name unique constraint — 409 Conflict on duplicate
- Reactive form with field-level validation; submit disabled until valid
- Search by item name, category, or supplier (300ms debounce)
- Filter by category, status, and expiry date range
- Sort by quantity, unit price, or expiry date
- Server-side paginated mat-table (5 / 10 / 20 items per page)
- Click any row to open the edit dialog
- Snackbar toast notifications on add, update, and delete

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
- Reports page with summary stats and full filterable inventory table
- Export all inventory items as XLSX
- Export low stock order list as XLSX
- Print-friendly PDF report for all filtered items (exports full dataset, not just current page)
- Print-friendly PDF report for reorder order list

### Authentication
- User registration and login
- JWT-based stateless authentication
- Passwords hashed with BCrypt
- HTTP interceptor attaches Bearer token on all API requests
- Route guard redirects unauthenticated users to login
- Inactivity timeout: warning dialog at 25 min, auto-logout at 30 min

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
│   │   │   ├── config/       # SecurityConfig, JwtAuthenticationFilter
│   │   │   ├── controller/   # AuthController, InventoryItemController, InventoryReportController
│   │   │   ├── dto/          # Request/Response DTOs, InventoryItemQuery, PageResponse
│   │   │   ├── entity/       # User, InventoryItem
│   │   │   ├── repository/   # JPA repositories
│   │   │   └── service/      # AuthService, InventoryItemService, InventoryReportService, JwtService
│   │   └── resources/
│   │       └── application.properties
│   └── pom.xml
└── medical-inventory-ui/
    └── src/app/
        ├── pages/
        │   ├── login/
        │   ├── signup/
        │   ├── dashboard/
        │   ├── reports/
        │   └── services/     # AuthService, InventoryService, InactivityService, ExportUtils
        ├── layout/app-shell/ # Nav shell (sidebar + header)
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
| GET | `/api/items` | Paginated inventory list |
| GET | `/api/items/low-stock` | Items below reorder level |
| POST | `/api/items` | Add new item — `201 Created` |
| PUT | `/api/items/{id}` | Update item |
| DELETE | `/api/items/{id}` | Delete item — `204 No Content` |

Both `GET` endpoints share the same query parameters:

| Param | Default | Description |
|-------|---------|-------------|
| `page` | `0` | Page index |
| `size` | `10` | Page size |
| `search` | — | Name / category / supplier substring |
| `category` | — | Exact category filter |
| `status` | — | `In Stock` / `Low Stock` / `Out of Stock` |
| `dateFrom` | — | Expiry date from (`yyyy-MM-dd`) |
| `dateTo` | — | Expiry date to (`yyyy-MM-dd`) |
| `sortField` | — | `quantity` / `unitPrice` / `expiryDate` |
| `sortDirection` | — | `asc` / `desc` |
| `all` | `false` | Return all records (bypasses pagination, used for export) |

### Reports — `/api/reports/inventory` *(requires Bearer token)*

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/inventory` | Same as `/api/items` — used by Reports page |
| GET | `/api/reports/inventory/summary` | Category/status breakdown + totals |

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
