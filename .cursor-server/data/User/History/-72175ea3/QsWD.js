import React, { useState, useEffect, useCallback } from 'react';
import {
  Home,
  Search,
  Activity,
  Eye,
  Clock,
  Package,
  List,
  XCircle,
  Download,
} from 'lucide-react';

const AustliftScraperDashboard = () => {
  const [activeSection, setActiveSection] = useState('home');
  const [activeSubSection, setActiveSubSection] = useState('overview');

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Sidebar */}
      <div className='w-64 bg-white shadow-lg'>
        <div className='p-6'>
          <h1 className='text-xl font-bold text-gray-900'>Austlift Scraper</h1>
        </div>

        <nav className='mt-6'>
          <div className='px-3 space-y-1'>
            <button
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
                  <div className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'>
                    <div className='flex items-center space-x-3'>
                      <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
                        <span className='text-blue-600 font-semibold'>1</span>
                      </div>
                      <div>
                        <h4 className='font-medium text-gray-900'>Review Category List</h4>
                        <p className='text-sm text-gray-600'>Fetch and review all available product categories</p>
                      </div>
                    </div>
                    <button className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'>
                      Start Review
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AustliftScraperDashboard;
