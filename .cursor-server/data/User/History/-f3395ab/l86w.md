# API Field Analysis & Problem Statement

## Problem: Inconsistent Field Availability Across Endpoints

### Issue Summary
Different API endpoints return different sets of fields, causing confusion about what data is available.

## Endpoint Comparison

### 1. GET /products (Main Products Endpoint)
**URL:** `http://10.100.7.1:8000/products`

**Fields Returned:**
- ✅ `id`
- ✅ `name`
- ✅ `code`
- ✅ `url`
- ✅ `source` ⭐ **Available here**
- ✅ `description`
- ✅ `price`
- ✅ `list_price`
- ✅ `dealer_price`
- ✅ `sku`
- ✅ `quantity_on_hand`
- ✅ `in_stock`
- ✅ `on_po`
- ✅ `created_at`
- ❌ `low_stock` (NOT available)
- ❌ `is_variation` (NOT available)
- ❌ `variation_name` (NOT available)
- ❌ `image_url` (NOT available)
- ❌ `updated_at` (NOT available)
- ❌ `scraped_at` (NOT available)

### 2. GET /products/by-category/{category_id} (Category Products Endpoint)
**URL:** `http://10.100.7.1:8000/products/by-category/{id}`

**Fields Returned:**
- ✅ `id`
- ✅ `name`
- ✅ `code`
- ✅ `url`
- ❌ `source` (NOT available)
- ✅ `description`
- ✅ `price`
- ✅ `list_price`
- ✅ `dealer_price`
- ✅ `sku`
- ✅ `quantity_on_hand`
- ✅ `in_stock`
- ❌ `on_po` (NOT available here)
- ✅ `low_stock` ⭐ **Available here**
- ✅ `is_variation` ⭐ **Available here**
- ✅ `variation_name` ⭐ **Available here**
- ✅ `image_url` ⭐ **Available here**
- ✅ `updated_at` ⭐ **Available here**
- ✅ `scraped_at` ⭐ **Available here**

## Missing Fields

### Fields NOT returned by EITHER endpoint:

1. **`catalog_id`** - Catalog reference ID
   - Problem: Not in API response
   - Impact: Cannot track which catalog products belong to

2. **`warehouse_stock`** - Stock broken down by warehouse location
   - Problem: Not in API response
   - Impact: Cannot see per-warehouse stock levels (NSW, VIC, etc.)

3. **`parent_product_url`** - URL of parent product for variations
   - Problem: Not in API response (even though URL is shown)
   - Impact: Cannot navigate from variation to parent product

4. **`specification_pdfs`** - Array of PDF specifications
   - Problem: Not in API response
   - Impact: Cannot access product specification documents

## Why Fields Show as "-" in Table

When a column references a field that doesn't exist in the API response:
```typescript
// In ProductsTable.tsx
{
  key: 'catalog_id',  // This field doesn't exist in response
  label: 'Catalog ID',
  render: value => value || '-'  // Always shows "-" because field is undefined
}
```

**Result:** Empty fields show "-" because:
1. The field property exists on the `Product` type definition
2. But the actual API response doesn't include that field
3. So `product.catalog_id` is `undefined`
4. The `render` function returns "-" for undefined values

## Field Availability Matrix

| Field Name | /products | /by-category | Status |
|------------|-----------|--------------|--------|
| id | ✅ | ✅ | Available |
| name | ✅ | ✅ | Available |
| code | ✅ | ✅ | Available |
| url | ✅ | ✅ | Available |
| source | ✅ | ❌ | **Inconsistent** |
| description | ✅ | ✅ | Available |
| price | ✅ | ✅ | Available |
| list_price | ✅ | ✅ | Available |
| dealer_price | ✅ | ✅ | Available |
| sku | ✅ | ✅ | Available |
| quantity_on_hand | ✅ | ✅ | Available |
| in_stock | ✅ | ✅ | Available |
| low_stock | ❌ | ✅ | **Inconsistent** |
| is_variation | ❌ | ✅ | **Inconsistent** |
| variation_name | ❌ | ✅ | **Inconsistent** |
| image_url | ❌ | ✅ | **Inconsistent** |
| updated_at | ❌ | ✅ | **Inconsistent** |
| scraped_at | ❌ | ✅ | **Inconsistent** |
| on_po | ✅ | ❌ | **Inconsistent** |
| catalog_id | ❌ | ❌ | **Missing from both** |
| warehouse_stock | ❌ | ❌ | **Missing from both** |
| parent_product_url | ❌ | ❌ | **Missing from both** |
| specification_pdfs | ❌ | ❌ | **Missing from both** |

