# Tuition Manager

Attendance, fees and AI-generated practice papers for private tutors, with a read-only progress page for parents.

**Stack:** React (Vite) · Node.js + Express · MySQL · Anthropic API (optional)

## Run it
1. Run `server/schema.sql` in MySQL Workbench.
2. `cd server && cp .env.example .env` (set your MySQL password), then `npm install && npm run seed && npm run dev`
3. `cd client && npm install && npm run dev` and open http://localhost:5173
4. Sign in with `demo@tutor.com` / `demo1234`. Parent codes are shown on the Students page.

Set `ANTHROPIC_API_KEY` in `server/.env` for AI questions; without it the quiz maker falls back to simple sentence-based questions.

## API
`POST /api/auth/login` · `GET /api/dashboard` · `GET|POST /api/students` · `GET|POST /api/attendance` · `GET /api/fees` · `PATCH /api/fees/:id/pay` · `POST /api/quiz` · `GET /api/parent/:code`

## Study space for students
Tutors publish notes (with optional question and answer pairs) under **Notes**. Students open `/study` and enter the same access code shown on the Students page, search notes by title, sort or filter them, and mark each one as studied. Progress shows in the student's view and on the tutor's Students and Notes pages.

**Upgrading from the first version:** `schema.sql` now starts with `DROP DATABASE`, so re-run it, then `npm run seed` again.
