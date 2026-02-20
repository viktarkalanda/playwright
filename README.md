# E2E Testing Project

## Project Goal
This project demonstrates a comprehensive end-to-end testing approach using Playwright for both UI and API testing. It includes:
- Automated UI tests for critical user journeys
- API testing with Axios
- Detailed test reporting with Playwright HTML Reporter

## Requirements
- Node.js 20 LTS
- Chrome, Firefox, or Safari browser

## Quick Start

### 1. Install Dependencies
Install Node.js dependencies and Playwright browsers:
```bash
npm install && npx playwright install
```

### 2. Run Tests
Run UI and API suites:
```bash
npm run test:all
```

Run suites independently:
```bash
npm run test:ui
npm run test:api
```

## Test Reports

### Playwright HTML Report
After tests complete, view the report:
```bash
npx playwright show-report
```

## Infrastructure Details

This repository currently does not include a root `docker-compose.yml`.
If infrastructure services are required for your environment, use your team-specific setup.

## Tech Stack
- TypeScript
- Playwright - UI and API testing framework
- Axios - HTTP client for API requests
- WireMock - API mocking
- MailHog - Email testing
