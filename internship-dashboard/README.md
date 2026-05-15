# ApplyIQ Frontend (Internship Intelligence System)

This is the React + Vite dashboard for ApplyIQ. It provides application tracking, analytics, and manual management features, along with status suggestions and dark mode UI.

## Features
- Application list with stage management
- Analytics dashboards (funnel, trends, platform performance)
- Suggestions review and confirmation
- Manual apply notes and reminders
- Dark mode theme

## Tech stack
- React
- Vite
- Tailwind CSS
- Recharts

## Setup
```bash
npm install
npm run dev
```

## Environment
The frontend expects the backend running locally. If your API base URL is configurable, update it in the API client file.

## Project structure
- `src/pages/` main screens
- `src/components/` shared components
- `src/api/` API wrappers
- `src/utils/` UI helpers

## Notes
If you update backend endpoints, ensure the API client paths match.
