# MediTrace

MediTrace is a FastAPI + SQLite backend with a React/Vite patient and doctor frontend.

## Start the existing app

1. In PowerShell, open `C:\python\medi-trace\backend`, create/activate `.venv`, install `requirements.txt`, and copy `.env.example` to `.env`. See [backend setup](backend/README.md) for the complete commands and OpenRouter setup.
2. Create a doctor login with `python create_doctor.py` from the backend folder.
3. Start FastAPI from the backend folder with `uvicorn main:app --reload`.
4. In another terminal, open `C:\python\medi-trace\Frontend\Dashboards` and run `npm install` then `npm run dev`.
5. Open the Vite URL. Patient accounts register in the UI; patients share processed reports with an existing doctor account from **Secure sharing**.

The backend automatically applies the idempotent SQLite migration on startup. It preserves existing patient/report data while adding report sharing, audit history, patient names, and verification metadata.
