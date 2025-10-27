import React, { useState, useCallback, useEffect } from 'react';
import { Home, XCircle } from 'lucide-react';
import ProductsTable from './ProductsTable';
import type {
  Category,
  Product,
  ProductsResponse,
  ScrapeResponse,
  ScrapeJob,
  StepState,
  ErrorState,
} from '../types';

/**
 * Main dashboard component for the Austlift Scraper
 * Manages the 4-step workflow for product data management
 * @returns {React.JSX.Element} JSX element containing the complete dashboard interface
 */
const AustliftScraperDashboard: React.FC = (): React.JSX.Element => {
  const [activeSection, setActiveSection] = useState<string>('home');
  const [categories, setCategories] = useState<Category[]>([]);
  const [step1Status, setStep1Status] = useState<StepState>({
    status: 'idle',
    message: '',
  });
  const [step2Status, setStep2Status] = useState<StepState>({
    status: 'idle',
    message: '',
  });
  const [step3Status, setStep3Status] = useState<StepState>({
    status: 'idle',
    message: '',
  });
  const [step4Status, setStep4Status] = useState<StepState>({
    status: 'idle',
    message: '',
  });
  const [showStep4Dropdown, setShowStep4Dropdown] = useState<boolean>(false);
  const [step4Products, setStep4Products] = useState<Product[]>([]);
  const [isTableMinimized, setIsTableMinimized] = useState<boolean>(false);
  const [error, setError] = useState<ErrorState>({
    hasError: false,
    message: '',
  });
  const [scrapingJobs, setScrapingJobs] = useState<{
    [jobId: string]: ScrapeJob;
  }>({});
  const [minimizedJobs, setMinimizedJobs] = useState<Set<string>>(new Set());

  /**
   * Gets the appropriate CSS class for step status
   * @param {StepState} status - The step status
   * @param {string} defaultColor - The default color class
   * @returns {string} CSS class string
   */
  const getStatusColor = (status: StepState, defaultColor: string): string => {
    if (status.status === 'success') return 'text-green-600';
    if (status.status === 'error') return 'text-red-600';
    return defaultColor;
  };

  /**
   * Gets the appropriate CSS class for job status badge
   * @param {string} status - The job status
   * @returns {string} CSS class string for status badge
   */
  const getJobStatusClass = (status: string): string => {
    if (status === 'completed') return 'bg-green-100 text-green-700';
    if (status === 'failed') return 'bg-red-100 text-red-700';
    return 'bg-blue-100 text-blue-700';
  };

  /**
   * Parses the job message to extract scraped product counts
   * @param {string} message - The job message string
   * @returns {object} Object with scraped products and variations counts
   */
  const parseJobMessage = (
    message?: string
  ): { scraped: number; parents: number; variations: number } => {
    if (!message) return { scraped: 0, parents: 0, variations: 0 };

    // Parse "V1: Scraped 269 products (0 parents, 269 variations)"
    const match = message.match(
      /Scraped (\d+) products \((\d+) parents, (\d+) variations\)/
    );
    if (match) {
      return {
        scraped: parseInt(match[1], 10),
        parents: parseInt(match[2], 10),
        variations: parseInt(match[3], 10),
      };
    }

    // Fallback for other message formats
    return { scraped: 0, parents: 0, variations: 0 };
  };

  /**
   * Toggles the minimized state of a job card
   * @param {string} jobId - The job ID to toggle
   */
  const toggleJobMinimize = (jobId: string): void => {
    setMinimizedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  /**
   * Fetches categories from the API
   * @returns {Promise<void>} Promise that resolves when categories are loaded
   * @throws {Error} When API request fails
   */
  const fetchCategories = useCallback(async (): Promise<void> => {
    try {
      console.log('fetchCategories called');
      setError({ hasError: false, message: '' });
      const response = await fetch('/categories/fetch');
      console.log('Fetch response status:', response.status);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log(
        'Categories fetched:',
        data.categories?.length || 0,
        'categories'
      );
      setCategories(data.categories || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch categories';
      setError({ hasError: true, message: errorMessage });
      console.error('Error fetching categories:', err);
    }
  }, []);

  // Fetch categories on component mount
  useEffect(() => {
    console.log('Fetching categories on mount...');
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Polls a scraping job for progress updates
   * @param {string} jobId - The job ID to poll
   * @returns {Promise<void>} Promise that resolves when polling completes or job finishes
   */
  const pollJobProgress = useCallback(async (jobId: string): Promise<void> => {
    try {
      const response = await fetch(`/jobs/${jobId}`);
      if (!response.ok) {
        console.error(`Failed to fetch job ${jobId}: ${response.status}`);
        return;
      }

      const jobStatus: ScrapeJob = await response.json();

      // Update job status in state
      setScrapingJobs(prev => ({
        ...prev,
        [jobId]: jobStatus,
      }));

      // Continue polling if job is still running
      if (jobStatus.status === 'running' || jobStatus.status === 'started') {
        setTimeout(() => {
          pollJobProgress(jobId);
        }, 2000); // Poll every 2 seconds
      }
    } catch (err) {
      console.error(`Error polling job progress for ${jobId}:`, err);
    }
  }, []);

  /**
   * Refreshes categories from the API
   * @returns {Promise<void>} Promise that resolves when categories are refreshed
   * @throws {Error} When API request fails
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const refreshCategories = useCallback(async (): Promise<void> => {
    try {
      setError({ hasError: false, message: '' });
      const response = await fetch('/categories/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to refresh categories';
      setError({ hasError: true, message: errorMessage });
      console.error('Error refreshing categories:', err);
    }
  }, []);

  /**
   * Handles Step 1 - Review Categories
   * Fetches and refreshes categories, updates status
   * @returns {Promise<void>} Promise that resolves when step is complete
   */
  const handleStep1 = async (): Promise<void> => {
    // If categories already loaded, skip fetch and refresh
    if (categories.length > 0) {
      setStep1Status({
        status: 'success',
        message: `✅ Step 1 Complete! ${categories.length} categories loaded`,
      });
      return;
    }

    // Wait for categories to load (from useEffect)
    if (categories.length === 0) {
      setStep1Status({
        status: 'loading',
        message: 'Waiting for categories to load...',
      });
      // Wait a moment for useEffect to complete
      await new Promise<void>(resolve => {
        setTimeout(() => resolve(), 500);
      });
    }

    setStep1Status({
      status: 'success',
      message: `✅ Step 1 Complete! ${categories.length} categories loaded`,
    });
  };

  /**
   * Handles Step 2 - Start Scraping
   * Initializes Step 1, selects all categories, and starts scraping
   * @returns {Promise<void>} Promise that resolves when step is complete
   */
  const handleStep2 = async (): Promise<void> => {
    setStep2Status({ status: 'loading', message: 'Initializing Step 1...' });
    await handleStep1();

    setStep2Status({
      status: 'loading',
      message: 'Starting scraping for all 10 categories...',
    });

    try {
      const jobIds: string[] = [];
      let completedCategories = 0;

      // Scrape all categories sequentially
      // eslint-disable-next-line no-restricted-syntax
      for (const [index, category] of categories.entries()) {
        setStep2Status({
          status: 'loading',
          message: `Scraping category ${index + 1}/${categories.length}: ${category.name}...`,
        });

        // eslint-disable-next-line no-await-in-loop
        const response = await fetch('/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category_url: category.url,
            max_pages: 100, // Scrape all pages per category
            scrape_variations: true,
            use_auth: true,
          }),
        });

        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}: ${response.statusText} for ${category.name}`
          );
        }

        // eslint-disable-next-line no-await-in-loop
        const data: ScrapeResponse = await response.json();
        jobIds.push(data.job_id);
        completedCategories += 1;

        // Start polling progress for this job
        pollJobProgress(data.job_id);
      }

      setStep2Status({
        status: 'success',
        message: `✅ Complete! Started scraping all ${completedCategories} categories. Monitoring progress...`,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to start scraping';
      setStep2Status({ status: 'error', message: `❌ Error: ${errorMessage}` });
      setError({ hasError: true, message: errorMessage });
      console.error('Error starting scraping:', err);
    }
  };

  /**
   * Handles Step 3 - Review Products
   * Initializes previous steps and loads products from all categories
   * @returns {Promise<void>} Promise that resolves when step is complete
   */
  const handleStep3 = async (): Promise<void> => {
    setStep3Status({
      status: 'loading',
      message: 'Initializing previous steps...',
    });

    // Only run handleStep2 if it hasn't been completed yet
    if (step2Status.status !== 'success') {
      await handleStep2();
    }

    setStep3Status({
      status: 'loading',
      message: 'Loading products from all categories...',
    });
    try {
      let totalProducts = 0;

      // Fetch products from each category to get complete data
      // eslint-disable-next-line no-restricted-syntax
      for (const category of categories) {
        // eslint-disable-next-line no-await-in-loop
        const response = await fetch(
          `/products/by-category/${category.id}?limit=1000&offset=0`
        );
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        // eslint-disable-next-line no-await-in-loop
        const data: ProductsResponse = await response.json();
        totalProducts += data.total;
      }

      setStep3Status({
        status: 'success',
        message: `✅ Complete! Found ${totalProducts} products across ${categories.length} categories`,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load products';
      setStep3Status({
        status: 'error',
        message: `❌ Error loading products: ${errorMessage}`,
      });
      setError({ hasError: true, message: errorMessage });
      console.error('Error loading products:', err);
    }
  };

  /**
   * Handles Step 4 - Show Products Table
   * Initializes previous steps and loads all products for table display
   * @returns {Promise<void>} Promise that resolves when step is complete
   */
  const handleStep4 = async (): Promise<void> => {
    setStep4Status({
      status: 'loading',
      message: 'Initializing previous steps...',
    });

    // Only run handleStep3 if it hasn't been completed yet
    if (step3Status.status !== 'success') {
      await handleStep3();
    }

    setStep4Status({
      status: 'loading',
      message: 'Loading products from all categories...',
    });
    try {
      const allProducts: Product[] = [];

      // Fetch products from all categories to get complete data with images
      // eslint-disable-next-line no-restricted-syntax
      for (const category of categories) {
        // eslint-disable-next-line no-await-in-loop
        const response = await fetch(
          `/products/by-category/${category.id}?limit=1000&offset=0`
        );
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        // eslint-disable-next-line no-await-in-loop
        const data: ProductsResponse = await response.json();
        allProducts.push(...data.products);
      }

      if (allProducts.length === 0) {
        setStep4Products([]);
        setStep4Status({
          status: 'error',
          message: '⚠️ No products available for display',
        });
        return;
      }

      setStep4Products(allProducts);
      setStep4Status({
        status: 'success',
        message: `✅ ALL products loaded! Showing ${allProducts.length} products from ${categories.length} categories`,
      });
      setShowStep4Dropdown(true);
      setIsTableMinimized(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load products';
      setStep4Status({
        status: 'error',
        message: `❌ Error loading products: ${errorMessage}`,
      });
      setStep4Products([]);
      setError({ hasError: true, message: errorMessage });
      console.error('Error loading products:', err);
    }
  };

  return (
    <div className='min-h-screen bg-gray-50 flex'>
      {/* Sidebar */}
      <div className='w-64 bg-white shadow-lg'>
        <div className='p-6'>
          <h1 className='text-xl font-bold text-gray-900'>Austlift Scraper</h1>
        </div>

        <nav className='mt-6'>
          <div className='px-3 space-y-1'>
            <button
              type='button'
              onClick={() => setActiveSection('home')}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg text-sm font-medium transition-colors ${
                activeSection === 'home'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Home className='w-5 h-5' />
              <span>Home</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className='flex-1 p-6'>
        <div>
          {activeSection === 'home' && (
            <div className='space-y-6'>
              {/* Error Display */}
              {error.hasError && (
                <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
                  <div className='flex items-center'>
                    <XCircle className='w-5 h-5 text-red-400 mr-2' />
                    <div>
                      <h3 className='text-sm font-medium text-red-800'>
                        Error
                      </h3>
                      <p className='text-sm text-red-700'>{error.message}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Welcome Section */}
              <div className='bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-8 text-white'>
                <div className='flex items-center space-x-4 mb-4'>
                  <div className='p-3 bg-white bg-opacity-20 rounded-lg'>
                    <Home className='w-8 h-8' />
                  </div>
                  <div>
                    <h1 className='text-3xl font-bold'>
                      Austlift Scraper Dashboard
                    </h1>
                    <p className='text-blue-100 text-lg'>
                      Complete Product Data Management Workflow
                    </p>
                  </div>
                </div>
              </div>

              {/* Workflow Steps */}
              <div className='bg-white rounded-lg shadow-sm p-6'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                  Product Data Management Workflow
                </h3>
                <div className='space-y-4'>
                  {/* Step 1 */}
                  <div className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'>
                    <div className='flex items-center space-x-3'>
                      <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
                        <span className='text-blue-600 font-semibold'>1</span>
                      </div>
                      <div>
                        <h4 className='font-medium text-gray-900'>
                          Review Category List
                        </h4>
                        <p className='text-sm text-gray-600'>
                          Fetch and review all available product categories
                        </p>
                        {step1Status.message && (
                          <p
                            className={`text-sm ${getStatusColor(step1Status, 'text-blue-600')}`}
                          >
                            {step1Status.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type='button'
                      onClick={handleStep1}
                      className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                    >
                      Start Review
                    </button>
                  </div>

                  {/* Step 2 */}
                  <div className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'>
                    <div className='flex items-center space-x-3'>
                      <div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center'>
                        <span className='text-green-600 font-semibold'>2</span>
                      </div>
                      <div>
                        <h4 className='font-medium text-gray-900'>
                          Scrape Product Lists
                        </h4>
                        <p className='text-sm text-gray-600'>
                          Start scraping all 10 categories (up to 100 pages
                          each)
                        </p>
                        {step2Status.message && (
                          <p
                            className={`text-sm ${getStatusColor(step2Status, 'text-green-600')}`}
                          >
                            {step2Status.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type='button'
                      onClick={handleStep2}
                      className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors'
                    >
                      Start Scraping
                    </button>
                  </div>

                  {/* Progress Display for Active Jobs */}
                  {Object.keys(scrapingJobs).length > 0 && (
                    <div className='mt-4 space-y-3'>
                      <h5 className='font-medium text-gray-700'>
                        Scraping Progress
                      </h5>
                      {Object.entries(scrapingJobs).map(([jobId, job]) => {
                        const isMinimized = minimizedJobs.has(jobId);
                        const stats = parseJobMessage(job.message);

                        return (
                          <div
                            key={jobId}
                            className='border rounded-lg bg-gray-50'
                          >
                            {/* Header - Always visible */}
                            <div
                              className='flex justify-between items-center p-3 cursor-pointer hover:bg-gray-100 transition-colors'
                              onClick={() => toggleJobMinimize(jobId)}
                              onKeyDown={e => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  toggleJobMinimize(jobId);
                                }
                              }}
                              role='button'
                              tabIndex={0}
                            >
                              <div className='flex items-center space-x-2'>
                                <span className='text-xs text-gray-500'>
                                  {isMinimized ? '▶' : '▼'}
                                </span>
                                <span className='text-sm font-medium text-gray-700'>
                                  Job {jobId.substring(0, 8)}...
                                </span>
                                <span
                                  className={`text-xs font-bold px-2 py-1 rounded ${getJobStatusClass(job.status)}`}
                                >
                                  {job.status.toUpperCase()}
                                </span>
                              </div>
                              {job.status === 'completed' && (
                                <span className='text-xs font-semibold text-green-700'>
                                  {stats.scraped} products scraped
                                </span>
                              )}
                            </div>

                            {/* Details - Hidden when minimized */}
                            {!isMinimized && (
                              <div className='px-3 pb-3'>
                                {job.total_products > 0 ? (
                                  <>
                                    <div className='w-full bg-gray-200 rounded-full h-2 mb-2'>
                                      <div
                                        className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                                        style={{
                                          width: `${job.progress_percentage}%`,
                                        }}
                                      />
                                    </div>
                                    <div className='flex justify-between text-xs text-gray-600'>
                                      <span>
                                        {job.current_product} /{' '}
                                        {job.total_products} products
                                      </span>
                                      <span>
                                        {job.progress_percentage.toFixed(1)}%
                                      </span>
                                    </div>
                                  </>
                                ) : (
                                  <div className='text-xs text-gray-600'>
                                    {job.message || 'Initializing...'}
                                  </div>
                                )}

                                {job.status === 'completed' &&
                                  stats.scraped > 0 && (
                                    <div className='mt-2 p-2 bg-green-50 rounded border border-green-200'>
                                      <div className='text-xs text-green-700'>
                                        ✅ Successfully scraped:
                                      </div>
                                      <div className='text-xs text-green-600 mt-1'>
                                        • {stats.scraped} total products
                                      </div>
                                      <div className='text-xs text-green-600'>
                                        • {stats.variations} variations
                                      </div>
                                    </div>
                                  )}

                                {job.status === 'failed' &&
                                  job.error_message && (
                                    <div className='mt-2 p-2 bg-red-50 rounded border border-red-200'>
                                      <div className='text-xs text-red-700'>
                                        ❌ {job.error_message}
                                      </div>
                                    </div>
                                  )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Step 3 */}
                  <div className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'>
                    <div className='flex items-center space-x-3'>
                      <div className='w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center'>
                        <span className='text-purple-600 font-semibold'>3</span>
                      </div>
                      <div>
                        <h4 className='font-medium text-gray-900'>
                          Review Scraped Products
                        </h4>
                        <p className='text-sm text-gray-600'>
                          Review and validate scraped product data
                        </p>
                        {step3Status.message && (
                          <p
                            className={`text-sm ${getStatusColor(step3Status, 'text-purple-600')}`}
                          >
                            {step3Status.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type='button'
                      onClick={handleStep3}
                      className='px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors'
                    >
                      Review Products
                    </button>
                  </div>

                  {/* Step 4 */}
                  <div className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'>
                    <div className='flex items-center space-x-3'>
                      <div className='w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center'>
                        <span className='text-orange-600 font-semibold'>4</span>
                      </div>
                      <div>
                        <h4 className='font-medium text-gray-900'>
                          View Products Table
                        </h4>
                        <p className='text-sm text-gray-600'>
                          Display all scraped products in a table format
                        </p>
                        {step4Status.message && (
                          <p
                            className={`text-sm ${getStatusColor(step4Status, 'text-orange-600')}`}
                          >
                            {step4Status.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type='button'
                      onClick={handleStep4}
                      className='px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors'
                    >
                      View Table
                    </button>
                  </div>
                </div>
              </div>

              {/* Products Table */}
              {showStep4Dropdown && (
                <div className='bg-white rounded-lg shadow-sm p-6'>
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-lg font-semibold text-gray-900'>
                      Products Table ({step4Products.length} products)
                    </h3>
                    <div className='flex items-center space-x-2'>
                      <button
                        type='button'
                        onClick={() => setIsTableMinimized(!isTableMinimized)}
                        className='px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors'
                      >
                        {isTableMinimized ? 'Expand' : 'Minimize'}
                      </button>
                      <button
                        type='button'
                        onClick={() => setShowStep4Dropdown(false)}
                        className='text-gray-400 hover:text-gray-600'
                      >
                        <XCircle className='w-5 h-5' />
                      </button>
                    </div>
                  </div>

                  <ProductsTable
                    products={step4Products}
                    isMinimized={isTableMinimized}
                    onToggleMinimize={() =>
                      setIsTableMinimized(!isTableMinimized)
                    }
                    onClose={() => setShowStep4Dropdown(false)}
                    columns={[]}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AustliftScraperDashboard;