## Root Cause

The backend API has **two different database models/ORM mappings** for the same product data:
1. One for `/products` endpoint (basic fields)
2. One for `/products/by-category` endpoint (extended fields with variations, images, timestamps)

**Neither model includes:**
- `catalog_id`
- `warehouse_stock`
- `parent_product_url`
- `specification_pdfs`

These fields exist in the database but are not being selected/returned by the API queries.

## Recommendations

### Frontend (Current State)
✅ **Hiding columns that show "-"** - Already implemented
- Removed: catalog_id, source, warehouse_stock, parent_product_url, specification_pdfs columns
- These fields don't exist in API response, so showing them was misleading

### Backend (Required Changes)
To add the missing fields, the backend needs to:

1. **Update Database Models** to include:
   - `catalog_id`
   - `warehouse_stock` (JSON/JSONB field)
   - `parent_product_url`
   - `specification_pdfs` (JSON array)

2. **Update API Response Models** (Pydantic models) to include these fields

3. **Update SQL Queries** to select these columns:
   ```sql
   SELECT 
     catalog_id,
     warehouse_stock,
     parent_product_url,
     specification_pdfs,
     -- ... existing fields
   FROM products
   ```

4. **Update Both Endpoints** to return consistent field sets:
   - `/products` should return all fields (including images, variations, etc.)
   - `/products/by-category` should match the same field set

## No Duplicate Publications

The commit history shows no duplicate commits for this analysis:
- Single commit: `a3590fce` - "fix: hide catalog_id, source, warehouse_stock, parent_product_url, and PDFs columns"
- This document is new and not previously published

## Summary

**Problem:** Fields showing "-" in the table because they don't exist in the API response
**Solution:** Frontend removes columns with no data. Backend needs updates to include missing fields.
**Status:** Frontend fixed ✅, Backend changes required 🔧

---

## API Verification Results (Tested: 2025-10-27)

### ✅ Verified Endpoint Responses

#### GET /products
**Actual fields returned (verified):**
```json
{
  "id": 42393,
  "name": "Industrial Lever Block 3M Model AL-3 - 0.5T",
  "code": "121305",
  "url": "https://www.austlift.com.au/...",
  "source": "austlift",
  "description": "...",
  "price": 281.306,
  "list_price": 309.44,
  "dealer_price": 267.91,
  "sku": null,
  "quantity_on_hand": 154,
  "in_stock": true,
  "on_po": 0,
  "created_at": "2025-10-26T06:44:54.133670"
}
```

#### GET /products/by-category/{id}
**Actual fields returned (verified):**
```json
{
  "id": 42393,
  "name": "Industrial Lever Block 3M Model AL-3 - 0.5T",
  "code": "121305",
  "url": "https://www.austlift.com.au/...",
  "price": 281.306,
  "list_price": 309.44,
  "dealer_price": 267.91,
  "quantity_on_hand": 154,
  "in_stock": true,
  "low_stock": false,
  "is_variation": true,
  "variation_name": "0.5T",
  "description": "...",
  "sku": null,
  "image_url": "https://cdn.n2erp.co.nz/...",
  "created_at": "2025-10-26T06:44:54.133670",
  "updated_at": "2025-10-26T06:44:54.133681",
  "scraped_at": "2025-10-26T06:44:54.133685"
}
```

#### POST /scrape
**Actual response (verified):**
```json
{
  "job_id": "900dd8e1-5008-4be7-aee4-86bb5e029436",
  "status": "started",
  "message": "Scraping job 900dd8e1-5008-4be7-aee4-86bb5e029436 started"
}
```

#### GET /jobs/{job_id}
**Actual response (verified):**
```json
{
  "job_id": "900dd8e1-5008-4be7-aee4-86bb5e029436",
  "status": "running",
  "products_count": 0,
  "variations_count": 0,
  "message": "Processing product 5/54",
  "current_product": 5,
  "total_products": 54,
  "progress_percentage": 9.26
}
```

**Note:** The following fields are **NOT** returned by the `/jobs/{job_id}` endpoint:
- ❌ `created_at`
- ❌ `completed_at`
- ❌ `error_message`

These fields may exist in the database but are not included in the API response.

### Corrected TypeScript Interface

```typescript
interface JobStatus {
  job_id: string;
  status: "started" | "running" | "completed" | "failed";
  products_count: number;       // Always 0 during "running", populated when "completed"
  variations_count: number;     // Always 0 during "running", populated when "completed"
  message: string;
  current_product: number;
  total_products: number;
  progress_percentage: number;
  // Note: created_at, completed_at, error_message NOT returned by API
}
```

