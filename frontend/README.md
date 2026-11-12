# LegalMet-AI Frontend

React + Vite + Tailwind CSS (v4) inspector application for the LegalMet-AI FastAPI backend.

## Run

```bash
cd frontend
npm install
cp .env.example .env     # set VITE_API_BASE_URL if your backend is not on 127.0.0.1:8000
npm run dev              # http://localhost:5173
```

The backend must be running (`uvicorn main:app --reload` from `backend/`) and must have the changes in `../BACKEND_CHANGES.md` applied.

## Structure

- `src/api/` - one file per backend area. `axios.js` holds the shared instance, base URL and JWT header.
- `src/pages/` - one file per screen.
- `src/components/` - reusable UI pieces.
- `src/utils/` - helpers (error messages, etc.).
- `src/index.css` - the design system: colours, buttons, cards, inputs, badges.
