# MediTrace - Patient Frontend

React + Vite + Tailwind + Recharts + React Router.

## Run
    npm install
    cp .env.example .env
    npm run dev

## Mock vs real backend
- `VITE_USE_MOCK=true` (default): works with built-in sample data. Any email/password signs in.
- Set `VITE_USE_MOCK=false` and `VITE_API_URL` to use the FastAPI backend.
- All calls go through `src/api/client.js` (endpoint list is at the top of that file).

## Safe wording
All status text is in `src/constants/wording.js`. AI output is always labelled
"Pending Doctor Verification" until a doctor verifies it. Never add "diagnosis" wording.

## Screens
Login, Onboarding (/welcome), Dashboard, Upload, Processing, Evidence (/reports/:id),
Verified health information, Previous records (with trends), Secure sharing.

## Doctor interface
Sign in at `/doctor/login` (any email and password in mock mode).
Screens: Doctor Dashboard (`/doctor`), Patient Cases (`/doctor/cases`),
Report Review (`/doctor/reports/:id`), Historical Records (`/doctor/history`),
Clinical Notes (`/doctor/notes`), Audit History (`/doctor/audit`).

Files: `src/pages/doctor/`, `src/components/doctor/`, `src/api/mockDoctor.js`.
Doctor endpoints are listed in `src/api/client.js`.
Patients and doctors are separated by `user.role` (`patient` or `doctor`).

## Connected demo (patient <-> doctor)
- Patient and doctor screens share one data store (`src/api/store.js`, kept in localStorage key `mt_store_v1`).
- A doctor sees a report only while an active, unexpired, unrevoked patient share covers it.
- Login is per browser tab (sessionStorage), so the patient and the doctor can be signed in side by side.
- Reset demo data from the browser console: `localStorage.removeItem("mt_store_v1")`.
- Demo doctor email with pre-shared reports: `dr.chen@meditrace.health`.
