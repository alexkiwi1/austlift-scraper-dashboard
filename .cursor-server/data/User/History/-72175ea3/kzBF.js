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
              <h2 className='text-2xl font-bold text-gray-900'>Home Dashboard</h2>
              <div className='bg-white rounded-lg shadow-sm p-6'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                  Welcome to Austlift Scraper Dashboard
                </h3>
                <p className='text-gray-600'>
                  This is a minimal version to test the basic JSX structure.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AustliftScraperDashboard;