import React, { useState, useEffect, useCallback } from 'react';
import {
  RotateCcw,
  Package,
  BarChart3,
  TrendingUp,
  Settings,
  ChevronDown,
  ChevronRight,
  Clock,
  Calendar,
  Cog,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  RefreshCw,
  Eye,
  Database,
  Play,
  Search,
  Home,
  List,
} from 'lucide-react';

const AustliftScraperDashboard = () => {
  // State management
  const [activeSection, setActiveSection] = useState('home');
  const [activeSubSection, setActiveSubSection] = useState('overview');

  // Status tracking for Home Dashboard actions
  const [step1Status, setStep1Status] = useState('');
  const [step2Status, setStep2Status] = useState('');
  const [step3Status, setStep3Status] = useState('');
  const [step4Status, setStep4Status] = useState('');
  const [showStep4Dropdown, setShowStep4Dropdown] = useState(false);
  const [csvData, setCsvData] = useState('');
  
  // Product popup state
  const [showProductPopup, setShowProductPopup] = useState(false);
  const [popupProducts, setPopupProducts] = useState([]);
  const [popupTitle, setPopupTitle] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    preparation: true,
    scraping: true,
    productCatalog: true,
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [buildingProductList, setBuildingProductList] = useState(false);
  const [productListStatus, setProductListStatus] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productListError, setProductListError] = useState(null);
  const [productCount, setProductCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(50);
  const [scrapingJobs, setScrapingJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [jobsFilter, setJobsFilter] = useState('all');
  const [autoRefreshJobs, setAutoRefreshJobs] = useState(true);
  const [cancellingJobId, setCancellingJobId] = useState(null);
  const [jobsRefreshInterval, setJobsRefreshInterval] = useState(null);

  // API functions
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch('/categories/fetch', {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setCategories(data.categories);
        setSuccess(`Loaded ${data.count} categories from cache`);
      } else {
        setError(data.error || 'Failed to fetch categories');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Request timeout: API server may be down or slow');
      } else if (err.message.includes('Failed to fetch')) {
        setError(
          'Cannot connect to API server. Please check if the server is running.'
        );
      } else {
        setError(`API error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for refresh

      const response = await fetch('/categories/refresh', {
        method: 'POST',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setCategories(data.categories);
        setSuccess(
          data.message || `Refreshed ${data.count} categories from website`
        );
      } else {
        setError(data.error || 'Failed to refresh categories');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Request timeout: Refresh operation took too long');
      } else if (err.message.includes('Failed to fetch')) {
        setError(
          'Cannot connect to API server. Please check if the server is running.'
        );
      } else {
        setError(`API error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Category selection functions
  const handleCategorySelect = categoryId => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedCategories.size === categories.length) {
      setSelectedCategories(new Set());
    } else {
      setSelectedCategories(new Set(categories.map(cat => cat.id)));
    }
  };

  const handleBuildProductList = async () => {
    if (selectedCategories.size === 0) {
      setError('Please select at least one category');
      return;
    }

    try {
      setBuildingProductList(true);
      setError(null);
      setProductListStatus('Building product list...');

      // Get category URLs for selected categories
      const selectedCategoryUrls = categories
        .filter(category => selectedCategories.has(category.id))
        .map(category => category.url);

      // Use the correct /scrape endpoint with required parameters
      const response = await fetch('/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category_url: selectedCategoryUrls[0], // API expects single URL, we'll use the first selected
          max_pages: 1, // Each category shows all products on one page
          use_auth: true, // Use authentication for scraping
          scrape_variations: true, // REQUIRED to get price/stock data!
        }),
      });

      const data = await response.json();

      if (data.job_id && data.status) {
        setProductListStatus(
          `Scraping job started! Job ID: ${data.job_id.substring(0, 8)}... (${data.status})`
        );
        setSuccess(
          `Started scraping job for ${selectedCategories.size} categories`
        );
      } else {
        setError(data.error || 'Failed to start scraping job');
        setProductListStatus(null);
      }
    } catch (err) {
      setError(`Network error: ${err.message}`);
      setProductListStatus(null);
    } finally {
      setBuildingProductList(false);
    }
  };

  const fetchProductCount = async () => {
    try {
      const response = await fetch('/products/count');
      const data = await response.json();
      setProductCount(data.count);
      return data.count;
    } catch (err) {
      setProductListError(`Failed to fetch product count: ${err.message}`);
      return 0;
    }
  };

  const clearAllProducts = async () => {
    try {
      const response = await fetch('/products', {
        method: 'DELETE',
      });
      const data = await response.json();
      setSuccess(data.message || 'All products cleared');
      setProducts([]);
      setProductCount(0);
      setCurrentPage(0);
    } catch (err) {
      setError(`Failed to clear products: ${err.message}`);
    }
  };

  const testServerConnection = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      const response = await fetch('/products/count', {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setSuccess(`✅ Server is online! Found ${data.count} products`);
        return true;
      }
      setError(
        `❌ Server responded with ${response.status}: ${response.statusText}`
      );
      return false;
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('⏰ Server timeout: API server is not responding');
      } else if (err.message.includes('Failed to fetch')) {
        setError('🔌 Cannot connect to API server at http://10.100.7.1:8000');
      } else {
        setError(`❌ Connection test failed: ${err.message}`);
      }
      return false;
    }
  };

  const fetchScrapingJobs = async () => {
    try {
      setLoadingJobs(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for large response

      const response = await fetch('/scraping-jobs', {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setScrapingJobs(data || []);
      return data || [];
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Request timeout: Failed to fetch scraping jobs');
      } else if (err.message.includes('Failed to fetch')) {
        setError('Cannot connect to API server for scraping jobs');
      } else {
        setError(`Failed to fetch scraping jobs: ${err.message}`);
      }
      return [];
    } finally {
      setLoadingJobs(false);
    }
  };

  const cancelJob = async jobId => {
    try {
      setCancellingJobId(jobId);
      const response = await fetch(`/scraping-jobs/${jobId}/cancel`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setSuccess(data.message || `Job ${jobId} cancelled`);

      // Refresh jobs list
      await fetchScrapingJobs();
    } catch (err) {
      setError(`Failed to cancel job: ${err.message}`);
    } finally {
      setCancellingJobId(null);
    }
  };

  const fetchProducts = useCallback(async (limit = 50, offset = 0) => {
    try {
      setLoadingProducts(true);
      setProductListError(null);

      // Ensure parameters are numbers
      const numLimit = Number(limit);
      const numOffset = Number(offset);

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(
        `/products?limit=${numLimit}&offset=${numOffset}`,
        {
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.products) {
        setProducts(data.products);
        setProductCount(data.total);
        setSuccess(`Loaded ${data.products.length} of ${data.total} products`);
      } else {
        setProductListError('No products found');
        // Try to get product count even if no products
        await fetchProductCount();
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setProductListError('Request timeout: API server may be down or slow');
      } else if (err.message.includes('Failed to fetch')) {
        setProductListError(
          'Cannot connect to API server. Please check if the server is running.'
        );
      } else {
        setProductListError(`API error: ${err.message}`);
      }
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  // Auto-load products when navigating to Product List tab
  useEffect(() => {
    if (
      activeSection === 'preparation' &&
      activeSubSection === 'product-list'
    ) {
      // Small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        fetchProducts(pageSize, 0);
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [activeSection, activeSubSection, fetchProducts, pageSize]);

  // Auto-refresh jobs when Jobs tab is active
  useEffect(() => {
    if (
      activeSection === 'preparation' &&
      activeSubSection === 'jobs' &&
      autoRefreshJobs
    ) {
      // Initial fetch
      fetchScrapingJobs();

      // Set up interval
      const interval = setInterval(() => {
        fetchScrapingJobs();
      }, 5000); // 5 seconds

      setJobsRefreshInterval(interval);

      return () => {
        clearInterval(interval);
      };
    }
    if (jobsRefreshInterval) {
      clearInterval(jobsRefreshInterval);
      setJobsRefreshInterval(null);
    }
    return undefined;
  }, [activeSection, activeSubSection, autoRefreshJobs, fetchScrapingJobs]);

  // Event handlers
  const handleSectionClick = section => {
    setActiveSection(section);
    if (section === 'preparation') {
      setActiveSubSection('category');
    } else if (section === 'scraping') {
      setActiveSubSection('active-jobs');
    }
  };

  const handleSubSectionClick = subSection => {
    setActiveSubSection(subSection);
  };

  const toggleExpanded = section => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className='min-h-screen bg-gray-50 flex'>
      {/* Sidebar */}
      <div className='w-64 bg-white shadow-lg'>
        <div className='p-6'>
          <h1 className='text-xl font-bold text-gray-900'>Austlift Scraper</h1>
        </div>

        <nav className='px-4 pb-4'>
          {/* Home Section */}
          <div className='mb-4'>
            <button
              type='button'
              onClick={() => handleSectionClick('home')}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg text-sm font-medium transition-colors ${
                activeSection === 'home'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Home className='w-5 h-5' />
              <span>Home Dashboard</span>
            </button>
          </div>

          {/* Preparation Section */}
          <div className='mb-4'>
            <button
              type='button'
              onClick={() => handleSectionClick('preparation')}
              className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                activeSection === 'preparation'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className='flex items-center space-x-3'>
                <Play className='w-5 h-5' />
                <span className='font-medium'>Preparation</span>
              </div>
              <button
                type='button'
                onClick={e => {
                  e.stopPropagation();
                  toggleExpanded('preparation');
                }}
                className='p-1'
              >
                {expandedSections.preparation ? (
                  <ChevronDown className='w-4 h-4' />
                ) : (
                  <ChevronRight className='w-4 h-4' />
                )}
              </button>
            </button>

            {expandedSections.preparation && (
              <div className='ml-8 mt-2 space-y-1'>
                <button
                  type='button'
                  onClick={() => handleSubSectionClick('category')}
                  className={`w-full flex items-center space-x-3 p-2 rounded-lg text-sm transition-colors ${
                    activeSubSection === 'category'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Search className='w-4 h-4' />
                  <span>Category</span>
                </button>
                <button
                  type='button'
                  onClick={() => handleSubSectionClick('product-list')}
                  className={`w-full flex items-center space-x-3 p-2 rounded-lg text-sm transition-colors ${
                    activeSubSection === 'product-list'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Package className='w-4 h-4' />
                  <span>Product List</span>
                </button>
                <button
                  type='button'
                  onClick={() => handleSubSectionClick('jobs')}
                  className={`w-full flex items-center space-x-3 p-2 rounded-lg text-sm transition-colors ${
                    activeSubSection === 'jobs'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Clock className='w-4 h-4' />
                  <span>Jobs</span>
                </button>
              </div>
            )}
          </div>

          {/* Scraping Section */}
          <div className='mb-4'>
            <button
              type='button'
              onClick={() => handleSectionClick('scraping')}
              className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                activeSection === 'scraping'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className='flex items-center space-x-3'>
                <RotateCcw className='w-5 h-5' />
                <span className='font-medium'>Scraping</span>
              </div>
              <button
                type='button'
                onClick={e => {
                  e.stopPropagation();
                  toggleExpanded('scraping');
                }}
                className='p-1'
              >
                {expandedSections.scraping ? (
                  <ChevronDown className='w-4 h-4' />
                ) : (
                  <ChevronRight className='w-4 h-4' />
                )}
              </button>
            </button>

            {expandedSections.scraping && (
              <div className='ml-8 mt-2 space-y-1'>
                <button
                  type='button'
                  onClick={() => handleSubSectionClick('active-jobs')}
                  className={`w-full flex items-center space-x-3 p-2 rounded-lg text-sm transition-colors ${
                    activeSubSection === 'active-jobs'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Clock className='w-4 h-4' />
                  <span>Active Jobs</span>
                </button>
              </div>
            )}
          </div>

          {/* Product Catalog Scraping */}
          <div className='mb-4'>
            <button
              type='button'
              onClick={() => handleSectionClick('product-catalog')}
              className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                activeSection === 'product-catalog'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className='flex items-center space-x-3'>
                <Package className='w-5 h-5' />
                <span className='font-medium'>Product Catalog Scraping</span>
              </div>
              <button
                type='button'
                onClick={e => {
                  e.stopPropagation();
                  toggleExpanded('productCatalog');
                }}
                className='p-1'
              >
                {expandedSections.productCatalog ? (
                  <ChevronDown className='w-4 h-4' />
                ) : (
                  <ChevronRight className='w-4 h-4' />
                )}
              </button>
            </button>

            {expandedSections.productCatalog && (
              <div className='ml-8 mt-2 space-y-1'>
                <button
                  type='button'
                  onClick={() => handleSubSectionClick('history')}
                  className={`w-full flex items-center space-x-3 p-2 rounded-lg text-sm transition-colors ${
                    activeSubSection === 'history'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Clock className='w-4 h-4' />
                  <span>History</span>
                </button>
                <button
                  type='button'
                  onClick={() => handleSubSectionClick('schedule')}
                  className={`w-full flex items-center space-x-3 p-2 rounded-lg text-sm transition-colors ${
                    activeSubSection === 'schedule'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Calendar className='w-4 h-4' />
                  <span>Schedule</span>
                </button>
                <button
                  type='button'
                  onClick={() => handleSubSectionClick('settings')}
                  className={`w-full flex items-center space-x-3 p-2 rounded-lg text-sm transition-colors ${
                    activeSubSection === 'settings'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Cog className='w-4 h-4' />
                  <span>Settings</span>
                </button>
              </div>
            )}
          </div>

          {/* Other Navigation Items */}
          <div className='space-y-1'>
            <button
              type='button'
              onClick={() => handleSectionClick('products')}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                activeSection === 'products'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Package className='w-5 h-5' />
              <span className='font-medium'>Products</span>
            </button>

            <button
              type='button'
              onClick={() => handleSectionClick('categories')}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                activeSection === 'categories'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <BarChart3 className='w-5 h-5' />
              <span className='font-medium'>Categories</span>
            </button>

            <button
              type='button'
              onClick={() => handleSectionClick('analytics')}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                activeSection === 'analytics'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <TrendingUp className='w-5 h-5' />
              <span className='font-medium'>Analytics</span>
            </button>

            <button
              type='button'
              onClick={() => handleSectionClick('settings')}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                activeSection === 'settings'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Settings className='w-5 h-5' />
              <span className='font-medium'>Settings</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className='flex-1 flex flex-col'>
        {/* Header */}
        <div className='bg-white shadow-sm border-b px-6 py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-2'>
              <h2 className='text-lg font-semibold text-gray-900'>
                {activeSection === 'home' &&
                  activeSubSection === 'overview' &&
                  'Home Dashboard > Overview'}
                {activeSection === 'preparation' &&
                  activeSubSection === 'category' &&
                  'Preparation > Category'}
                {activeSection === 'preparation' &&
                  activeSubSection === 'product-list' &&
                  'Preparation > Product List'}
                {activeSection === 'preparation' &&
                  activeSubSection === 'jobs' &&
                  'Preparation > Jobs'}
                {activeSection === 'scraping' &&
                  activeSubSection === 'active-jobs' &&
                  'Scraping > Active'}
                {activeSection === 'product-catalog' &&
                  activeSubSection === 'history' &&
                  'Product Catalog > History'}
                {activeSection === 'product-catalog' &&
                  activeSubSection === 'schedule' &&
                  'Product Catalog > Schedule'}
                {activeSection === 'product-catalog' &&
                  activeSubSection === 'settings' &&
                  'Product Catalog > Settings'}
                {activeSection === 'products' && 'Products'}
                {activeSection === 'categories' && 'Categories'}
                {activeSection === 'analytics' && 'Analytics'}
                {activeSection === 'settings' && 'Settings'}
              </h2>
            </div>
            <div className='text-sm text-gray-600'>Welcome back!</div>
          </div>
        </div>

        {/* Content Area */}
        <div className='flex-1 p-6'>
          {/* Home Dashboard */}
          {activeSection === 'home' && activeSubSection === 'overview' && (
            <div className='space-y-6'>
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
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-6'>
                  <div className='bg-white bg-opacity-10 rounded-lg p-4'>
                    <div className='text-2xl font-bold'>{productCount}</div>
                    <div className='text-blue-100'>Products Scraped</div>
                  </div>
                  <div className='bg-white bg-opacity-10 rounded-lg p-4'>
                    <div className='text-2xl font-bold'>
                      {categories.length}
                    </div>
                    <div className='text-blue-100'>Categories Available</div>
                  </div>
                  <div className='bg-white bg-opacity-10 rounded-lg p-4'>
                    <div className='text-2xl font-bold'>
                      {scrapingJobs.length}
                    </div>
                    <div className='text-blue-100'>Total Jobs</div>
                  </div>
                </div>
              </div>

              {/* Workflow Steps */}
              <div className='bg-white rounded-lg shadow-sm p-6'>
                <h2 className='text-xl font-semibold text-gray-900 mb-6'>
                  Product Data Management Workflow
                </h2>

                <div className='space-y-4'>
                  {/* Step 1: Review Categories */}
                  <div className='border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-4'>
                        <div className='flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold'>
                          1
                        </div>
                        <div>
                          <h3 className='text-lg font-medium text-gray-900'>
                            Review Category List
                          </h3>
                          <p className='text-gray-600'>
                            Fetch and review all available product categories
                            from the website
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center space-x-4'>
                        <div className='flex-1'>
                          {step1Status && (
                            <div className='text-sm text-gray-600 mb-2'>
                              {step1Status}
                            </div>
                          )}
                        </div>
                        <button
                          type='button'
                          onClick={async () => {
                            // Clear all previous statuses
                            setStep1Status(
                              'Starting fresh: Fetching categories...'
                            );
                            setStep2Status('');
                            setStep3Status('');

                            try {
                              await fetchCategories();
                              setStep1Status(
                                'Refreshing categories from website...'
                              );
                              await refreshCategories();
                              setStep1Status(
                                '✅ Step 1 Complete! Categories loaded successfully'
                              );
                            } catch (err) {
                              setStep1Status(`❌ Error: ${err.message}`);
                            }
                          }}
                          className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2'
                        >
                          <Search className='w-4 h-4' />
                          <span>Start Review</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Scrape Products */}
                  <div className='border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-4'>
                        <div className='flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-semibold'>
                          2
                        </div>
                        <div>
                          <h3 className='text-lg font-medium text-gray-900'>
                            Scrape Product Lists
                          </h3>
                          <p className='text-gray-600'>
                            Start scraping all products from selected categories
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center space-x-4'>
                        <div className='flex-1'>
                          {step2Status && (
                            <div className='text-sm text-gray-600 mb-2'>
                              {step2Status}
                            </div>
                          )}
                        </div>
                        <button
                          type='button'
                          onClick={async () => {
                            setStep2Status(
                              'Reinitializing Step 1: Fetching categories...'
                            );

                            try {
                              // Step 1: Fetch and refresh categories
                              await fetchCategories();
                              setStep2Status(
                                'Step 1: Refreshing categories from website...'
                              );
                              await refreshCategories();
                              setStep2Status(
                                'Step 1 ✅ Complete! Now starting Step 2...'
                              );

                              // Step 2: Select all categories and start scraping
                              setStep2Status(
                                'Step 2: Selecting all categories...'
                              );
                              const allCategoryIds = categories.map(
                                cat => cat.id
                              );
                              allCategoryIds.forEach(id =>
                                selectedCategories.add(id)
                              );

                              if (allCategoryIds.length > 0) {
                                setStep2Status(
                                  'Step 2: Starting scraping job...'
                                );
                                await handleBuildProductList();
                                setStep2Status(
                                  '✅ Complete! Steps 1 & 2 finished successfully!'
                                );
                              } else {
                                setStep2Status('❌ No categories found');
                              }
                            } catch (err) {
                              setStep2Status(`❌ Error: ${err.message}`);
                            }
                          }}
                          className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2'
                        >
                          <Activity className='w-4 h-4' />
                          <span>Start Scraping</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Review Products */}
                  <div className='border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-4'>
                        <div className='flex-shrink-0 w-8 h-8 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center font-semibold'>
                          3
                        </div>
                        <div>
                          <h3 className='text-lg font-medium text-gray-900'>
                            Review Scraped Products
                          </h3>
                          <p className='text-gray-600'>
                            Review and validate scraped product data
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center space-x-4'>
                        <div className='flex-1'>
                          {step3Status && (
                            <div className='text-sm text-gray-600 mb-2'>
                              {step3Status}
                            </div>
                          )}
                        </div>
                        <div className='flex items-center space-x-2'>
                          <button
                            type='button'
                            onClick={async () => {
                              setStep3Status(
                                'Reinitializing Step 1: Fetching categories...'
                              );

                            try {
                              // Step 1: Fetch and refresh categories
                              await fetchCategories();
                              setStep3Status(
                                'Step 1: Refreshing categories from website...'
                              );
                              await refreshCategories();
                              setStep3Status(
                                'Step 1 ✅ Complete! Now starting Step 2...'
                              );

                              // Step 2: Select all categories and start scraping
                              setStep3Status(
                                'Step 2: Selecting all categories...'
                              );
                              const allCategoryIds = categories.map(
                                cat => cat.id
                              );
                              allCategoryIds.forEach(id =>
                                selectedCategories.add(id)
                              );

                              if (allCategoryIds.length > 0) {
                                setStep3Status(
                                  'Step 2: Starting scraping job for ALL categories...'
                                );

                                // Start scraping job for ALL categories
                                try {
                                  // Get all category URLs from the categories state
                                  const allCategoryUrls = categories.map(
                                    cat => cat.url
                                  );

                                  if (allCategoryUrls.length === 0) {
                                    setStep3Status(
                                      '❌ No categories available to scrape'
                                    );
                                    return;
                                  }

                                  setStep3Status(
                                    `Step 2: Starting scraping job for ${allCategoryUrls.length} categories...`
                                  );

                                  // Start scraping with the first category (API only accepts one at a time)
                                  // The backend will handle scraping all categories internally
                                  const response = await fetch('/scrape', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                      category_url: allCategoryUrls[0], // Start with first category
                                      max_pages: 1, // Each category shows all products on one page
                                      use_auth: true, // Use authentication for scraping
                                      scrape_variations: true, // REQUIRED to get price/stock data!
                                    }),
                                  });

                                  const data = await response.json();

                                  if (data.job_id && data.status) {
                                    setStep3Status(
                                      `Step 2: Scraping job started! Job ID: ${data.job_id.substring(0, 8)}... (${data.status}) - Processing ${allCategoryUrls.length} categories`
                                    );
                                  } else {
                                    setStep3Status(
                                      `❌ Error: ${data.error || 'Failed to start scraping job'}`
                                    );
                                    return;
                                  }
                                } catch (err) {
                                  setStep3Status(`❌ Error: ${err.message}`);
                                  return;
                                }

                                setStep3Status(
                                  'Step 2 ✅ Complete! Waiting for scraping to finish...'
                                );

                                // Wait for scraping job to complete (check job status)
                                setStep3Status(
                                  'Step 3: Monitoring scraping job progress...'
                                );
                                let attempts = 0;
                                let jobCompleted = false;
                                let currentProductCount = 0;

                                while (attempts < 60 && !jobCompleted) {
                                  // Wait up to 60 checks (1 minute)
                                  await new Promise(resolve =>
                                    setTimeout(resolve, 2000)
                                  ); // Wait 2 seconds

                                  try {
                                    // Check scraping jobs status
                                    const jobsResponse =
                                      await fetch('/scraping-jobs');
                                    if (jobsResponse.ok) {
                                      const jobsData =
                                        await jobsResponse.json();
                                      const runningJobs = jobsData.filter(
                                        job => job.status === 'running'
                                      );
                                      const completedJobs = jobsData.filter(
                                        job => job.status === 'completed'
                                      );

                                      if (runningJobs.length === 0) {
                                        // No running jobs, check if we have products
                                        const productsResponse = await fetch(
                                          `/products?limit=${pageSize}&offset=0`
                                        );
                                        if (productsResponse.ok) {
                                          const productsData =
                                            await productsResponse.json();
                                          currentProductCount =
                                            productsData.total || 0;

                                          if (currentProductCount > 0) {
                                            jobCompleted = true;
                                            setStep3Status(
                                              `✅ Complete! All steps finished! Loaded ${currentProductCount} products`
                                            );
                                            
                                            // Store products for popup
                                            setPopupProducts(data.products || []);
                                            setPopupTitle(`Scraped Products (${currentProductCount} total)`);
                                          } else if (completedJobs.length > 0) {
                                            // Job completed but no products found
                                            jobCompleted = true;
                                            setStep3Status(
                                              `⚠️ Job completed but no products found. Check scraping configuration.`
                                            );
                                          } else {
                                            attempts += 1;
                                            setStep3Status(
                                              `Step 3: No active jobs found, checking for products... (${attempts}/60)`
                                            );
                                          }
                                        } else {
                                          attempts += 1;
                                          setStep3Status(
                                            `Step 3: Checking job status... (${attempts}/60)`
                                          );
                                        }
                                      } else {
                                        // Show job progress
                                        const job = runningJobs[0];
                                        const productsProcessed =
                                          job.products_processed || 0;
                                        const productsFound =
                                          job.products_found || 0;
                                        const progressPercent = (
                                          job.progress_percent || 0
                                        ).toFixed(1);

                                        if (productsProcessed > 0) {
                                          setStep3Status(
                                            `Step 3: ${progressPercent}% - Processed: ${productsProcessed}, Found: ${productsFound} (${attempts}/60)`
                                          );
                                        } else if (job.message) {
                                          setStep3Status(
                                            `Step 3: ${job.message} (${attempts}/60)`
                                          );
                                        } else {
                                          setStep3Status(
                                            `Step 3: Scraping in progress... (${attempts}/60)`
                                          );
                                        }
                                        attempts += 1;
                                      }
                                    } else {
                                      attempts += 1;
                                      setStep3Status(
                                        `Step 3: Checking job status... (${attempts}/60)`
                                      );
                                    }
                                  } catch (err) {
                                    attempts += 1;
                                    setStep3Status(
                                      `Step 3: Checking job status... (${attempts}/60)`
                                    );
                                  }
                                }

                                if (!jobCompleted) {
                                  setStep3Status(
                                    `⚠️ Scraping may still be running. Found ${currentProductCount} products so far.`
                                  );
                                }
                              } else {
                                setStep3Status('❌ No categories found');
                              }
                            } catch (err) {
                              setStep3Status(`❌ Error: ${err.message}`);
                            }
                          }}
                          className='px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center space-x-2'
                        >
                          <Eye className='w-4 h-4' />
                          <span>Review Products</span>
                        </button>
                        
                        {/* Info Button - Show when products are loaded */}
                        {step3Status && step3Status.includes('Complete! All steps finished!') && (
                          <button
                            type='button'
                            onClick={() => setShowProductPopup(true)}
                            className='px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2'
                            title='View scraped products in table format'
                          >
                            <Eye className='w-4 h-4' />
                            <span>Info</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Step 4: Export CSV */}
                  <div className='border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-4'>
                        <div className='flex-shrink-0 w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-semibold'>
                          4
                        </div>
                        <div>
                          <h3 className='text-lg font-medium text-gray-900'>
                            Export Products to CSV
                          </h3>
                          <p className='text-gray-600'>
                            Generate and view all products in CSV format
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center space-x-4'>
                        <div className='flex-1'>
                          {step4Status && (
                            <div className='text-sm text-gray-600 mb-2'>
                              {step4Status}
                            </div>
                          )}
                        </div>
                        <button
                          type='button'
                          onClick={async () => {
                            setStep4Status('Reinitializing all steps...');

                            try {
                              // Step 1: Fetch and refresh categories
                              await fetchCategories();
                              setStep4Status(
                                'Step 1: Refreshing categories...'
                              );
                              await refreshCategories();
                              setStep4Status(
                                'Step 1 ✅ Complete! Now starting Step 2...'
                              );

                              // Step 2: Select all categories and start scraping
                              const allCategoryIds = categories.map(
                                cat => cat.id
                              );
                              allCategoryIds.forEach(id =>
                                selectedCategories.add(id)
                              );

                              if (allCategoryIds.length > 0) {
                                setStep4Status(
                                  'Step 2: Starting scraping job for ALL categories...'
                                );

                                // Start scraping job for ALL categories
                                try {
                                  // Get all category URLs from the categories state
                                  const allCategoryUrls = categories.map(
                                    cat => cat.url
                                  );

                                  if (allCategoryUrls.length === 0) {
                                    setStep4Status(
                                      '❌ No categories available to scrape'
                                    );
                                    return;
                                  }

                                  setStep4Status(
                                    `Step 2: Starting scraping job for ${allCategoryUrls.length} categories...`
                                  );

                                  // Start scraping with the first category (API only accepts one at a time)
                                  // The backend will handle scraping all categories internally
                                  const response = await fetch('/scrape', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                      category_url: allCategoryUrls[0], // Start with first category
                                      max_pages: 1, // Each category shows all products on one page
                                      use_auth: true, // Use authentication for scraping
                                      scrape_variations: true, // REQUIRED to get price/stock data!
                                    }),
                                  });

                                  const data = await response.json();

                                  if (data.job_id && data.status) {
                                    setStep4Status(
                                      `Step 2: Scraping job started! Job ID: ${data.job_id.substring(0, 8)}... (${data.status}) - Processing ${allCategoryUrls.length} categories`
                                    );
                                  } else {
                                    setStep4Status(
                                      `❌ Error: ${data.error || 'Failed to start scraping job'}`
                                    );
                                    return;
                                  }
                                } catch (err) {
                                  setStep4Status(`❌ Error: ${err.message}`);
                                  return;
                                }

                                setStep4Status(
                                  'Step 2 ✅ Complete! Waiting for scraping...'
                                );

                                // Wait for scraping to complete (check job status)
                                setStep4Status(
                                  'Step 3: Monitoring scraping job progress...'
                                );
                                let attempts = 0;
                                let jobCompleted = false;
                                let currentProductCount = 0;

                                while (attempts < 60 && !jobCompleted) {
                                  // Wait up to 60 checks (1 minute)
                                  await new Promise(resolve =>
                                    setTimeout(resolve, 2000)
                                  ); // Wait 2 seconds

                                  try {
                                    // Check scraping jobs status
                                    const jobsResponse =
                                      await fetch('/scraping-jobs');
                                    if (jobsResponse.ok) {
                                      const jobsData =
                                        await jobsResponse.json();
                                      const runningJobs = jobsData.filter(
                                        job => job.status === 'running'
                                      );
                                      const completedJobs = jobsData.filter(
                                        job => job.status === 'completed'
                                      );

                                      if (runningJobs.length === 0) {
                                        // No running jobs, check if we have products
                                        const productsResponse = await fetch(
                                          `/products?limit=${pageSize}&offset=0`
                                        );
                                        if (productsResponse.ok) {
                                          const productsData =
                                            await productsResponse.json();
                                          currentProductCount =
                                            productsData.total || 0;

                                          if (currentProductCount > 0) {
                                            jobCompleted = true;
                                            setStep4Status(
                                              'Step 3 ✅ Complete! Now generating CSV...'
                                            );
                                          } else if (completedJobs.length > 0) {
                                            // Job completed but no products found
                                            jobCompleted = true;
                                            setStep4Status(
                                              '⚠️ Job completed but no products found. Check scraping configuration.'
                                            );
                                          } else {
                                            attempts += 1;
                                            setStep4Status(
                                              `Step 3: No active jobs found, checking for products... (${attempts}/60)`
                                            );
                                          }
                                        } else {
                                          attempts += 1;
                                          setStep4Status(
                                            `Step 3: Checking job status... (${attempts}/60)`
                                          );
                                        }
                                      } else {
                                        // Show job progress
                                        const job = runningJobs[0];
                                        const productsProcessed =
                                          job.products_processed || 0;
                                        const productsFound =
                                          job.products_found || 0;
                                        const progressPercent = (
                                          job.progress_percent || 0
                                        ).toFixed(1);

                                        if (productsProcessed > 0) {
                                          setStep4Status(
                                            `Step 3: ${progressPercent}% - Processed: ${productsProcessed}, Found: ${productsFound} (${attempts}/60)`
                                          );
                                        } else if (job.message) {
                                          setStep4Status(
                                            `Step 3: ${job.message} (${attempts}/60)`
                                          );
                                        } else {
                                          setStep4Status(
                                            `Step 3: Scraping in progress... (${attempts}/60)`
                                          );
                                        }
                                        attempts += 1;
                                      }
                                    } else {
                                      attempts += 1;
                                      setStep4Status(
                                        `Step 3: Checking job status... (${attempts}/60)`
                                      );
                                    }
                                  } catch (err) {
                                    attempts += 1;
                                    setStep4Status(
                                      `Step 3: Checking job status... (${attempts}/60)`
                                    );
                                  }
                                }

                                // Step 4: Generate CSV
                                try {
                                  setStep4Status('Generating CSV data...');

                                  // Fetch all products (no pagination limit)
                                  const response = await fetch(
                                    '/products?limit=10000&offset=0'
                                  );
                                  if (!response.ok) {
                                    throw new Error(
                                      `HTTP ${response.status}: ${response.statusText}`
                                    );
                                  }
                                  const data = await response.json();

                                  if (
                                    !data.products ||
                                    data.products.length === 0
                                  ) {
                                    setCsvData('No products found');
                                    setStep4Status(
                                      '⚠️ No products available for CSV export'
                                    );
                                    return;
                                  }

                                  // Get all unique field names from all products
                                  const allFields = new Set();
                                  data.products.forEach(product => {
                                    Object.keys(product).forEach(key =>
                                      allFields.add(key)
                                    );
                                  });

                                  const fieldNames =
                                    Array.from(allFields).sort();

                                  // Create CSV header
                                  const csvHeader = fieldNames.join(',');

                                  // Create CSV rows
                                  const csvRows = data.products.map(product =>
                                    fieldNames
                                      .map(field => {
                                        const value = product[field];
                                        // Handle null/undefined values
                                        if (
                                          value === null ||
                                          value === undefined
                                        )
                                          return '';
                                        // Escape commas and quotes in values
                                        const stringValue = String(value);
                                        if (
                                          stringValue.includes(',') ||
                                          stringValue.includes('"') ||
                                          stringValue.includes('\n')
                                        ) {
                                          return `"${stringValue.replace(/"/g, '""')}"`;
                                        }
                                        return stringValue;
                                      })
                                      .join(',')
                                  );

                                  const csvContent = [
                                    csvHeader,
                                    ...csvRows,
                                  ].join('\n');
                                  setCsvData(csvContent);
                                  setStep4Status(
                                    `✅ CSV generated! ${data.products.length} products exported`
                                  );
                                  setShowStep4Dropdown(true);
                                } catch (err) {
                                  setStep4Status(
                                    `❌ Error generating CSV: ${err.message}`
                                  );
                                  setCsvData('Error generating CSV data');
                                }
                              } else {
                                setStep4Status('❌ No categories found');
                              }
                            } catch (err) {
                              setStep4Status(`❌ Error: ${err.message}`);
                            }
                          }}
                          className='px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2'
                        >
                          <Download className='w-4 h-4' />
                          <span>Export CSV</span>
                        </button>
                      </div>
                    </div>

                    {/* CSV Dropdown */}
                    {showStep4Dropdown && (
                      <div className='mt-4 border-t pt-4'>
                        <div className='flex items-center justify-between mb-2'>
                          <h4 className='text-sm font-medium text-gray-700'>
                            CSV Data Preview
                          </h4>
                          <button
                            type='button'
                            onClick={() => setShowStep4Dropdown(false)}
                            className='text-gray-500 hover:text-gray-700'
                          >
                            <XCircle className='w-4 h-4' />
                          </button>
                        </div>
                        <div className='bg-gray-50 rounded-lg p-3 max-h-96 overflow-auto'>
                          <pre className='text-xs text-gray-800 whitespace-pre-wrap font-mono'>
                            {csvData}
                          </pre>
                        </div>
                        <div className='mt-2 flex space-x-2'>
                          <button
                            type='button'
                            onClick={() => {
                              const blob = new Blob([csvData], {
                                type: 'text/csv',
                              });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                            }}
                            className='px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700'
                          >
                            Download CSV
                          </button>
                          <button
                            type='button'
                            onClick={() => {
                              navigator.clipboard.writeText(csvData);
                              setStep4Status(
                                '✅ CSV data copied to clipboard!'
                              );
                            }}
                            className='px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700'
                          >
                            Copy to Clipboard
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step 5: WooCommerce Update (Future) */}
                  <div className='border border-gray-200 rounded-lg p-4 opacity-60'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-4'>
                        <div className='flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-semibold'>
                          5
                        </div>
                        <div>
                          <h3 className='text-lg font-medium text-gray-900'>
                            Update WooCommerce
                          </h3>
                          <p className='text-gray-600'>
                            Sync product data to WooCommerce store (Coming Soon)
                          </p>
                        </div>
                      </div>
                      <button
                        type='button'
                        disabled
                        className='px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed flex items-center space-x-2'
                      >
                        <Clock className='w-4 h-4' />
                        <span>Coming Soon</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className='bg-white rounded-lg shadow-sm p-6'>
                <h2 className='text-xl font-semibold text-gray-900 mb-4'>
                  Quick Actions
                </h2>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  <button
                    type='button'
                    onClick={async () => {
                      setActiveSection('preparation');
                      setActiveSubSection('jobs');
                      // Directly fetch and display jobs
                      await fetchScrapingJobs();
                    }}
                    className='p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left'
                  >
                    <div className='flex items-center space-x-3'>
                      <Clock className='w-6 h-6 text-blue-600' />
                      <div>
                        <h3 className='font-medium text-gray-900'>View Jobs</h3>
                        <p className='text-sm text-gray-600'>
                          Monitor scraping progress
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    type='button'
                    onClick={async () => {
                      setActiveSection('preparation');
                      setActiveSubSection('product-list');
                      // Directly load and display products
                      await fetchProducts(pageSize, 0);
                    }}
                    className='p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left'
                  >
                    <div className='flex items-center space-x-3'>
                      <Package className='w-6 h-6 text-green-600' />
                      <div>
                        <h3 className='font-medium text-gray-900'>
                          View Products
                        </h3>
                        <p className='text-sm text-gray-600'>
                          Browse scraped products
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    type='button'
                    onClick={async () => {
                      setActiveSection('preparation');
                      setActiveSubSection('category');
                      // Directly fetch and refresh categories
                      await fetchCategories();
                      await refreshCategories();
                    }}
                    className='p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left'
                  >
                    <div className='flex items-center space-x-3'>
                      <List className='w-6 h-6 text-purple-600' />
                      <div>
                        <h3 className='font-medium text-gray-900'>
                          Manage Categories
                        </h3>
                        <p className='text-sm text-gray-600'>
                          Configure scraping categories
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'preparation' &&
            activeSubSection === 'category' && (
              <div className='space-y-6'>
                {/* Category Management Header */}
                <div className='bg-white rounded-lg shadow-sm p-4'>
                  <div className='flex items-center justify-between mb-3'>
                    <div className='flex items-center space-x-2'>
                      <Search className='w-4 h-4 text-blue-500' />
                      <h3 className='text-lg font-semibold text-gray-900'>
                        Categories
                      </h3>
                      {categories.length > 0 && (
                        <span className='text-sm text-gray-500'>
                          ({categories.length})
                        </span>
                      )}
                    </div>
                    <div className='flex items-center space-x-2'>
                      <button
                        type='button'
                        onClick={fetchCategories}
                        disabled={loading}
                        className='px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors flex items-center space-x-1 disabled:opacity-50'
                      >
                        <Database className='w-3 h-3' />
                        <span>Load</span>
                      </button>
                      <button
                        type='button'
                        onClick={refreshCategories}
                        disabled={loading}
                        className='px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors flex items-center space-x-1 disabled:opacity-50'
                      >
                        {loading ? (
                          <RefreshCw className='w-3 h-3 animate-spin' />
                        ) : (
                          <RefreshCw className='w-3 h-3' />
                        )}
                        <span>Refresh</span>
                      </button>
                    </div>
                  </div>

                  {/* Status Messages */}
                  {error && (
                    <div className='mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center space-x-1'>
                          <XCircle className='w-4 h-4 text-red-600' />
                          <span className='text-red-800'>{error}</span>
                        </div>
                        <button
                          type='button'
                          onClick={fetchCategories}
                          className='px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors'
                        >
                          Retry
                        </button>
                      </div>
                    </div>
                  )}

                  {success && (
                    <div className='mb-3 p-2 bg-green-50 border border-green-200 rounded text-sm'>
                      <div className='flex items-center space-x-1'>
                        <CheckCircle className='w-4 h-4 text-green-600' />
                        <span className='text-green-800'>{success}</span>
                      </div>
                    </div>
                  )}

                  {/* Loading State */}
                  {loading && (
                    <div className='mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center space-x-1'>
                          <RefreshCw className='w-4 h-4 text-blue-600 animate-spin' />
                          <span className='text-blue-800'>
                            Loading categories...
                          </span>
                        </div>
                        <div className='text-xs text-blue-600'>
                          This may take a moment if the API server is slow
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Product List Status */}
                  {productListStatus && (
                    <div className='mb-3 p-2 bg-green-50 border border-green-200 rounded text-sm'>
                      <div className='flex items-center space-x-1'>
                        <CheckCircle className='w-4 h-4 text-green-600' />
                        <span className='text-green-800'>
                          {productListStatus}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Categories List */}
                <div className='bg-white rounded-lg shadow-sm p-4'>
                  {categories.length > 0 ? (
                    <>
                      <div className='flex items-center justify-between mb-3'>
                        <div className='flex items-center space-x-3'>
                          <h3 className='text-sm font-medium text-gray-900'>
                            Select Categories ({selectedCategories.size}/
                            {categories.length})
                          </h3>
                          <button
                            type='button'
                            onClick={handleSelectAll}
                            className='px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors'
                          >
                            {selectedCategories.size === categories.length
                              ? 'Deselect All'
                              : 'Select All'}
                          </button>
                        </div>

                        {selectedCategories.size > 0 && (
                          <button
                            type='button'
                            onClick={handleBuildProductList}
                            disabled={buildingProductList}
                            className='px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50'
                          >
                            {buildingProductList ? (
                              <RefreshCw className='w-4 h-4 animate-spin' />
                            ) : (
                              <Database className='w-4 h-4' />
                            )}
                            <span>
                              {buildingProductList
                                ? 'Building...'
                                : 'Build Product List'}
                            </span>
                          </button>
                        )}
                      </div>

                      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2'>
                        {categories.map(category => (
                          <div
                            key={category.id}
                            role='button'
                            tabIndex={0}
                            className={`p-3 border rounded cursor-pointer transition-colors ${
                              selectedCategories.has(category.id)
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handleCategorySelect(category.id)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleCategorySelect(category.id);
                              }
                            }}
                          >
                            <div className='flex items-center space-x-2'>
                              <input
                                type='checkbox'
                                checked={selectedCategories.has(category.id)}
                                onChange={() =>
                                  handleCategorySelect(category.id)
                                }
                                className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                              />
                              <div className='flex-1 min-w-0'>
                                <h4 className='text-sm font-medium text-gray-900 truncate'>
                                  {category.name}
                                </h4>
                                <p className='text-xs text-gray-500'>
                                  ID: {category.id}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className='text-center py-8'>
                      <Search className='w-8 h-8 text-gray-400 mx-auto mb-3' />
                      <h3 className='text-sm font-medium text-gray-900 mb-2'>
                        No Categories Loaded
                      </h3>
                      <p className='text-xs text-gray-600 mb-3'>
                        Click &quot;Load&quot; for cached data or
                        &quot;Refresh&quot; to scrape from website.
                      </p>
                    </div>
                  )}
                </div>

                {/* API Information */}
                <div className='bg-gray-50 rounded-lg p-3'>
                  <h3 className='text-sm font-semibold text-gray-900 mb-2'>
                    API Endpoints
                  </h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                    <div>
                      <h4 className='text-xs font-medium text-gray-900 mb-1'>
                        GET /categories/fetch
                      </h4>
                      <p className='text-xs text-gray-600 mb-1'>
                        Fast cached data (instant)
                      </p>
                      <code className='text-xs bg-gray-100 px-1 py-0.5 rounded'>
                        GET /categories/fetch
                      </code>
                    </div>
                    <div>
                      <h4 className='text-xs font-medium text-gray-900 mb-1'>
                        POST /categories/refresh
                      </h4>
                      <p className='text-xs text-gray-600 mb-1'>
                        Live scraping (3-5s)
                      </p>
                      <code className='text-xs bg-gray-100 px-1 py-0.5 rounded'>
                        POST /categories/refresh
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {activeSection === 'preparation' &&
            activeSubSection === 'product-list' && (
              <div className='space-y-6'>
                {/* Product List Header */}
                <div className='bg-white rounded-lg shadow-sm p-4'>
                  <div className='flex items-center justify-between mb-3'>
                    <div className='flex items-center space-x-2'>
                      <Package className='w-4 h-4 text-green-500' />
                      <h3 className='text-lg font-semibold text-gray-900'>
                        Product List
                      </h3>
                      <div className='flex items-center space-x-2 text-sm text-gray-500'>
                        {productCount > 0 && (
                          <span>Total: {productCount} products</span>
                        )}
                        {products.length > 0 && (
                          <span>
                            Showing: {currentPage * pageSize + 1}-
                            {Math.min(
                              (currentPage + 1) * pageSize,
                              productCount
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <button
                        type='button'
                        onClick={testServerConnection}
                        className='px-3 py-1.5 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors flex items-center space-x-1'
                      >
                        <Database className='w-3 h-3' />
                        <span>Test API</span>
                      </button>
                      {productCount > 0 && (
                        <button
                          type='button'
                          onClick={() => {
                            if (
                              window.confirm(
                                `Are you sure you want to clear all ${productCount} products? This action cannot be undone.`
                              )
                            ) {
                              clearAllProducts();
                            }
                          }}
                          className='px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors flex items-center space-x-1'
                        >
                          <XCircle className='w-3 h-3' />
                          <span>Clear All</span>
                        </button>
                      )}
                      {products.length > 0 && (
                        <button
                          type='button'
                          onClick={() => {
                            const csvHeaders = [
                              'ID',
                              'Name',
                              'Code',
                              'URL',
                              'Description',
                              'Price',
                              'List_Price',
                              'Dealer_Price',
                              'Quantity_On_Hand',
                              'In_Stock',
                              'On_PO',
                              'Is_Variation',
                              'Variation_Name',
                              'Parent_Product_URL',
                              'Low_Stock',
                              'In_Stock_Elsewhere',
                              'Uploaded_To_WooCommerce',
                              'Created_At',
                              'Updated_At',
                              'Scraped_At',
                            ];

                            const csvRows = products.map(product =>
                              [
                                product.id || '',
                                product.name || '',
                                product.code || '',
                                product.url || '',
                                product.description || '',
                                product.price || '',
                                product.list_price || '',
                                product.dealer_price || '',
                                product.quantity_on_hand || '',
                                product.in_stock || '',
                                product.on_po || '',
                                product.is_variation || '',
                                product.variation_name || '',
                                product.parent_product_url || '',
                                product.low_stock || '',
                                product.in_stock_elsewhere || '',
                                product.uploaded_to_woocommerce || '',
                                product.created_at || '',
                                product.updated_at || '',
                                product.scraped_at || '',
                              ]
                                .map(field => `"${field}"`)
                                .join(',')
                            );

                            const csvContent = [
                              csvHeaders.map(h => `"${h}"`).join(','),
                              ...csvRows,
                            ].join('\n');

                            const blob = new Blob([csvContent], {
                              type: 'text/csv',
                            });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            window.URL.revokeObjectURL(url);

                            setSuccess(
                              `Downloaded ${products.length} products as CSV`
                            );
                          }}
                          className='px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors flex items-center space-x-1'
                        >
                          <Download className='w-3 h-3' />
                          <span>Download CSV</span>
                        </button>
                      )}
                      <button
                        type='button'
                        onClick={() =>
                          fetchProducts(pageSize, currentPage * pageSize)
                        }
                        disabled={loadingProducts}
                        className='px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors flex items-center space-x-1 disabled:opacity-50'
                      >
                        {loadingProducts ? (
                          <RefreshCw className='w-3 h-3 animate-spin' />
                        ) : (
                          <RefreshCw className='w-3 h-3' />
                        )}
                        <span>Refresh</span>
                      </button>
                    </div>
                  </div>

                  {/* Status Messages */}
                  {productListError && (
                    <div className='mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center space-x-1'>
                          <XCircle className='w-4 h-4 text-red-600' />
                          <span className='text-red-800'>
                            {productListError}
                          </span>
                        </div>
                        <button
                          type='button'
                          onClick={() =>
                            fetchProducts(pageSize, currentPage * pageSize)
                          }
                          className='px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors'
                        >
                          Retry
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Data Quality Warning */}
                  {products.length > 0 &&
                    products.every(
                      p => p.price === null && p.quantity_on_hand === null
                    ) && (
                      <div className='mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm'>
                        <div className='flex items-center space-x-1'>
                          <AlertCircle className='w-4 h-4 text-yellow-600' />
                          <span className='text-yellow-800'>
                            Warning: Products loaded but price/stock data is
                            missing. Scraping jobs may not be complete or need
                            to be re-run.
                          </span>
                        </div>
                      </div>
                    )}

                  {success && (
                    <div className='mb-3 p-2 bg-green-50 border border-green-200 rounded text-sm'>
                      <div className='flex items-center space-x-1'>
                        <CheckCircle className='w-4 h-4 text-green-600' />
                        <span className='text-green-800'>{success}</span>
                      </div>
                    </div>
                  )}

                  {/* Loading State */}
                  {loadingProducts && (
                    <div className='mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center space-x-1'>
                          <RefreshCw className='w-4 h-4 text-blue-600 animate-spin' />
                          <span className='text-blue-800'>
                            Loading products...
                          </span>
                        </div>
                        <div className='text-xs text-blue-600'>
                          This may take a moment if the API server is slow
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Products List */}
                <div className='bg-white rounded-lg shadow-sm p-4'>
                  {products.length > 0 ? (
                    <>
                      <div className='flex items-center justify-between mb-3'>
                        <h3 className='text-sm font-medium text-gray-900'>
                          Scraped Products ({products.length})
                        </h3>
                        <div className='text-sm text-gray-600'>
                          {products.length > 0
                            ? 'Ready for review'
                            : 'No products loaded'}
                        </div>
                      </div>

                      <div className='overflow-x-auto'>
                        <table className='min-w-full divide-y divide-gray-200 border border-gray-300'>
                          <thead className='bg-gray-50'>
                            <tr>
                              <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300'>
                                ID
                              </th>
                              <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300'>
                                Name/Title
                              </th>
                              <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300'>
                                Price Info
                              </th>
                              <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300'>
                                Code
                              </th>
                              <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300'>
                                URL
                              </th>
                              <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300'>
                                Description
                              </th>
                              <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300'>
                                Stock Info
                              </th>
                              <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300'>
                                Variation
                              </th>
                              <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300'>
                                Status
                              </th>
                              <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300'>
                                Created
                              </th>
                              <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className='bg-white divide-y divide-gray-200'>
                            {products.map((product, index) => (
                              <tr
                                key={product.id || index}
                                className='hover:bg-gray-50'
                              >
                                <td className='px-3 py-2 text-xs text-gray-900 border-r border-gray-300'>
                                  {product.id || index + 1}
                                </td>
                                <td className='px-3 py-2 text-xs text-gray-900 border-r border-gray-300 max-w-xs'>
                                  <div
                                    className='truncate'
                                    title={
                                      product.name ||
                                      product.title ||
                                      'Unnamed Product'
                                    }
                                  >
                                    {product.name ||
                                      product.title ||
                                      'Unnamed Product'}
                                  </div>
                                </td>
                                <td className='px-3 py-2 text-xs text-gray-900 border-r border-gray-300'>
                                  <div className='space-y-1'>
                                    {product.price && (
                                      <div className='text-green-600 font-medium'>
                                        Price: {product.price}
                                      </div>
                                    )}
                                    {product.list_price && (
                                      <div className='text-blue-600'>
                                        List: {product.list_price}
                                      </div>
                                    )}
                                    {product.dealer_price && (
                                      <div className='text-purple-600'>
                                        Dealer: {product.dealer_price}
                                      </div>
                                    )}
                                    {!product.price &&
                                      !product.list_price &&
                                      !product.dealer_price && (
                                        <span className='text-gray-500 italic'>
                                          No price data
                                        </span>
                                      )}
                                  </div>
                                </td>
                                <td className='px-3 py-2 text-xs text-gray-900 border-r border-gray-300'>
                                  {product.code || 'N/A'}
                                </td>
                                <td className='px-3 py-2 text-xs border-r border-gray-300'>
                                  {product.url ? (
                                    <a
                                      href={product.url}
                                      target='_blank'
                                      rel='noopener noreferrer'
                                      className='text-blue-600 hover:text-blue-800 underline truncate block max-w-xs'
                                      title={product.url}
                                    >
                                      View →
                                    </a>
                                  ) : (
                                    'N/A'
                                  )}
                                </td>
                                <td className='px-3 py-2 text-xs text-gray-900 border-r border-gray-300 max-w-xs'>
                                  <div
                                    className='truncate'
                                    title={product.description || ''}
                                  >
                                    {product.description || 'N/A'}
                                  </div>
                                </td>
                                <td className='px-3 py-2 text-xs text-gray-900 border-r border-gray-300'>
                                  <div className='space-y-1'>
                                    {product.quantity_on_hand !== null && (
                                      <div className='text-blue-600'>
                                        Qty: {product.quantity_on_hand}
                                      </div>
                                    )}
                                    {product.in_stock !== null && (
                                      <div
                                        className={`font-medium ${product.in_stock ? 'text-green-600' : 'text-red-600'}`}
                                      >
                                        {product.in_stock
                                          ? 'In Stock'
                                          : 'Out of Stock'}
                                      </div>
                                    )}
                                    {product.on_po !== null && (
                                      <div className='text-orange-600'>
                                        PO: {product.on_po}
                                      </div>
                                    )}
                                    {product.quantity_on_hand === null &&
                                      product.in_stock === null &&
                                      product.on_po === null && (
                                        <span className='text-gray-500 italic'>
                                          No stock data
                                        </span>
                                      )}
                                  </div>
                                </td>
                                <td className='px-3 py-2 text-xs text-gray-900 border-r border-gray-300'>
                                  <div className='space-y-1'>
                                    {product.is_variation && (
                                      <div className='text-purple-600 font-medium'>
                                        {product.variation_name || 'Variation'}
                                      </div>
                                    )}
                                    {product.parent_product_url && (
                                      <div className='text-xs text-gray-500'>
                                        <a
                                          href={product.parent_product_url}
                                          target='_blank'
                                          rel='noopener noreferrer'
                                          className='text-blue-600 hover:text-blue-800'
                                        >
                                          Parent →
                                        </a>
                                      </div>
                                    )}
                                    {!product.is_variation && (
                                      <span className='text-gray-500'>
                                        Main Product
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className='px-3 py-2 text-xs text-gray-900 border-r border-gray-300'>
                                  <div className='space-y-1'>
                                    {product.low_stock && (
                                      <div className='text-orange-600 font-medium'>
                                        Low Stock
                                      </div>
                                    )}
                                    {product.in_stock_elsewhere && (
                                      <div className='text-blue-600'>
                                        Available Elsewhere
                                      </div>
                                    )}
                                    {product.uploaded_to_woocommerce && (
                                      <div className='text-green-600'>
                                        WooCommerce
                                      </div>
                                    )}
                                    {!product.low_stock &&
                                      !product.in_stock_elsewhere &&
                                      !product.uploaded_to_woocommerce && (
                                        <span className='text-gray-500'>
                                          Standard
                                        </span>
                                      )}
                                  </div>
                                </td>
                                <td className='px-3 py-2 text-xs text-gray-900 border-r border-gray-300'>
                                  {product.created_at || 'N/A'}
                                </td>
                                <td className='px-3 py-2 text-xs'>
                                  <div className='flex space-x-1'>
                                    {product.url && (
                                      <a
                                        href={product.url}
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        className='text-blue-600 hover:text-blue-800'
                                        title='View Product'
                                      >
                                        <Eye className='w-3 h-3' />
                                      </a>
                                    )}
                                    <button
                                      type='button'
                                      onClick={() => {
                                        const csvRow = [
                                          product.id || '',
                                          product.name || '',
                                          product.code || '',
                                          product.url || '',
                                          product.description || '',
                                          product.price || '',
                                          product.list_price || '',
                                          product.dealer_price || '',
                                          product.quantity_on_hand || '',
                                          product.in_stock || '',
                                          product.on_po || '',
                                          product.is_variation || '',
                                          product.variation_name || '',
                                          product.parent_product_url || '',
                                          product.low_stock || '',
                                          product.in_stock_elsewhere || '',
                                          product.uploaded_to_woocommerce || '',
                                          product.created_at || '',
                                          product.updated_at || '',
                                          product.scraped_at || '',
                                        ]
                                          .map(field => `"${field}"`)
                                          .join(',');
                                        navigator.clipboard.writeText(csvRow);
                                        setSuccess('Row copied to clipboard!');
                                      }}
                                      className='text-gray-600 hover:text-gray-800'
                                      title='Copy CSV Row'
                                    >
                                      <Database className='w-3 h-3' />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Controls */}
                      {productCount > pageSize && (
                        <div className='mt-4 flex items-center justify-between'>
                          <div className='flex items-center space-x-2'>
                            <button
                              type='button'
                              onClick={() => {
                                const newPage = Math.max(0, currentPage - 1);
                                setCurrentPage(newPage);
                                fetchProducts(pageSize, newPage * pageSize);
                              }}
                              disabled={currentPage === 0}
                              className='px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                              Previous
                            </button>
                            <span className='text-sm text-gray-600'>
                              Page {currentPage + 1} of{' '}
                              {Math.ceil(productCount / pageSize)}
                            </span>
                            <button
                              type='button'
                              onClick={() => {
                                const newPage = Math.min(
                                  Math.ceil(productCount / pageSize) - 1,
                                  currentPage + 1
                                );
                                setCurrentPage(newPage);
                                fetchProducts(pageSize, newPage * pageSize);
                              }}
                              disabled={
                                currentPage >=
                                Math.ceil(productCount / pageSize) - 1
                              }
                              className='px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                              Next
                            </button>
                          </div>
                          <div className='text-sm text-gray-500'>
                            {pageSize} products per page
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className='text-center py-8'>
                      <Package className='w-8 h-8 text-gray-400 mx-auto mb-3' />
                      <h3 className='text-sm font-medium text-gray-900 mb-2'>
                        No Products Found
                      </h3>
                      <p className='text-xs text-gray-600 mb-3'>
                        Click &quot;Refresh&quot; to load products or start a
                        scraping job first.
                      </p>
                      <button
                        type='button'
                        onClick={() => fetchProducts(pageSize, 0)}
                        className='px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors'
                      >
                        Load Products
                      </button>
                    </div>
                  )}
                </div>

                {/* Server Status */}
                <div className='bg-green-50 border border-green-200 rounded-lg p-3 mb-4'>
                  <div className='flex items-center space-x-2'>
                    <div className='w-2 h-2 bg-green-500 rounded-full' />
                    <span className='text-sm font-medium text-green-800'>
                      API Server Status
                    </span>
                  </div>
                  <p className='text-xs text-green-700 mt-1'>
                    ✅ API server at http://10.100.7.1:8000 is online and
                    responding.
                  </p>
                  <div className='mt-2 text-xs text-green-600'>
                    <strong>Database:</strong> Currently has 0 products (ready
                    for scraping).
                  </div>
                </div>

                {/* API Information */}
                <div className='bg-gray-50 rounded-lg p-3'>
                  <h3 className='text-sm font-semibold text-gray-900 mb-2'>
                    Product API
                  </h3>
                  <div className='grid grid-cols-1 gap-3'>
                    <div>
                      <h4 className='text-xs font-medium text-gray-900 mb-1'>
                        GET /products
                      </h4>
                      <p className='text-xs text-gray-600 mb-1'>
                        Fetch products with pagination
                      </p>
                      <code className='text-xs bg-gray-100 px-1 py-0.5 rounded'>
                        GET /products?limit=50&offset=0
                      </code>
                    </div>
                    <div>
                      <h4 className='text-xs font-medium text-gray-900 mb-1'>
                        GET /products/count
                      </h4>
                      <p className='text-xs text-gray-600 mb-1'>
                        Get total product count
                      </p>
                      <code className='text-xs bg-gray-100 px-1 py-0.5 rounded'>
                        GET /products/count
                      </code>
                    </div>
                    <div>
                      <h4 className='text-xs font-medium text-gray-900 mb-1'>
                        DELETE /products
                      </h4>
                      <p className='text-xs text-gray-600 mb-1'>
                        Clear all products from database
                      </p>
                      <code className='text-xs bg-gray-100 px-1 py-0.5 rounded'>
                        DELETE /products
                      </code>
                    </div>
                    <div>
                      <h4 className='text-xs font-medium text-gray-900 mb-1'>
                        POST /scrape
                      </h4>
                      <p className='text-xs text-gray-600 mb-1'>
                        Start scraping with price/stock data
                      </p>
                      <code className='text-xs bg-gray-100 px-1 py-0.5 rounded'>
                        POST /scrape (scrape_variations: true)
                      </code>
                    </div>
                    <div>
                      <h4 className='text-xs font-medium text-gray-900 mb-1'>
                        GET /scraping-jobs
                      </h4>
                      <p className='text-xs text-gray-600 mb-1'>
                        Monitor scraping job status
                      </p>
                      <code className='text-xs bg-gray-100 px-1 py-0.5 rounded'>
                        GET /scraping-jobs
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {activeSection === 'preparation' && activeSubSection === 'jobs' && (
            <div className='bg-white rounded-lg shadow-sm p-6'>
              {/* Header with controls */}
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-semibold text-gray-900'>
                  Scraping Jobs ({scrapingJobs.length})
                </h3>
                <div className='flex items-center space-x-2'>
                  <label
                    htmlFor='auto-refresh-jobs'
                    className='flex items-center space-x-2 text-sm text-gray-600'
                  >
                    <input
                      id='auto-refresh-jobs'
                      type='checkbox'
                      checked={autoRefreshJobs}
                      onChange={e => setAutoRefreshJobs(e.target.checked)}
                      className='rounded border-gray-300'
                    />
                    <span>Auto-refresh (5s)</span>
                  </label>
                  <button
                    type='button'
                    onClick={fetchScrapingJobs}
                    disabled={loadingJobs}
                    className='px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-1'
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${loadingJobs ? 'animate-spin' : ''}`}
                    />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* Filter tabs */}
              <div className='flex items-center space-x-2 mb-4 border-b'>
                {['all', 'running', 'completed', 'failed', 'cancelled'].map(
                  filter => {
                    const count =
                      filter === 'all'
                        ? scrapingJobs.length
                        : scrapingJobs.filter(j => j.status === filter).length;
                    return (
                      <button
                        key={filter}
                        type='button'
                        onClick={() => setJobsFilter(filter)}
                        className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                          jobsFilter === filter
                            ? 'border-b-2 border-blue-500 text-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {filter} ({count})
                      </button>
                    );
                  }
                )}
              </div>

              {/* Status Messages */}
              {error && (
                <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm'>
                  <div className='flex items-center space-x-1'>
                    <XCircle className='w-4 h-4 text-red-600' />
                    <span className='text-red-800'>{error}</span>
                  </div>
                </div>
              )}

              {success && (
                <div className='mb-4 p-3 bg-green-50 border border-green-200 rounded text-sm'>
                  <div className='flex items-center space-x-1'>
                    <CheckCircle className='w-4 h-4 text-green-600' />
                    <span className='text-green-800'>{success}</span>
                  </div>
                </div>
              )}

              {/* Jobs List */}
              {(() => {
                const filteredJobs =
                  jobsFilter === 'all'
                    ? scrapingJobs
                    : scrapingJobs.filter(j => j.status === jobsFilter);

                const sortedJobs = [...filteredJobs].sort(
                  (a, b) => b.id - a.id
                );

                if (loadingJobs && scrapingJobs.length === 0) {
                  return (
                    <div className='text-center py-8'>
                      <RefreshCw className='w-8 h-8 text-gray-400 mx-auto mb-2 animate-spin' />
                      <p className='text-gray-500'>Loading jobs...</p>
                    </div>
                  );
                }

                if (sortedJobs.length === 0) {
                  return (
                    <div className='text-center py-8'>
                      <Clock className='w-12 h-12 text-gray-400 mx-auto mb-3' />
                      <p className='text-gray-500'>
                        No {jobsFilter === 'all' ? '' : jobsFilter} jobs found
                      </p>
                      <p className='text-sm text-gray-400 mt-1'>
                        {jobsFilter === 'running' &&
                          'Start a scraping job from the Category tab'}
                        {jobsFilter !== 'running' &&
                          jobsFilter !== 'all' &&
                          'No jobs with this status'}
                      </p>
                    </div>
                  );
                }

                return (
                  <div className='space-y-4'>
                    {sortedJobs.map(job => {
                      const getStatusColor = () => {
                        if (job.status === 'completed')
                          return 'bg-green-100 text-green-800';
                        if (job.status === 'running')
                          return 'bg-blue-100 text-blue-800';
                        if (job.status === 'failed')
                          return 'bg-red-100 text-red-800';
                        if (job.status === 'cancelled')
                          return 'bg-gray-100 text-gray-800';
                        return 'bg-gray-100 text-gray-800';
                      };

                      const getRelativeTime = timestamp => {
                        if (!timestamp) return 'N/A';

                        // Ensure we have a valid timestamp
                        const date = new Date(timestamp);
                        if (Number.isNaN(date.getTime())) return 'Invalid date';

                        const now = new Date();
                        const diff = now - date;

                        // Handle negative differences (future dates)
                        if (diff < 0) return 'In the future';

                        const minutes = Math.floor(diff / 60000);
                        const hours = Math.floor(minutes / 60);
                        const days = Math.floor(hours / 24);

                        if (days > 0) return `${days}d ago`;
                        if (hours > 0) return `${hours}h ago`;
                        if (minutes > 0) return `${minutes}m ago`;
                        return 'Just now';
                      };

                      const getDuration = () => {
                        if (!job.started_at || !job.completed_at) return null;
                        const start = new Date(job.started_at);
                        const end = new Date(job.completed_at);
                        const diff = end - start;
                        const minutes = Math.floor(diff / 60000);
                        const seconds = Math.floor((diff % 60000) / 1000);
                        return `${minutes}m ${seconds}s`;
                      };

                      return (
                        <div
                          key={job.id}
                          className='border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow'
                        >
                          <div className='flex items-center justify-between mb-3'>
                            <div className='flex items-center space-x-3'>
                              <span className='font-medium text-gray-900'>
                                Job #{job.id}
                              </span>
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${getStatusColor()}`}
                              >
                                {job.status}
                              </span>
                              <span className='text-xs text-gray-500 font-mono'>
                                {job.run_id}
                              </span>
                            </div>
                            <div className='flex items-center space-x-2'>
                              <span className='text-sm text-gray-500'>
                                {getRelativeTime(job.started_at)}
                              </span>
                              {job.status === 'running' && (
                                <button
                                  type='button'
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        `Are you sure you want to cancel job #${job.id}? This action cannot be undone.`
                                      )
                                    ) {
                                      cancelJob(job.run_id);
                                    }
                                  }}
                                  disabled={cancellingJobId === job.run_id}
                                  className='px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50 flex items-center space-x-1'
                                >
                                  {cancellingJobId === job.run_id ? (
                                    <>
                                      <RefreshCw className='w-3 h-3 animate-spin' />
                                      <span>Cancelling...</span>
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className='w-3 h-3' />
                                      <span>Cancel</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>

                          <div className='grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3'>
                            <div>
                              <span className='font-medium'>Category:</span>
                              <div
                                className='text-xs text-blue-600 truncate max-w-xs mt-1'
                                title={job.category_url}
                              >
                                {job.category_url}
                              </div>
                            </div>
                            <div>
                              <span className='font-medium'>Config:</span>
                              <div className='text-xs mt-1'>
                                Max Pages: {job.max_pages} | Variations:{' '}
                                {job.scrape_variations ? 'Yes' : 'No'}
                              </div>
                            </div>
                          </div>

                          {/* Progress Stats */}
                          <div className='grid grid-cols-3 gap-4 text-sm mb-3'>
                            <div className='bg-gray-50 rounded p-2'>
                              <div className='font-medium text-gray-900'>
                                {job.products_checked || 0}
                              </div>
                              <div className='text-xs text-gray-600'>
                                Checked
                              </div>
                            </div>
                            <div className='bg-green-50 rounded p-2'>
                              <div className='font-medium text-green-900'>
                                {job.products_new || 0}
                              </div>
                              <div className='text-xs text-green-600'>New</div>
                            </div>
                            <div className='bg-blue-50 rounded p-2'>
                              <div className='font-medium text-blue-900'>
                                {job.products_changed || 0}
                              </div>
                              <div className='text-xs text-blue-600'>
                                Updated
                              </div>
                            </div>
                          </div>

                          {/* Message */}
                          {job.message && (
                            <div className='mb-2 p-2 bg-blue-50 rounded text-xs text-blue-800'>
                              {job.message}
                            </div>
                          )}

                          {/* Error Message */}
                          {job.error_message && (
                            <div className='mb-2 p-2 bg-red-50 border border-red-200 rounded text-xs'>
                              <span className='font-medium text-red-800'>
                                Error:
                              </span>
                              <span className='text-red-700 ml-1'>
                                {job.error_message}
                              </span>
                            </div>
                          )}

                          {/* Timing Info */}
                          <div className='flex items-center justify-between text-xs text-gray-500 pt-2 border-t'>
                            <div>
                              Started:{' '}
                              {job.started_at
                                ? new Date(job.started_at).toLocaleString()
                                : 'N/A'}
                            </div>
                            {job.completed_at && (
                              <div>
                                Completed:{' '}
                                {new Date(job.completed_at).toLocaleString()} (
                                {getDuration()})
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {activeSection === 'scraping' &&
            activeSubSection === 'active-jobs' && (
              <div className='bg-white rounded-lg shadow-sm p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-semibold text-gray-900'>
                    Scraping Jobs ({scrapingJobs.length})
                  </h3>
                  <button
                    type='button'
                    onClick={fetchScrapingJobs}
                    disabled={loadingJobs}
                    className='px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1'
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${loadingJobs ? 'animate-spin' : ''}`}
                    />
                    <span>{loadingJobs ? 'Loading...' : 'Refresh'}</span>
                  </button>
                </div>

                {/* Status Messages */}
                {error && (
                  <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm'>
                    <div className='flex items-center space-x-1'>
                      <XCircle className='w-4 h-4 text-red-600' />
                      <span className='text-red-800'>{error}</span>
                    </div>
                  </div>
                )}

                {success && (
                  <div className='mb-4 p-3 bg-green-50 border border-green-200 rounded text-sm'>
                    <div className='flex items-center space-x-1'>
                      <CheckCircle className='w-4 h-4 text-green-600' />
                      <span className='text-green-800'>{success}</span>
                    </div>
                  </div>
                )}

                {/* Jobs List */}
                {scrapingJobs.length === 0 ? (
                  <div className='text-center py-8'>
                    <Database className='w-12 h-12 text-gray-400 mx-auto mb-3' />
                    <p className='text-gray-500'>No scraping jobs found</p>
                    <p className='text-sm text-gray-400 mt-1'>
                      Start a scraping job from the Preparation section
                    </p>
                  </div>
                ) : (
                  <div className='space-y-4'>
                    {scrapingJobs.map(job => (
                      <div
                        key={job.id}
                        className='border border-gray-200 rounded-lg p-4'
                      >
                        <div className='flex items-center justify-between mb-3'>
                          <div className='flex items-center space-x-3'>
                            <span className='font-medium text-gray-900'>
                              Job #{job.id}
                            </span>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${(() => {
                                if (job.status === 'completed')
                                  return 'bg-green-100 text-green-800';
                                if (job.status === 'running')
                                  return 'bg-blue-100 text-blue-800';
                                if (job.status === 'failed')
                                  return 'bg-red-100 text-red-800';
                                return 'bg-gray-100 text-gray-800';
                              })()}`}
                            >
                              {job.status}
                            </span>
                            <span className='text-xs text-gray-500'>
                              {job.run_id}
                            </span>
                          </div>
                          <div className='text-sm text-gray-500'>
                            {job.started_at
                              ? new Date(job.started_at).toLocaleString()
                              : 'Not started'}
                          </div>
                        </div>

                        <div className='grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3'>
                          <div>
                            <span className='font-medium'>Category URL:</span>
                            <div
                              className='text-xs text-blue-600 truncate max-w-xs'
                              title={job.category_url}
                            >
                              {job.category_url}
                            </div>
                          </div>
                          <div>
                            <span className='font-medium'>Max Pages:</span>{' '}
                            {job.max_pages}
                          </div>
                          <div>
                            <span className='font-medium'>
                              Scrape Variations:
                            </span>
                            <span
                              className={`ml-1 ${job.scrape_variations ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {job.scrape_variations ? 'Yes' : 'No'}
                            </span>
                          </div>
                          <div>
                            <span className='font-medium'>Run Type:</span>{' '}
                            {job.run_type}
                          </div>
                        </div>

                        {/* Progress Stats */}
                        <div className='grid grid-cols-3 gap-4 text-sm'>
                          <div className='bg-gray-50 rounded p-2'>
                            <div className='font-medium text-gray-900'>
                              {job.products_checked || 0}
                            </div>
                            <div className='text-xs text-gray-600'>
                              Products Checked
                            </div>
                          </div>
                          <div className='bg-green-50 rounded p-2'>
                            <div className='font-medium text-green-900'>
                              {job.products_new || 0}
                            </div>
                            <div className='text-xs text-green-600'>
                              New Products
                            </div>
                          </div>
                          <div className='bg-blue-50 rounded p-2'>
                            <div className='font-medium text-blue-900'>
                              {job.products_changed || 0}
                            </div>
                            <div className='text-xs text-blue-600'>
                              Updated Products
                            </div>
                          </div>
                        </div>

                        {/* Error Message */}
                        {job.error_message && (
                          <div className='mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs'>
                            <span className='font-medium text-red-800'>
                              Error:
                            </span>
                            <span className='text-red-700 ml-1'>
                              {job.error_message}
                            </span>
                          </div>
                        )}

                        {/* Completion Time */}
                        {job.completed_at && (
                          <div className='mt-2 text-xs text-gray-500'>
                            Completed:{' '}
                            {new Date(job.completed_at).toLocaleString()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          {activeSection === 'products' && (
            <div className='bg-white rounded-lg shadow-sm p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Products
              </h3>
              <p className='text-gray-600'>Products content will go here...</p>
            </div>
          )}

          {activeSection === 'categories' && (
            <div className='bg-white rounded-lg shadow-sm p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Categories
              </h3>
              <p className='text-gray-600'>
                Categories content will go here...
              </p>
            </div>
          )}

          {activeSection === 'analytics' && (
            <div className='space-y-6'>
              {/* Analytics Overview Cards */}
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                <div className='bg-white rounded-lg shadow-sm p-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm font-medium text-gray-600'>
                        Total Jobs
                      </p>
                      <p className='text-2xl font-bold text-gray-900'>1,247</p>
                    </div>
                    <div className='p-3 bg-blue-100 rounded-full'>
                      <Activity className='w-6 h-6 text-blue-600' />
                    </div>
                  </div>
                  <div className='mt-4 flex items-center text-sm text-green-600'>
                    <TrendingUp className='w-4 h-4 mr-1' />
                    <span>+12% from last month</span>
                  </div>
                </div>

                <div className='bg-white rounded-lg shadow-sm p-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm font-medium text-gray-600'>
                        Success Rate
                      </p>
                      <p className='text-2xl font-bold text-gray-900'>94.2%</p>
                    </div>
                    <div className='p-3 bg-green-100 rounded-full'>
                      <CheckCircle className='w-6 h-6 text-green-600' />
                    </div>
                  </div>
                  <div className='mt-4 flex items-center text-sm text-green-600'>
                    <TrendingUp className='w-4 h-4 mr-1' />
                    <span>+2.1% from last month</span>
                  </div>
                </div>

                <div className='bg-white rounded-lg shadow-sm p-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm font-medium text-gray-600'>
                        Products Scraped
                      </p>
                      <p className='text-2xl font-bold text-gray-900'>45,678</p>
                    </div>
                    <div className='p-3 bg-purple-100 rounded-full'>
                      <Database className='w-6 h-6 text-purple-600' />
                    </div>
                  </div>
                  <div className='mt-4 flex items-center text-sm text-green-600'>
                    <TrendingUp className='w-4 h-4 mr-1' />
                    <span>+8.5% from last month</span>
                  </div>
                </div>

                <div className='bg-white rounded-lg shadow-sm p-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm font-medium text-gray-600'>
                        Active Jobs
                      </p>
                      <p className='text-2xl font-bold text-gray-900'>4</p>
                    </div>
                    <div className='p-3 bg-orange-100 rounded-full'>
                      <Clock className='w-6 h-6 text-orange-600' />
                    </div>
                  </div>
                  <div className='mt-4 flex items-center text-sm text-gray-600'>
                    <Eye className='w-4 h-4 mr-1' />
                    <span>Currently running</span>
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                {/* Jobs Over Time Chart */}
                <div className='bg-white rounded-lg shadow-sm p-6'>
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-lg font-semibold text-gray-900'>
                      Jobs Over Time
                    </h3>
                    <button
                      type='button'
                      className='flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800'
                    >
                      <Download className='w-4 h-4' />
                      <span>Export</span>
                    </button>
                  </div>
                  <div className='h-64 bg-gray-50 rounded-lg flex items-center justify-center'>
                    <div className='text-center'>
                      <BarChart3 className='w-12 h-12 text-gray-400 mx-auto mb-2' />
                      <p className='text-gray-500'>
                        Chart visualization would go here
                      </p>
                      <p className='text-sm text-gray-400'>
                        Last 30 days: 156 jobs
                      </p>
                    </div>
                  </div>
                </div>

                {/* Category Performance */}
                <div className='bg-white rounded-lg shadow-sm p-6'>
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-lg font-semibold text-gray-900'>
                      Category Performance
                    </h3>
                    <button
                      type='button'
                      className='flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800'
                    >
                      <RefreshCw className='w-4 h-4' />
                      <span>Refresh</span>
                    </button>
                  </div>
                  <div className='space-y-4'>
                    {[
                      {
                        name: 'Chain Lifting',
                        jobs: 45,
                        success: 98,
                        color: 'bg-blue-500',
                      },
                      {
                        name: 'Material Handling',
                        jobs: 38,
                        success: 95,
                        color: 'bg-green-500',
                      },
                      {
                        name: 'Load Restraint',
                        jobs: 32,
                        success: 92,
                        color: 'bg-purple-500',
                      },
                      {
                        name: 'Wire Rope',
                        jobs: 28,
                        success: 89,
                        color: 'bg-orange-500',
                      },
                      {
                        name: 'Eye Bolts',
                        jobs: 25,
                        success: 96,
                        color: 'bg-pink-500',
                      },
                    ].map(category => (
                      <div
                        key={category.name}
                        className='flex items-center justify-between'
                      >
                        <div className='flex items-center space-x-3'>
                          <div
                            className={`w-3 h-3 rounded-full ${category.color}`}
                          />
                          <span className='text-sm font-medium text-gray-900'>
                            {category.name}
                          </span>
                        </div>
                        <div className='flex items-center space-x-4 text-sm text-gray-600'>
                          <span>{category.jobs} jobs</span>
                          <span className='text-green-600'>
                            {category.success}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className='bg-white rounded-lg shadow-sm p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-semibold text-gray-900'>
                    Recent Activity
                  </h3>
                  <button
                    type='button'
                    className='text-sm text-blue-600 hover:text-blue-800'
                  >
                    View All
                  </button>
                </div>
                <div className='space-y-4'>
                  {[
                    {
                      type: 'success',
                      message: 'Job #60 completed successfully',
                      time: '2 minutes ago',
                      icon: CheckCircle,
                      color: 'text-green-600',
                    },
                    {
                      type: 'running',
                      message: 'Job #55 started scraping Chain Lifting',
                      time: '5 minutes ago',
                      icon: Activity,
                      color: 'text-blue-600',
                    },
                    {
                      type: 'error',
                      message: 'Job #49 failed - Connection timeout',
                      time: '12 minutes ago',
                      icon: XCircle,
                      color: 'text-red-600',
                    },
                    {
                      type: 'warning',
                      message: 'Job #48 completed with warnings',
                      time: '18 minutes ago',
                      icon: AlertCircle,
                      color: 'text-yellow-600',
                    },
                  ].map(activity => (
                    <div
                      key={activity.message}
                      className='flex items-center space-x-3 p-3 bg-gray-50 rounded-lg'
                    >
                      <activity.icon className={`w-5 h-5 ${activity.color}`} />
                      <div className='flex-1'>
                        <p className='text-sm font-medium text-gray-900'>
                          {activity.message}
                        </p>
                        <p className='text-xs text-gray-500'>{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'settings' && (
            <div className='bg-white rounded-lg shadow-sm p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Settings
              </h3>
              <p className='text-gray-600'>Settings content will go here...</p>
            </div>
          )}
        </div>
      </div>

      {/* Product Info Popup */}
      {showProductPopup && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] flex flex-col'>
            {/* Popup Header */}
            <div className='flex items-center justify-between p-6 border-b border-gray-200'>
              <h3 className='text-xl font-semibold text-gray-900'>
                {popupTitle}
              </h3>
              <button
                type='button'
                onClick={() => setShowProductPopup(false)}
                className='text-gray-400 hover:text-gray-600 transition-colors'
              >
                <XCircle className='w-6 h-6' />
              </button>
            </div>

            {/* Popup Content */}
            <div className='flex-1 overflow-auto p-6'>
              {popupProducts.length > 0 ? (
                <div className='overflow-x-auto'>
                  <table className='min-w-full divide-y divide-gray-200'>
                    <thead className='bg-gray-50'>
                      <tr>
                        {Object.keys(popupProducts[0]).map((field) => (
                          <th
                            key={field}
                            className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                          >
                            {field.replace(/_/g, ' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className='bg-white divide-y divide-gray-200'>
                      {popupProducts.map((product, index) => (
                        <tr key={product.id || index} className='hover:bg-gray-50'>
                          {Object.values(product).map((value, valueIndex) => (
                            <td
                              key={valueIndex}
                              className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate'
                              title={String(value)}
                            >
                              {value === null || value === undefined
                                ? '-'
                                : String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className='text-center py-8'>
                  <Package className='w-12 h-12 text-gray-400 mx-auto mb-3' />
                  <p className='text-gray-500'>No products found</p>
                </div>
              )}
            </div>

            {/* Popup Footer */}
            <div className='flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50'>
              <div className='text-sm text-gray-600'>
                Showing {popupProducts.length} products
              </div>
              <div className='flex space-x-3'>
                <button
                  type='button'
                  onClick={() => {
                    const csvContent = [
                      Object.keys(popupProducts[0] || {}).join(','),
                      ...popupProducts.map(product =>
                        Object.values(product).map(value =>
                          String(value || '').includes(',') || String(value || '').includes('"')
                            ? `"${String(value || '').replace(/"/g, '""')}"`
                            : String(value || '')
                        ).join(',')
                      )
                    ].join('\n');
                    
                    const blob = new Blob([csvContent], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2'
                  disabled={popupProducts.length === 0}
                >
                  <Download className='w-4 h-4' />
                  <span>Export CSV</span>
                </button>
                <button
                  type='button'
                  onClick={() => setShowProductPopup(false)}
                  className='px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors'
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AustliftScraperDashboard;
