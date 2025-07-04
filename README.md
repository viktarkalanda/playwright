# E2E Testing Project

## Project Goal
This project demonstrates a comprehensive end-to-end testing approach using Playwright for both UI and API testing. It includes:
- Automated UI tests for critical user journeys
- API testing with Axios
- Email testing capabilities
- Mock API responses using WireMock
- Detailed test reporting with Playwright HTML Reporter

## Requirements
- Node.js 20 LTS
- Docker and Docker Compose
- Chrome, Firefox, or Safari browser

## Quick Start

### 1. Start Infrastructure
Start required services (WireMock, MailHog, MySQL):
```bash
docker-compose up -d
```

### 2. Install Dependencies
Install Node.js dependencies and Playwright browsers:
```bash
npm install && npx playwright install
```

### 3. Run Tests
Run all tests with Playwright:
```bash
npx playwright test
```

## Test Reports

### Playwright HTML Report
After tests complete, view the report:
```bash
npx playwright show-report
```

## Infrastructure Details

The project uses the following services:
- WireMock (port 8080) - Mock API responses
- MailHog (port 8025) - Email testing interface
- MySQL (port 3306) - Test database

To stop all services:
```bash
docker-compose down
```

## Tech Stack
- TypeScript
- Playwright - UI and API testing framework
- Axios - HTTP client for API requests
- WireMock - API mocking
- MailHog - Email testing
