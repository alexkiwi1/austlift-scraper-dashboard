import React, { useState, useCallback } from 'react';
import { Home, XCircle } from 'lucide-react';
import type {
  Category,
  Product,
  ScrapeResponse,
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
   * Fetches categories from the API
   * @returns {Promise<void>} Promise that resolves when categories are loaded
   * @throws {Error} When API request fails
   */
  const fetchCategories = useCallback(async (): Promise<void> => {
    try {
      setError({ hasError: false, message: '' });
      const response = await fetch('/categories/fetch');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch categories';
      setError({ hasError: true, message: errorMessage });
      console.error('Error fetching categories:', err);
    }
  }, []);

  /**
   * Refreshes categories from the API
   * @returns {Promise<void>} Promise that resolves when categories are refreshed
   * @throws {Error} When API request fails
   */
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
    setStep1Status({ status: 'loading', message: 'Fetching categories...' });
    await fetchCategories();
    setStep1Status({ status: 'loading', message: 'Refreshing categories...' });
    await refreshCategories();
    setStep1Status({
      status: 'success',
      message: '✅ Step 1 Complete! Categories loaded successfully',
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
      message: 'Selecting all categories...',
    });
    // Note: Category selection is handled by the API call

    setStep2Status({ status: 'loading', message: 'Starting scraping...' });
    try {
      const response = await fetch('/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_url: categories[0]?.url,
          max_pages: 10, // Increased to get more products
          scrape_variations: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ScrapeResponse = await response.json();
      setStep2Status({
        status: 'success',
        message: `✅ Complete! Steps 1 & 2 finished successfully! Job ID: ${data.job_id}`,
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
   * Initializes previous steps and loads products
   * @returns {Promise<void>} Promise that resolves when step is complete
   */
  const handleStep3 = async (): Promise<void> => {
    setStep3Status({
      status: 'loading',
      message: 'Initializing previous steps...',
    });
    await handleStep2();

    setStep3Status({ status: 'loading', message: 'Loading products...' });
    try {
      const response = await fetch('/products?limit=10000&offset=0');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setStep3Status({
        status: 'success',
        message: `✅ Complete! Loaded ${data.total || 0} products`,
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
    await handleStep3();

    setStep4Status({
      status: 'loading',
      message: 'Loading ALL products for table display...',
    });
    try {
      const response = await fetch('/products?limit=10000&offset=0');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();

      if (!data.products || data.products.length === 0) {
        setStep4Products([]);
        setStep4Status({
          status: 'error',
          message: '⚠️ No products available for display',
        });
        return;
      }

      setStep4Products(data.products);
      setStep4Status({
        status: 'success',
        message: `✅ ALL products loaded! Showing ${data.products.length} products`,
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
                          Start scraping products from categories (up to 10
                          pages)
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

                  {!isTableMinimized && step4Products.length > 0 && (
                    <div className='overflow-x-auto'>
                      <table className='min-w-full divide-y divide-gray-200'>
                        <thead className='bg-gray-50'>
                          <tr>
                            {Object.keys(step4Products[0]).map(field => (
                              <th
                                key={field}
                                className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                              >
                                {field.replace(/_/g, ' ')}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className='bg-white divide-y divide-gray-200'>
                          {step4Products.map((product, index) => (
                            <tr
                              key={product.id || `product-${index}`}
                              className='hover:bg-gray-50'
                            >
                              {Object.entries(product).map(
                                ([fieldName, value]) => (
                                  <td
                                    key={`${product.id || `product-${index}`}-${fieldName}`}
                                    className='px-4 py-3 text-sm text-gray-900 max-w-xs truncate'
                                    title={String(value)}
                                  >
                                    {value === null || value === undefined
                                      ? '-'
                                      : String(value)}
                                  </td>
                                )
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {step4Products.length === 0 && (
                    <div className='text-center py-8'>
                      <p className='text-gray-500'>No products found</p>
                    </div>
                  )}

                  {isTableMinimized && step4Products.length > 0 && (
                    <div className='text-center py-4 bg-gray-50 rounded-lg'>
                      <p className='text-gray-600'>
                        Table minimized - Click &quot;Expand&quot; to view
                        products
                      </p>
                    </div>
                  )}
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
