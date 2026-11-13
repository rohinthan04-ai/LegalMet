# LegalMet-AI Frontend

React + Vite + Tailwind CSS (v4) inspector application for the LegalMet-AI FastAPI backend.

## Run

```bash
cd frontend
npm install
cp .env.example .env     # set VITE_API_BASE_URL if the backend is not on 127.0.0.1:8000
npm run dev              # http://localhost:5173
```

The backend must be running (`uvicorn main:app --reload` from `backend/`) with the changes from `../BACKEND_CHANGES.md` applied.

## Workflow and pages

| Step | Route | Page | Backend calls |
|---|---|---|---|
| Login | `/login` | `Login.jsx` | `POST /auth/login`, `GET /auth/me` |
| Dashboard | `/dashboard` | `Dashboard.jsx` | `GET /inspections` |
| New inspection | `/inspections/new` | `CreateInspection.jsx` | `POST /inspections` |
| Upload | `/inspections/:insId/upload` | `ImageUpload.jsx` | `POST /inspections/{id}/images`, `POST /images/{id}/analyze` |
| Review and confirm | `/inspections/:insId/images/:imgId/review` | `OCRReview.jsx` | `GET /images/{id}`, `PUT /images/{id}/details` |
| Category | `.../category` | `CategorySelection.jsx` | `GET /categories`, `GET /categories/{id}/rules` |
| Evaluation | `.../evaluation?c=<categoryId>` | `RuleEvaluation.jsx` | `POST /categories/{c}/images/{i}/evaluate` |
| Report | `/inspections/:insId/report` | `Report.jsx` | `GET /inspections/{id}/report` |
| History | `/inspections` | `InspectionHistory.jsx` | `GET /inspections` |

## Structure

- `src/api/` - one file per backend area. `axios.js` holds the shared instance, base URL, JWT header and 401 handling.
- `src/pages/` - one file per screen.
- `src/components/` - `common/` (Alert, Modal, badges...), `layout/` (sidebar, top bar), `inspection/` (rule card, stepper, image panel).
- `src/context/` + `src/hooks/useAuth.js` - login state.
- `src/utils/` - date handling, rule-text parser, product field definitions, browser storage helpers.
- `src/index.css` - design tokens and reusable classes (`card`, `btn-primary`, `input`, `badge`).

## Things to know

- **Token storage:** the JWT is kept in `localStorage`. Fine for a prototype; any XSS bug could read it. Production apps should use httpOnly cookies.
- **Drafts:** the backend has no endpoint to read saved details or evaluations, so the review page keeps the inspector's edits in this browser (`localStorage`) and the last evaluation in `sessionStorage`. Both are cleared on logout.
- **One image per inspection:** the PDF uses the first image of an inspection, so the UI does not allow a second upload.
- **"Evaluated", not "Compliant":** the backend sets `completed` whenever the AI evaluation runs, even if rules fail.
- **AI output is an inspection aid.** The inspector verifies the package and makes the final decision.
