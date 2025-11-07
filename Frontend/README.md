# Frontend

Admin Dashboard UI crafted with Shadcn and Vite. Built with responsiveness and accessibility in mind.

![alt text](public/images/shadcn-admin.png)

## Features

- Light/dark mode
- Responsive
- Accessible
- With built-in Sidebar component
- Global search command
- 10+ pages
- Extra custom components
- RTL support

## Tech Stack

**UI:** [ShadcnUI](https://ui.shadcn.com) (TailwindCSS + RadixUI)

**Build Tool:** [Vite](https://vitejs.dev/)

**Routing:** [TanStack Router](https://tanstack.com/router/latest)

**Type Checking:** [TypeScript](https://www.typescriptlang.org/)

**Linting/Formatting:** [Eslint](https://eslint.org/) & [Prettier](https://prettier.io/)

**Icons:** [Lucide Icons](https://lucide.dev/icons/), [Tabler Icons](https://tabler.io/icons) (Brand icons only)

**Auth:** Laravel Sanctum

## Run Locally

Install dependencies

```bash
pnpm install
```

Start the development server

```bash
pnpm run dev
```

## Available Scripts

- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run preview` - Preview production build
- `pnpm run lint` - Run ESLint
- `pnpm run format` - Format code with Prettier
- `pnpm run format:check` - Check code formatting

## 🚂 Deployment (Railway)

### Environment Variables

Create a `.env` file with:

```env
VITE_API_URL=https://your-backend.railway.app
VITE_PUSHER_KEY=your_pusher_key
VITE_PUSHER_CLUSTER=us2
VITE_PUSHER_ENCRYPTED=true
VITE_APP_ENV=production
```

### Build Configuration

Railway will automatically detect and build the frontend.

**Custom Configuration:**
- **Root Directory**: `/Frontend`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run preview -- --host 0.0.0.0 --port $PORT`

### After Deploy

Update Backend with Frontend URL:
```env
FRONTEND_URL=https://your-frontend.railway.app
CORS_ALLOWED_ORIGINS=https://your-frontend.railway.app
```

**📖 Full Guide**: [../docs/DEPLOYMENT-RAILWAY.md](../docs/DEPLOYMENT-RAILWAY.md)