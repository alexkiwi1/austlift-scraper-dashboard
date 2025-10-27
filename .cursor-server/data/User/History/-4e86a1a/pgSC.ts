/**
 * Type definitions for the Austlift Scraper Dashboard
 */

// API Response Types
export interface Category {
  id: string;
  name: string;
  url: string;
}

export interface ProductVariation {
  id: string;
  product_id: string;
  variation_type: string;
  variation_value: string;
  price?: number;
  availability?: string;
}

export interface Product {
  id: string;
  name: string;
  price?: number;
  description?: string;
  image_url?: string;
  category_id?: string;
  sku?: string;
  availability?: string;
  brand?: string;
  model?: string;
  specifications?: Record<string, unknown>;
  variations?: ProductVariation[];
  created_at?: string;
  updated_at?: string;
}

export interface ScrapeResponse {
  job_id: string;
  status: string;
  message?: string;
}

export interface ScrapeJob {
  id: string;
  status: 'running' | 'completed' | 'failed' | 'queued';
  progress?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
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
export interface AppProps {
  // No props currently needed
}

export interface AustliftScraperDashboardProps {
  // No props currently needed
}

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
