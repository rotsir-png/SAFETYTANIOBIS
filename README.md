# TANIOBIS Safety Game

A mobile-first safety game web application built as a personal software project for factory Safety Month activities.

The project combines **React / TypeScript frontend development**, **LINE LIFF identity integration**, **Supabase/PostgreSQL data handling**, game state/progression, leaderboard features, and manual testing/debugging.

> **Portfolio note:** The original LINE OA environment is no longer active. This repository is maintained as a source-code portfolio. The application also contains a development fallback mode when LINE LIFF or Supabase environment variables are not configured.

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Vite
- **Integration:** LINE LIFF SDK
- **Database / Backend-as-a-Service:** Supabase, PostgreSQL
- **Client storage:** localStorage fallback
- **Development:** Git / GitHub, ESLint
- **Development approach:** AI-assisted coding with manual testing, debugging, and iterative refinement

## Key Features

- Player registration and profile flow
- LINE LIFF identity integration with development-mode fallback
- Campaign progression and stage unlock logic
- Safety-themed interactive game stages
- Endless Mode
- Score and stage-clear persistence
- Player and department leaderboard features
- Supabase data reads, inserts, upserts, filtering, ordering, and error handling
- localStorage fallback when remote services are unavailable
- Mobile-first UI and interactive game feedback

## Technical Work Demonstrated

### React / TypeScript
- Functional components and reusable screen/stage structure
- React hooks such as state, effects, callbacks, and refs
- Screen navigation, game state, progression, and result handling
- Asynchronous application flows and client-side validation

### LINE LIFF Integration
- LIFF initialization and LINE profile retrieval
- Verified LINE identity flow when launched inside LINE
- Stable development identity fallback when LIFF is unavailable
- Profile/session handling across application startup

### Supabase / PostgreSQL
- Player profile lookup and upsert
- Stage-clear and Endless Mode score recording
- Leaderboard and department participation queries
- Filtering, ordering, deduplication, and data mapping
- SQL migration files for leaderboard and LINE identity-related schema changes

### Reliability / Fallback Handling
- Graceful handling when Supabase configuration is unavailable
- localStorage-based profile, progress, and high-score persistence
- Error handling around remote reads/writes
- Logic to reconcile remote identity/profile state with local saved data

## Testing & Problem Solving

The project was developed iteratively with AI assistance. My focus included defining expected behavior and user flows, testing features, reproducing issues, checking edge cases, refining requirements, and retesting changes.

Examples of tested areas include:

- Registration and profile state
- LINE identity / development fallback behavior
- Stage progression and unlock conditions
- Score recording
- Leaderboard data
- Related-flow regression after fixes
- Remote-data vs local-storage fallback behavior

## Project Structure

```text
src/
├── components/       Reusable UI/game components
├── data/             Game and content data
├── lib/              LIFF, Supabase, environment and player helpers
├── screens/          Registration, title, campaign, result and leaderboard screens
├── services/         Identity and leaderboard data services
├── stages/           Campaign stages and Endless Mode
├── App.tsx           Main application flow and screen/state orchestration
└── storage.ts        Local profile/progress/high-score persistence

supabase/
└── migrations/       Database schema migration files
```

## Run Locally

```bash
npm install
npm run dev
```

Optional environment variables for connected features:

```env
VITE_LIFF_ID=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

If LIFF is not configured, the app uses a development identity. If Supabase is not configured, remote database features are disabled and localStorage fallback remains available.

## About This Project

This project started from a workplace safety-game concept and became a hands-on learning project covering application flow, frontend development, system integration, database interaction, software testing, debugging, and iterative improvement.

I used AI extensively as a coding assistant, while working on the requirements, user/game flows, expected behavior, testing, debugging, and refinement of the application.
