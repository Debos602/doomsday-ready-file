# Doomsday Ready — Web app

Frontend for **Doomsday Ready**, a small app that helps MCU fans plan their rewatch before *Avengers: Doomsday* and book an opening-night watch party.

- **API (Node + Express + Prisma):** https://github.com/Debos602/doomsday-ready-server
- **Live app:** https://doomsday-ready-client-virid.vercel.app

**Stack:** React 19 · Vite 6 · Tailwind CSS v4

## Screens

- **Movies.** Add a movie (title, release year, runtime, prerequisites), mark movies as watched, and edit a movie's prerequisites. A prerequisite that would create a circular dependency is rejected and the message is shown.
- **Rewatch plan.** Pick a movie and see everything to watch first, in order, with a progress bar, the watched count and the time left to watch.
- **Booking.** Pick a cinema and a group size (1–10,000). The page shows the fewest bundles that cover the group exactly, or says it is not possible. New cinemas can be added from the same screen.

Success and error messages appear as toasts in the bottom-right corner.

## Run locally

Requirements: Node.js 20+ and the API running (see the API repo).

```bash
npm install
npm run dev        # http://localhost:5173
```

In development Vite forwards every `/api` request to the API, so no configuration is needed when the API runs next to this folder. The proxy target is read from `../server/.env` (`PORT`, default `4000`). If the API is somewhere else, set it explicitly:

```bash
# macOS / Linux
VITE_API_PROXY=http://localhost:5000 npm run dev
# Windows PowerShell
$env:VITE_API_PROXY="http://localhost:5000"; npm run dev
```

## Environment variables

| Variable | When | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | Production build | Full API address including `/api`, for example `https://my-api.vercel.app/api`. When it is empty the app calls `/api` on its own domain (works only with the dev proxy) |
| `VITE_API_PROXY` | Development only | Address the dev server forwards `/api` to |

`VITE_` variables are written into the code at build time. After changing `VITE_API_URL` the app must be **built again** (a redeploy on Vercel).

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |

## Project structure

```
src
├── main.jsx            # entry: fonts, styles, ToastProvider
├── App.jsx             # header, tab navigation, shared data loading
├── api.js              # fetch wrapper for every API call
├── index.css           # Tailwind v4 theme tokens and custom styles
└── components/
    ├── MoviesView.jsx      # movie list, add form, prerequisite editor
    ├── RewatchView.jsx     # rewatch plan
    ├── BookingView.jsx     # booking quote and add cinema
    ├── Toast.jsx           # success / error toasts
    └── ui.jsx              # shared Card, Button, inputs, prerequisite picker
```

## Design

A cinema-lobby look: deep plum backgrounds, cream ticket-stock cards, a warm marquee-yellow highlight and a velvet-red accent. Headings use Big Shoulders Display and body text uses Hanken Grotesk, both bundled with `@fontsource` so no external font request is made. Watched movies are marked with a hole-punch style checkbox, like a ticket being punched. Animations respect the reduced-motion setting.

## Deploy on Vercel

1. Deploy the API first and note its address.
2. Import this repo in Vercel. Leave the *Root Directory* empty and choose the **Vite** framework preset.
3. Add the environment variable `VITE_API_URL` = `https://<your-api-domain>/api` (no trailing slash).
4. Deploy. Then set `FRONTEND_URL` on the API project to this app's address so the API accepts requests from it (CORS), and redeploy the API.

A Dockerfile and `nginx.conf` are included for running the built app in a container (the app is served on port 80).

## Troubleshooting

| Message | Likely cause |
| --- | --- |
| `Cannot reach the server. Is the API running?` | The browser could not complete the request: the API is down, `VITE_API_URL` is wrong, or the API's `FRONTEND_URL` does not match this app's address (CORS). Open the browser console for the exact reason |
| `404` on `/api/movies` | `VITE_API_URL` was not set when the app was built. Set it and redeploy |
| This change would make a movie depend on itself... | The selected prerequisites create a circular dependency. Remove the movie that comes later in the story |

## How AI tools were used

<!-- Rewrite this section in your own words before submitting. -->
Claude (Anthropic) helped scaffold the React components, the visual design and these READMEs. The screens were checked against the assessment brief and run against the API.
