# HostMaster Frontend Dashboard

Modern Next.js 14 dashboard for AWS cost optimization and resource management.

## Features

- **Next.js 14 App Router:** Latest React Server Components
- **Tailwind CSS:** Utility-first styling
- **TypeScript:** Type-safe development
- **Axios:** API client for backend communication
- **Recharts:** Beautiful data visualizations
- **Responsive:** Mobile-first design

## Getting Started

### Prerequisites

- Node.js 20+
- Backend API running (see `/backend`)

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3001
```

### Environment Variables

Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Project Structure

```
frontend/
├─ app/
│  ├─ layout.tsx        # Root layout
│  ├─ page.tsx          # Home page
│  ├─ globals.css       # Global styles
│  ├─ login/            # Login page (TODO)
│  ├─ register/         # Registration (TODO)
│  └─ dashboard/        # Main dashboard (TODO)
├─ components/
│  ├─ Navbar.tsx        # Navigation (TODO)
│  ├─ CostChart.tsx     # Cost visualization (TODO)
│  └─ ResourceTable.tsx # Resource list (TODO)
├─ lib/
│  └─ api.ts            # API client (TODO)
├─ public/              # Static assets
├─ tailwind.config.js
├─ next.config.js
└─ package.json
```

## Pages

### Landing Page (/)
- Feature overview
- Call to action
- GitHub link

### Login (/login) - TODO
- Email/password form
- JWT token storage

### Dashboard (/dashboard) - TODO
- Cost overview
- Resource list
- Optimization recommendations

## Components

All components use TypeScript and Tailwind CSS.

### TODO Components
- [ ] Navbar with user menu
- [ ] CostChart (line chart with Recharts)
- [ ] ResourceTable (sortable, filterable)
- [ ] RecommendationCard
- [ ] LoadingSpinner
- [ ] ErrorBoundary

## API Integration

Using Axios for backend API calls:

```typescript
// lib/api.ts
import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add JWT token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

## Styling

Using Tailwind CSS with custom theme:
- Primary color: Blue (#3b82f6)
- Dark mode support
- Responsive breakpoints: sm, md, lg, xl

## Build

```bash
# Production build
npm run build

# Start production server
npm start
```

## Docker

```bash
# TODO: Add Dockerfile for frontend
```

## Testing

```bash
# TODO: Add Jest + React Testing Library
```

## License

MIT