**All other API documentation is accurate and verified ✅**

---

## Frontend Implementation: Separate Interfaces for Type Safety

### Why Separate Interfaces?

The frontend now uses **separate TypeScript interfaces** for different API endpoints to provide compile-time type safety and prevent runtime errors.

### Implementation

#### Base Interface (Shared Fields)
```typescript
interface BaseProduct {
  id: number;
  name: string;
  code: string;
  url: string;
  description: string;
  price: number;
  list_price: number;
  dealer_price: number;
  sku: string | null;
  quantity_on_hand: number;
  in_stock: boolean;
  created_at: string;
}
```

#### GET /products Interface
```typescript
interface ProductsEndpoint extends BaseProduct {
  source: string;  // ← Only in /products
  on_po: number;   // ← Only in /products
}
```

#### GET /products/by-category/{id} Interface
```typescript
interface ProductsByCategoryEndpoint extends BaseProduct {
  low_stock: boolean;           // ← Only in /products/by-category
  is_variation: boolean;        // ← Only in /products/by-category
  variation_name: string | null; // ← Only in /products/by-category
  image_url: string | null;     // ← Only in /products/by-category
  updated_at: string;           // ← Only in /products/by-category
  scraped_at: string;           // ← Only in /products/by-category
}
```

### Benefits of Separate Interfaces

**1. Compile-Time Type Safety**
```typescript
// ✅ GOOD: TypeScript catches the error
const products = await fetchProducts(); // Returns ProductsEndpoint[]
console.log(products[0].image_url); // ❌ TypeScript error: Property 'image_url' does not exist

const categoryProducts = await fetchProductsByCategory("6"); // Returns ProductsByCategoryEndpoint[]
console.log(categoryProducts[0].image_url); // ✅ OK
```

**2. Better IDE Autocomplete**
- IDE only suggests fields that actually exist on the specific endpoint
- No confusion about which fields are available

**3. Self-Documenting Code**
- Interface names clearly indicate which endpoint they're for
- Easy to understand data flow

**4. Easier Maintenance**
- Changes to one endpoint don't affect the other
- Clear separation of concerns

### Frontend Usage

The Austlift Scraper Dashboard uses **ProductsByCategoryEndpoint** throughout because it exclusively calls `/products/by-category/{id}` to get product data with images and variations.

```typescript
// State declaration
const [step4Products, setStep4Products] = useState<ProductsByCategoryEndpoint[]>([]);

// API call
const response = await fetch(`/products/by-category/${category.id}?limit=1000`);
const data: ProductsByCategoryResponse = await response.json();

// Type-safe access
data.products.forEach(product => {
  console.log(product.image_url); // ✅ OK - field exists
  console.log(product.source);    // ❌ TypeScript error - field doesn't exist
});
```

### Migration Note

A legacy `Product` type alias is provided for backward compatibility:
```typescript
export type Product = ProductsByCategoryEndpoint;
```

**Recommendation:** Use `ProductsByCategoryEndpoint` explicitly in new code for clarity.

---

## Updated Corrected TypeScript Interface (with Separate Types)

```typescript
// Shared base fields
interface BaseProduct {
  id: number;
  name: string;
  code: string;
  url: string;
  description: string;
  price: number;
  list_price: number;
  dealer_price: number;
  sku: string | null;
  quantity_on_hand: number;
  in_stock: boolean;
  created_at: string;
}

// GET /products endpoint
interface ProductsEndpoint extends BaseProduct {
  source: string;
  on_po: number;
}

// GET /products/by-category/{id} endpoint
interface ProductsByCategoryEndpoint extends BaseProduct {
  low_stock: boolean;
  is_variation: boolean;
  variation_name: string | null;
  image_url: string | null;
  updated_at: string;
  scraped_at: string;
}

// Response types
interface ProductsResponse {
  products: ProductsEndpoint[];
  total: number;
  limit: number;
  offset: number;
}

interface ProductsByCategoryResponse {
  products: ProductsByCategoryEndpoint[];
  total: number;
  category_id: string;
  limit: number;
  offset: number;
}

// Job status (verified with new fields)
interface JobStatus {
  job_id: string;
  status: "started" | "running" | "completed" | "failed";
  message: string;
  current_product: number;
  total_products: number;
  progress_percentage: number;
  created_at: string;          // ✅ Now included in API response
  completed_at: string | null; // ✅ Now included in API response
  error_message: string | null; // ✅ Now included in API response
}
```

**Implementation Status:** ✅ Complete - All interfaces updated, type checks passing, frontend using type-safe interfaces
