# MediTrace backend

## Run locally (Windows PowerShell)

From `C:\python\medi-trace\backend`:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Set `OPENROUTER_API_KEY` in `.env` to enable AI summaries and lab extraction. The app still accepts and stores reports without this key; analysis then returns a clear fallback summary and no fabricated values. Image OCR also requires the Tesseract OCR executable installed on Windows and available on `PATH`.

Create a doctor account once, using hidden password input:

```powershell
python create_doctor.py
```

Start FastAPI from this folder so SQLite uses the existing `medical_platform.db`:

```powershell
uvicorn main:app --reload
```

Start the frontend in a second terminal from `C:\python\medi-trace\Frontend\Dashboards`:

```powershell
npm install
npm run dev
```

Open the Vite URL (usually `http://localhost:5173`). The Vite `/api` proxy forwards requests to FastAPI at `http://127.0.0.1:8000`.

For a cross-origin deployment, set `VITE_API_BASE_URL` to the full FastAPI URL and set `FRONTEND_ORIGINS` in the backend `.env` to the frontend origin(s), comma-separated.

## Existing database and migrations

On startup, `migrations.run_migrations()` preserves existing rows, creates the `report_shares`, `audit_events`, and `schema_migrations` tables, and adds `users.full_name` plus nullable `reports.reviewed_by_id` and `reports.verified_at` columns when they are missing. The migration is idempotent and does not require deleting or reseeding `medical_platform.db`. Take a file backup before the first startup with this version.

New patients can register from the UI. Doctor registration is intentionally disabled; provision each doctor with `python create_doctor.py`. Doctors see only reports the patient shared with their account. Shares expire and can be revoked by the patient.

The OpenAPI page is available at `http://127.0.0.1:8000/docs`.
