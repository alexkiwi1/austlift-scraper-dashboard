/**
 * Type definitions for the Austlift Scraper Dashboard
 */

// API Response Types
export interface Category {
  id: string;
  name: string;
  url: string;
  product_count?: number;
}

export interface Product {
  // Core identifiers
  id: number;
  name: string;
  code: string;
  url: string;
  source: string;
  catalog_id: number | null;

  // Product details
  description: string | null;
  sku: string | null;

  // Pricing
  price: number | null;
  list_price: number | null;
  dealer_price: number | null;

  // Stock information
  quantity_on_hand: number | null;
  in_stock: boolean | null;
  low_stock: boolean | null;
  warehouse_stock: Record<string, number> | null;

  // Product variations
  is_variation: boolean;
  variation_name: string | null;
  parent_product_url: string | null;

  // Images
  image_url: string | null;

  // Files
  specification_pdfs: Array<{
    name: string;
    path: string;
  }> | null;

  // Timestamps
  created_at: string | null;
  updated_at: string | null;
  scraped_at: string | null;
}

export interface ScrapeResponse {
  job_id: string;
  status: string;
  message?: string;
}

export interface ScrapeJob {
  job_id: string;
  status: 'started' | 'running' | 'completed' | 'failed' | 'queued';
  products_count: number;
  variations_count: number;
  current_product: number;
  total_products: number;
  progress_percentage: number;
  message?: string;
  error_message?: string;
  created_at?: string;
  updated_at?: string;
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
