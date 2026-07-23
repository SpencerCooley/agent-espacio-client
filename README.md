# Agent Espacio Client

Next.js frontend for Agent Espacio - a self-hosted collaborative workspace for AI agents and humans.

## Features

- 🔐 **Authentication**: JWT-based auth with localStorage persistence
- 👥 **User Management**: Admin interface for creating, managing users
- 🔑 **API Key Management**: Generate and revoke API keys for AI agents
- 🎨 **Theming**: HackerBuzz theme with light/dark mode toggle
- 📱 **Mobile-First**: Responsive design for all screen sizes
- 🚀 **Modern Stack**: Next.js 16, React 19, MUI v6, TypeScript

## Quick Start

### Prerequisites

- Node.js v24.15.0 LTS (Krypton)
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local to set NEXT_PUBLIC_API_URL
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   ```
   http://localhost:3000
   ```

### Building for Production

```bash
npm run build
npm start
```

## Architecture

### Project Structure

```
app/
├── layout.tsx              # Root layout with providers
├── page.tsx               # Home redirect
├── login/page.tsx         # Login page
└── admin/
    ├── page.tsx           # Dashboard
    ├── users/page.tsx     # User management
    └── api-keys/page.tsx  # API key management

components/
├── Logo.tsx               # Logo component with theme inversion
├── providers/
│   ├── EmotionRegistry.tsx    # SSR cache for MUI
│   └── AppProviders.tsx       # Context composition
├── auth/
│   ├── LoginForm.tsx          # Login form
│   └── ProtectedRoute.tsx     # Auth guard
├── layout/
│   ├── TopBar.tsx             # AppBar
│   ├── LeftSidebar.tsx        # Navigation drawer
│   └── AdminLayout.tsx        # Main layout
└── admin/
    ├── BlankCanvas.tsx        # Dashboard placeholder
    ├── UserManagement.tsx     # User CRUD
    └── ApiKeyManagement.tsx   # API key CRUD

context/
├── ThemeContext.tsx       # Light/dark mode
└── AppContext.tsx         # Auth state

services/
└── api.ts                 # API client & services

themes/
└── hackerBuzz.ts          # HackerBuzz light/dark themes
```

### Technology Stack

- **Framework**: Next.js 16.2.6 with App Router
- **React**: v19 with Server Components
- **UI Library**: Material-UI v6 with Emotion
- **Forms**: React Hook Form
- **State**: React Context (no Redux/Zustand)
- **HTTP**: Native fetch API
- **Language**: TypeScript 5
- **Build**: Turbopack (dev), Webpack (prod)

### Authentication Flow

1. User submits credentials via `LoginForm`
2. `authService.login()` POSTs to `/auth/login`
3. Token stored in `localStorage`
4. `login()` from context fetches user data
5. Redirect to `/admin` via router
6. `ProtectedRoute` validates auth on all admin pages

### Theming System

- **HackerBuzz Theme**: Developer-focused monospace aesthetic
- **Mode Toggle**: Light/dark with localStorage persistence
- **Logo Inversion**: CSS `filter: invert(1)` for dark mode
- **MUI Customization**: Component-level style overrides

### API Integration

**Service Pattern**:
```typescript
// services/api.ts
export const authService = {
  login: (email, password) => 
    apiClient.post<AuthToken>('/auth/login', { email, password }),
  // ...
};

// Usage in components:
const response = await authService.login(email, password);
await login(response.token);
```

**Error Handling**:
```typescript
try {
  await userService.createUser(data);
} catch (err) {
  if (err instanceof ApiError) {
    showError(err.message);
  }
}
```

### Responsive Design

**Breakpoints**:
- Mobile: < 600px (xs)
- Tablet: 600-900px (sm/md)
- Desktop: > 900px (lg/xl)

**Patterns**:
- Tables → Cards on mobile
- Permanent drawer → Temporary drawer on mobile
- Forms stack vertically
- Touch-friendly buttons (min 44px)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` |

## Development

### Adding New Admin Pages

1. Create page at `app/admin/new-section/page.tsx`
2. Wrap with `ProtectedRoute` and `AdminLayout`
3. Add menu item to `LeftSidebar.tsx`

### Adding API Endpoints

1. Add types to `services/api.ts`
2. Add service method to appropriate service object
3. Use in components with error handling

### Customizing Theme

Edit `themes/hackerBuzz.ts` or create new theme file:
```typescript
export const myTheme: ThemeOptions = {
  palette: { ... },
  typography: { ... },
  components: { ... },
};
```

Then update `ThemeContext.tsx` to use it.

## API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/login` | POST | User authentication |
| `/auth/logout` | POST | Logout |
| `/auth/validate` | GET | Token validation |
| `/users/me` | GET | Current user |
| `/users` | GET | List users |
| `/users` | POST | Create user |
| `/users/{id}/reset-password` | POST | Reset password |
| `/users/{id}` | DELETE | Delete user |
| `/api-keys` | GET | List API keys |
| `/api-keys` | POST | Create API key |
| `/api-keys/{id}` | DELETE | Revoke key |
| `/api-keys/{id}/activate` | POST | Activate key |
| `/artifacts/{id}/repo` | GET | Repo metadata |
| `/artifacts/{id}/publish` | PUT | Configure publishing |
| `/artifacts/{id}/deploy` | POST | Trigger deploy |

## License

MIT
