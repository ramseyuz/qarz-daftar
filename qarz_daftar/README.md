# 💰 Qarz Daftar — Debt Management System

Multi-tenant debt tracking system for small businesses (shops, cafes, retail stores).

---

## 🗂 Project Structure

```
qarz_daftar/
├── config/
│   ├── settings/
│   │   ├── base.py          # All shared settings
│   │   ├── development.py   # Dev overrides
│   │   └── production.py    # Prod hardening
│   ├── urls.py              # Root URL config
│   ├── api_urls.py          # All /api/v1/ routes
│   ├── wsgi.py
│   └── asgi.py
├── core/
│   ├── models.py            # BaseModel, SoftDelete, UUID
│   ├── permissions.py       # Custom DRF permissions
│   ├── mixins.py            # BusinessScopedMixin
│   ├── pagination.py        # StandardResultsPagination
│   └── exceptions.py        # Custom error handler
├── apps/
│   ├── accounts/            # Custom User + JWT auth
│   ├── businesses/          # Business (tenant root)
│   ├── customers/           # Debtor profiles
│   ├── debts/               # Debt + DebtItem + signals
│   ├── payments/            # Payment records
│   └── products/            # Product catalogue
└── scripts/
    └── seed_data.py         # Sample data seeder
```

---

## ⚙️ Setup

```bash
# 1. Clone & enter
git clone <repo>
cd qarz_daftar

# 2. Virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# 5. Database
createdb qarz_daftar
python manage.py migrate

# 6. Seed data
python scripts/seed_data.py

# 7. Run
python manage.py runserver
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register/` | Register new user |
| POST | `/api/v1/auth/login/` | Get JWT tokens |
| POST | `/api/v1/auth/logout/` | Blacklist refresh token |
| POST | `/api/v1/auth/token/refresh/` | Refresh access token |
| GET/PUT | `/api/v1/auth/profile/` | View/edit profile |
| CRUD | `/api/v1/businesses/` | Business management |
| CRUD | `/api/v1/customers/` | Customer management |
| CRUD | `/api/v1/debts/` | Debt records |
| GET | `/api/v1/debts/summary/` | Business debt stats |
| GET | `/api/v1/debts/export/excel/` | Excel export |
| CRUD | `/api/v1/payments/` | Payment records |
| CRUD | `/api/v1/products/` | Product catalogue |
| GET | `/api/v1/reports/debts/` | Monthly report |
| — | `/api/schema/swagger-ui/` | Swagger UI |
| — | `/api/schema/redoc/` | ReDoc |
| — | `/admin/` | Jazzmin admin panel |

---

## 🔑 API Testing (cURL)

### 1. Register
```bash
curl -X POST http://localhost:8000/api/v1/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "shop@example.com",
    "username": "shopowner",
    "first_name": "Baxtiyor",
    "last_name": "Karimov",
    "phone": "+998901234567",
    "role": "owner",
    "password": "SecurePass123!",
    "password2": "SecurePass123!"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "owner@qarz.uz", "password": "Owner1234!"}'
```

### 3. Create Business
```bash
TOKEN="<your_access_token>"
curl -X POST http://localhost:8000/api/v1/businesses/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Baraka Do'\''koni",
    "phone": "+998901234567",
    "address": "Tashkent, Chilonzor 10"
  }'
```

### 4. Create Customer
```bash
curl -X POST http://localhost:8000/api/v1/customers/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Alisher Nazarov",
    "phone": "+998901111111",
    "address": "Yunusobod district"
  }'
```

### 5. Create Debt (with items)
```bash
curl -X POST http://localhost:8000/api/v1/debts/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer": "<customer_uuid>",
    "total_amount": "250000.00",
    "description": "Monthly groceries",
    "due_date": "2024-12-31",
    "items": [
      {"name": "Guruch", "quantity": 5, "unit_price": "12000.00"},
      {"name": "Qand",   "quantity": 3, "unit_price": "15000.00"}
    ]
  }'
```

### 6. Record Payment
```bash
curl -X POST http://localhost:8000/api/v1/payments/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "debt": "<debt_uuid>",
    "amount": "100000.00",
    "payment_method": "cash",
    "notes": "First installment"
  }'
```

### 7. Debt Summary
```bash
curl http://localhost:8000/api/v1/debts/summary/ \
  -H "Authorization: Bearer $TOKEN"
```

### 8. Filter debts by status
```bash
curl "http://localhost:8000/api/v1/debts/?status=unpaid&page_size=10" \
  -H "Authorization: Bearer $TOKEN"
```

### 9. Search customers
```bash
curl "http://localhost:8000/api/v1/customers/?search=Alisher" \
  -H "Authorization: Bearer $TOKEN"
```

### 10. Export Excel
```bash
curl "http://localhost:8000/api/v1/debts/export/excel/" \
  -H "Authorization: Bearer $TOKEN" \
  --output debts.xlsx
```

---

## 🔐 Security Features

- **Multi-tenancy**: Every queryset is filtered by `user.business` — no cross-business data leakage
- **JWT**: Short-lived access tokens (60 min) + rotating refresh tokens with blacklisting
- **Soft delete**: Records are never physically removed; use `is_deleted=True`
- **ATOMIC_REQUESTS**: Every HTTP request runs in a DB transaction
- **Role-based permissions**: `superadmin` | `owner` | `employee`

## 🔄 Business Logic Flow

```
POST /payments/
  → PaymentSerializer.validate() — overpayment guard
  → Payment saved
  → Signal: post_save on Payment
      → _sync_debt() recalculates paid_amount
      → Debt.recalculate() → remaining_amount, status
      → Debt saved
```

## 📊 Admin Panel

Visit `http://localhost:8000/admin/` and log in with:
- Email: `admin@qarz.uz`
- Password: `Admin1234!`

Features:
- Color-coded debt status (🟢 paid / 🟠 partial / 🔴 unpaid)
- Inline DebtItems inside Debt form
- Date hierarchy navigation
- Business-scoped filters
