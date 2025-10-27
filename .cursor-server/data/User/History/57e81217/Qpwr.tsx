import React from 'react';
import AustliftScraperDashboard from './components/AustliftScraperDashboard';

/**
 * Main App component
 * @returns {React.JSX.Element} JSX element containing the Austlift Scraper Dashboard
 */
const App: React.FC = () => (
  <div className='App'>
    <AustliftScraperDashboard />
  </div>
);

export default App;
