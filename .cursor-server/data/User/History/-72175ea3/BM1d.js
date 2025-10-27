import React, { useState, useCallback } from 'react';
import { Home, XCircle } from 'lucide-react';

const AustliftScraperDashboard = () => {
  const [activeSection, setActiveSection] = useState('home');
  const [categories, setCategories] = useState([]);
  const [selectedCategories] = useState(new Set());
  const [step1Status, setStep1Status] = useState('');
  const [step2Status, setStep2Status] = useState('');
  const [step3Status, setStep3Status] = useState('');
  const [step4Status, setStep4Status] = useState('');
  const [showStep4Dropdown, setShowStep4Dropdown] = useState(false);
  const [step4Products, setStep4Products] = useState([]);
  const [isTableMinimized, setIsTableMinimized] = useState(false);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/categories/fetch');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (err) {
      // Error handled silently
    }
  }, []);

  // Refresh categories
  const refreshCategories = useCallback(async () => {
    try {
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
      // Error handled silently
    }
  }, []);

  // Handle Step 1 - Review Categories
  const handleStep1 = async () => {
    setStep1Status('Fetching categories...');
    await fetchCategories();
    setStep1Status('Refreshing categories...');
    await refreshCategories();
    setStep1Status('✅ Step 1 Complete! Categories loaded successfully');
  };

  // Handle Step 2 - Start Scraping
  const handleStep2 = async () => {
    setStep2Status('Initializing Step 1...');
    await handleStep1();

    setStep2Status('Selecting all categories...');
    const allCategoryIds = categories.map(cat => cat.id);
    allCategoryIds.forEach(id => selectedCategories.add(id));

    setStep2Status('Starting scraping...');
    try {
      const response = await fetch('/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_url: categories[0]?.url,
          max_pages: 1,
          scrape_variations: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setStep2Status(
        `✅ Complete! Steps 1 & 2 finished successfully! Job ID: ${data.job_id}`
      );
    } catch (err) {
      setStep2Status(`❌ Error: ${err.message}`);
    }
  };

  // Handle Step 3 - Review Products
  const handleStep3 = async () => {
    setStep3Status('Initializing previous steps...');
    await handleStep2();

    setStep3Status('Loading products...');
    try {
      const response = await fetch('/products?limit=10&offset=0');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setStep3Status(`✅ Complete! Loaded ${data.total || 0} products`);
    } catch (err) {
      setStep3Status(`❌ Error loading products: ${err.message}`);
    }
  };

  // Handle Step 4 - Show Products Table
  const handleStep4 = async () => {
    setStep4Status('Initializing previous steps...');
    await handleStep3();

    setStep4Status('Loading ALL products for table display...');
    try {
      const response = await fetch('/products?limit=10000&offset=0');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();

      if (!data.products || data.products.length === 0) {
        setStep4Products([]);
        setStep4Status('⚠️ No products available for display');
        return;
      }

      setStep4Products(data.products);
      setStep4Status(
        `✅ ALL products loaded! Showing ${data.products.length} products`
      );
      setShowStep4Dropdown(true);
      setIsTableMinimized(false);
    } catch (err) {
      setStep4Status(`❌ Error loading products: ${err.message}`);
      setStep4Products([]);
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
                        {step1Status && (
                          <p className='text-sm text-blue-600'>{step1Status}</p>
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
                          Start scraping all products from selected categories
                        </p>
                        {step2Status && (
                          <p className='text-sm text-green-600'>
                            {step2Status}
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
                        {step3Status && (
                          <p className='text-sm text-purple-600'>
                            {step3Status}
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
                        {step4Status && (
                          <p className='text-sm text-orange-600'>
                            {step4Status}
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
                              key={product.id || index}
                              className='hover:bg-gray-50'
                            >
                              {Object.values(product).map(
                                (value, valueIndex) => (
                                  <td
                                    key={`${product.id || index}-${valueIndex}`}
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
                        Table minimized - Click &quot;Expand&quot; to view products
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
