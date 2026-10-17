# Catfe (web)

Next.js app for the DubHacks 2026 study-spot product.

## Run locally

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Optional: copy `.env.example` to `.env.local` and set `OPENAI_API_KEY` for live chatbot replies. Without it, recommendations use the built-in rule-based cat.

## Demo features

- Interactive UW-area map (Leaflet) with hover/popups and filters
- AI Cat recommender (local or OpenAI via `/api/chat`)
- Save favorites + star ratings (localStorage)
- Friend activity feed with Spotify track stubs
- Manual study session logging with optional photo
