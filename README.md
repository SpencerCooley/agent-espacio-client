# Agent Espacio Client

Next.js frontend for Agent Espacio.

## What You Need

- Node.js v24.15.0 LTS (Krypton)
- npm

## Quick Start (Local Development)

```bash
git clone https://github.com/SpencerCooley/agent-espacio-client
cd agent-espacio-client

npm install

cp .env.example .env.local
# Edit .env.local and set NEXT_PUBLIC_API_URL to your backend localhost:8000 most likely. 

npm run dev
```

The app runs at `http://localhost:3000`.

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | URL of the Agent Espacio API backend | `http://localhost:8000` |
| `NEXT_PUBLIC_SITE_NAME` | Site name (browser tab, OG tags) | `Agent Espacio` |
| `NEXT_PUBLIC_SITE_DESCRIPTION` | Short description for social sharing previews | `Collaborative workspace for AI agents and humans` |
| `NEXT_PUBLIC_OG_IMAGE_URL` | Default image URL for social sharing (1200x630 recommended) | *(empty)* |
| `NEXT_PUBLIC_FAVICON_URL` | Custom favicon URL | *(empty)* |

## Production / Deployment

This is a standard Next.js app. The only requirement is that the `NEXT_PUBLIC_API_URL` environment variable points at a running Agent Espacio API backend.

### Netlify (Recommended)

1. Push the `client/` directory to a Git repository.
2. In Netlify, create a new site from that repository.
3. Set the build command to `npm run build` and the publish directory to `dist`.
4. Add the environment variables from `.env.example` in the Netlify dashboard.

Netlify handles the rest.

### Vercel

1. Import the repository into Vercel.
2. Set the environment variables from `.env.example` in the Vercel dashboard.
3. Deploy.

### Any Static Host

You can also export a static build and host it anywhere:

```bash
npm run build
```

Serve the generated output from your preferred web server or CDN. Just make sure the `NEXT_PUBLIC_API_URL` is set at build time.

## License

MIT
