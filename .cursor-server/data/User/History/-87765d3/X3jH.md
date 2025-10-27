# Austlift Scraper Dashboard

A React-based web scraping dashboard for monitoring and controlling Austlift product scraper jobs.

## Features

- **Real-time Job Monitoring**: Live updates every 3 seconds
- **Category Selection**: Visual grid of available categories
- **Configuration Panel**: Mode selection, page limits, and options
- **Status Tracking**: Color-coded job status with progress messages
- **Connection Monitoring**: API health indicator

## Quick Start

### Using Docker Compose (Recommended)

```bash
# Build and start the application
docker-compose up --build

# Access the dashboard at http://localhost:3000
```

### Manual Docker Build

```bash
# Build the Docker image
docker build -t austlift-scraper-dashboard .

# Run the container
docker run -p 3000:3000 -e REACT_APP_API_BASE_URL=http://10.100.7.1:8000 austlift-scraper-dashboard
```

## Configuration

The dashboard connects to the Austlift scraper API at `http://10.100.7.1:8000` by default. You can change this by setting the `REACT_APP_API_BASE_URL` environment variable.

## API Endpoints Used

- `GET /categories` - Fetch available categories
- `POST /scrape/list-only` - Start fast scraping job
- `POST /scrape` - Start full scraping job  
- `GET /scraping-jobs?limit=20` - Get job status and progress

## Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## Features Overview

### Dashboard Sections

1. **Header**: Title, subtitle, and connection status
2. **Left Panel**: Category selection and configuration
3. **Right Panel**: Active and recent jobs monitoring

### Job Status Types

- **Running**: Blue badge with spinning loader
- **Completed**: Green badge with checkmark
- **Failed**: Red badge with X icon
- **Queued**: Yellow badge with clock icon

### Configuration Options

- **Mode**: List Only (fast) vs Full Details
- **Max Pages**: Slider from 1-100 pages
- **Scrape Variations**: Checkbox for product variations
- **Authentication**: Always enabled (use_auth: true)

## Real-time Updates

The dashboard automatically polls the API every 3 seconds to show:
- Live progress messages
- Updated job counters
- Status changes
- New job appearances

## Error Handling

- Connection status indicator
- Error messages for API failures
- Success notifications for job starts
- Graceful handling of missing API






