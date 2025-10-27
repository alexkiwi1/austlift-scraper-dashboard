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
