// Simple test script to verify API connectivity
const API_BASE_URL = 'http://10.100.7.1:8000';

async function testAPI() {
  console.log('Testing Austlift Scraper API...');
  
  try {
    // Test categories endpoint
    console.log('Fetching categories...');
    const categoriesResponse = await fetch(`${API_BASE_URL}/categories`);
    
    if (categoriesResponse.ok) {
      const categories = await categoriesResponse.json();
      console.log('✅ Categories endpoint working');
      console.log('Available categories:', Object.keys(categories).length);
      console.log('Sample categories:', Object.keys(categories).slice(0, 3));
    } else {
      console.log('❌ Categories endpoint failed:', categoriesResponse.status);
    }
    
    // Test jobs endpoint
    console.log('\nFetching jobs...');
    const jobsResponse = await fetch(`${API_BASE_URL}/scraping-jobs?limit=5`);
    
    if (jobsResponse.ok) {
      const jobs = await jobsResponse.json();
      console.log('✅ Jobs endpoint working');
      console.log('Total jobs:', jobs.jobs?.length || 0);
      if (jobs.jobs?.length > 0) {
        console.log('Sample job:', {
          id: jobs.jobs[0].id,
          status: jobs.jobs[0].status,
          category: jobs.jobs[0].category_url
        });
      }
    } else {
      console.log('❌ Jobs endpoint failed:', jobsResponse.status);
    }
    
  } catch (error) {
    console.log('❌ API connection failed:', error.message);
    console.log('Make sure the Austlift scraper API is running at', API_BASE_URL);
  }
}

testAPI();


