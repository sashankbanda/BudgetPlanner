# Budget Planner Backend Integration Contracts

## API Contracts

### Base URL: `${REACT_APP_BACKEND_URL}/api`

### 1. Transaction Endpoints

#### POST `/api/transactions` - Add New Transaction
**Request Body:**
```json
{
  "type": "income" | "expense",
  "category": "string",
  "amount": "number", 
  "description": "string",
  "date": "YYYY-MM-DD"
}
```

**Response:**
```json
{
  "id": "string",
  "type": "income" | "expense", 
  "category": "string",
  "amount": "number",
  "description": "string", 
  "date": "YYYY-MM-DD",
  "month": "YYYY-MM",
  "created_at": "ISO_DATE"
}
```

#### GET `/api/transactions` - Get All Transactions
**Query Parameters:**
- `limit`: number (optional, default: 100)
- `month`: string (optional, format: YYYY-MM)

**Response:**
```json
[
  {
    "id": "string",
    "type": "income" | "expense",
    "category": "string", 
    "amount": "number",
    "description": "string",
    "date": "YYYY-MM-DD",
    "month": "YYYY-MM",
    "created_at": "ISO_DATE"
  }
]
```

#### DELETE `/api/transactions/{id}` - Delete Transaction
**Response:**
```json
{
  "message": "Transaction deleted successfully"
}
```

### 2. Statistics Endpoints

#### GET `/api/stats/monthly` - Monthly Summary Data
**Response:**
```json
[
  {
    "month": "YYYY-MM",
    "income": "number",
    "expense": "number", 
    "net": "number"
  }
]
```

#### GET `/api/stats/categories` - Category Breakdown
**Query Parameters:**
- `type`: "income" | "expense" (required)

**Response:**
```json
[
  {
    "name": "string",
    "value": "number", 
    "count": "number"
  }
]
```

#### GET `/api/stats/trends` - Spending Trends
**Response:**
```json
[
  {
    "month": "YYYY-MM",
    "total": "number"
  }
]
```

## Mock Data Mapping

### Current Mock Data (mock.js) → Backend Models

**Transaction Model:**
- `mockTransactions` array → MongoDB `transactions` collection
- Each transaction object maps directly to backend model
- Added fields: `_id` (MongoDB), `created_at`, `updated_at`

### Frontend Integration Points

#### 1. BudgetDashboard.js Changes Required:

**Remove:**
- Import of `mock.js` 
- All mock data usage
- Local state management for transactions
- localStorage operations

**Add:**
- API service functions
- Loading states for API calls
- Error handling for failed requests
- Real-time stats calculation from API data

**Replace Functions:**
- `calculateStats()` → Use `/api/stats/monthly` current month
- `getMonthlyData()` → Use `/api/stats/monthly` 
- `getCategoryData()` → Use `/api/stats/categories`
- `getTrendData()` → Use `/api/stats/trends`
- `handleAddTransaction()` → POST to `/api/transactions`

#### 2. New API Service Layer

Create `/app/frontend/src/services/api.js`:
- Transaction CRUD operations
- Stats data fetching
- Error handling wrapper
- Loading state management

## Backend Implementation Plan

### 1. Database Schema

**Collection: `transactions`**
```javascript
{
  _id: ObjectId,
  type: String, // "income" | "expense"
  category: String,
  amount: Number,
  description: String, 
  date: Date,
  month: String, // "YYYY-MM" 
  created_at: Date,
  updated_at: Date
}
```

**Indexes:**
- `{ month: 1, type: 1 }` - For monthly stats
- `{ date: -1 }` - For recent transactions
- `{ category: 1, type: 1 }` - For category stats

### 2. Backend Files to Create/Update

1. **Models:** `/app/backend/models/transaction.py`
2. **Routes:** `/app/backend/routes/transactions.py` 
3. **Routes:** `/app/backend/routes/stats.py`
4. **Update:** `/app/backend/server.py` - Include new routes

### 3. Business Logic

**Transaction Operations:**
- Validate transaction data
- Auto-calculate month field from date
- Handle custom categories
- Ensure amount > 0

**Statistics Calculations:** 
- Monthly aggregations using MongoDB pipeline
- Category totals with grouping
- Trend calculations with time series
- Current month filtering

## Integration Steps

### Phase 1: Backend API Development
1. Create transaction model and routes
2. Create stats calculation endpoints  
3. Test all endpoints with sample data

### Phase 2: Frontend Integration
1. Create API service layer
2. Replace mock data usage with API calls
3. Add loading states and error handling
4. Test all frontend features with real backend

### Phase 3: Data Migration
1. Seed database with current mock data
2. Test full integration
3. Verify charts and stats work correctly

## Testing Checklist

**Backend Testing:**
- [ ] POST transaction creates correctly
- [ ] GET transactions returns proper data
- [ ] DELETE removes transaction
- [ ] Monthly stats calculate correctly
- [ ] Category stats group properly  
- [ ] Trends data formats correctly

**Frontend Integration Testing:**
- [ ] Add transaction form works with backend
- [ ] Transaction list displays real data
- [ ] Charts render with backend data
- [ ] Stats cards show current month data
- [ ] All tabs function with real data
- [ ] Error states display properly

## Error Handling Strategy

**Backend:**
- Validate all input data
- Return appropriate HTTP status codes
- Provide clear error messages
- Handle database connection errors

**Frontend:**
- Loading spinners during API calls
- Toast notifications for success/error
- Graceful fallbacks for failed requests
- Retry mechanisms for network errors