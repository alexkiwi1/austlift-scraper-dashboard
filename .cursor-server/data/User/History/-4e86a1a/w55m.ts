/**
 * Type definitions for the Austlift Scraper Dashboard
 */

// ==========================================
// CATEGORY TYPES
// ==========================================

export interface Category {
  id: string;
  name: string;
  url: string;
  product_count?: number;
}

// GET /categories - Simple format
export interface CategoriesSimpleResponse {
  categories: {
    [key: string]: string; // category_key => category_url
  };
}

// GET /categories/fetch - Detailed format (RECOMMENDED)
export interface CategoriesFetchResponse {
  success: boolean;
  count: number;
  categories: Category[];
}

// ==========================================
// PRODUCT TYPES
// ==========================================

// Shared base fields (exist in both /products and /products/by-category)
export interface BaseProduct {
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

// GET /products - Includes source and on_po
export interface ProductsEndpoint extends BaseProduct {
  source: string;
  on_po: number;
}

// GET /products/by-category/{id} - Includes variations and images
export interface ProductsByCategoryEndpoint extends BaseProduct {
  low_stock: boolean;
  is_variation: boolean;
  variation_name: string | null;
  image_url: string | null;
  updated_at: string;
  scraped_at: string;
}

// Legacy alias for backward compatibility (use ProductsByCategoryEndpoint instead)
export type Product = ProductsByCategoryEndpoint;

export interface ScrapeResponse {
  job_id: string;
  status: string;
  message?: string;
}

export interface ScrapeJob {
  job_id: string;
  status: 'started' | 'running' | 'completed' | 'failed' | 'queued';
  products_count: number; // Always 0 during "running", populated when "completed"
  variations_count: number; // Always 0 during "running", populated when "completed"
  current_product: number;
  total_products: number;
  progress_percentage: number;
  message?: string;
  // Note: The following fields are NOT returned by the API:
  // - created_at
  // - updated_at
  // - error_message (errors shown in "message" field instead)
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  category_id: string;
  limit: number;
  offset: number;
}

export interface CategoriesResponse {
  categories: Category[];
}

// Component State Types
export type StepStatus = 'idle' | 'loading' | 'success' | 'error';

export interface StepState {
  status: StepStatus;
  message: string;
}

export interface ErrorState {
  hasError: boolean;
  message: string;
  details?: string;
}

// Component Props Types
export type AppProps = Record<string, never>;

export type AustliftScraperDashboardProps = Record<string, never>;

export interface WorkflowStepProps {
  stepNumber: number;
  title: string;
  description: string;
  status: StepState;
  onExecute: () => Promise<void>;
  buttonText: string;
  buttonColor: string;
}

export interface ProductsTableProps {
  products: Product[];
  isMinimized: boolean;
  onToggleMinimize: () => void;
  onClose: () => void;
}

export interface StatusMessageProps {
  status: StepState;
  className?: string;
}

// Hook Return Types
export interface UseCategoriesReturn {
  categories: Category[];
  loading: boolean;
  error: ErrorState;
  fetchCategories: () => Promise<void>;
  refreshCategories: () => Promise<void>;
}

export interface UseProductsReturn {
  products: Product[];
  total: number;
  loading: boolean;
  error: ErrorState;
  fetchProducts: (limit?: number, offset?: number) => Promise<void>;
}

export interface UseScrapingReturn {
  jobId: string | null;
  loading: boolean;
  error: ErrorState;
  startScraping: (
    categoryUrl: string,
    maxPages: number,
    scrapeVariations: boolean
  ) => Promise<void>;
}

// API Error Types
export interface ApiError extends Error {
  status?: number;
  statusText?: string;
  response?: Response;
}

// Utility Types
export type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: ErrorState;
};

export type StepId = 'step1' | 'step2' | 'step3' | 'step4';
