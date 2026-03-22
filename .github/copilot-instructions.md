# Copilot Instructions — Salud De Una Mobile

## Project Overview

This repository is the **mobile frontend for patients** of Salud De Una.
It is built with **Expo SDK 54**, **Expo Router**, **React 19**, **React Native 0.81**, and **TypeScript strict mode**.

This is **not** a backend repository.
Do not suggest NestJS, MongoDB, Mongoose, controllers, DTO classes, Passport strategies, or server-side patterns unless the user explicitly asks for cross-repo integration guidance.

## Product Scope

This app currently covers only patient flows:

- patient authentication and session
- patient profile
- patient notifications

Doctor and admin experiences belong to other repositories and must not be introduced here.

## Repository Structure

Use the current architecture of this repo:

- `app/`: Expo Router routes, route groups, layouts, and entry screens
- `src/`: reusable application code and product logic
- `assets/`: static assets
- `scripts/`: maintenance scripts
- `.github/workflows/`: CI automation

### Important Rule

`app/` handles routing and composition.
`src/` handles product logic.

Do not move shared business logic into `app/`.

## Expected Layers Inside `src/`

- `features/`: feature-specific screens, hooks, and domain logic
- `services/`: API clients, auth services, notification services
- `schemas/`: Zod schemas and validation contracts
- `types/`: shared domain types
- `store/`: global session state
- `providers/`: app-level providers
- `ui/`: primitives and reusable UI building blocks
- `components/`: shared composition components
- `hooks/`: shared hooks
- `config/`: runtime config
- `constants/`: shared constants
- `lib/`: small focused utilities
- `tests/`: transversal unit tests and test support

## Technology Preferences

Prefer the libraries already used in the repo:

- **Axios** for HTTP
- **TanStack Query** for server state
- **Zod** for schema validation
- **React Hook Form** for forms
- **Zustand** for session/global state when already part of the flow

Do not introduce alternative stacks without a strong reason.
Avoid unnecessary dependencies.

## Coding Rules

- Use **TypeScript** with explicit, strict typings.
- Keep imports direct; avoid barrel exports unless the repo already adopts them for a specific area.
- Keep model and contract names in **English**.
- Keep documentation and explanatory text in **Spanish** unless the surrounding file is already in English.
- Prefer small, reviewable changes.
- Reuse existing utilities before creating new abstractions.

## Expo Router Rules

- Route files and layouts belong in `app/`.
- If a route becomes large, extract the implementation into `src/features/...`.
- Keep `_layout.tsx` files focused on navigation/layout concerns.
- Do not place API logic, schemas, or global state directly in route files.

## UI and Frontend Guidance

- Preserve the existing visual language unless the user asks for a redesign.
- Prefer reusable components from `src/ui` and `src/components` before adding new ones.
- Keep mobile behavior in mind first.
- Respect React Native and Expo platform differences where relevant.

## API and Contracts

- Backend endpoints are consumed under `/v1`.
- Environment variables:
  - `EXPO_PUBLIC_API_URL`
  - `EXPO_PUBLIC_APP_ENV`
- Use existing schemas and types to keep frontend contracts aligned with the backend.
- Prefer validating input and normalization close to forms/services using the established Zod-based approach.

## Testing and Quality

Use the existing project commands when suggesting verification:

- `npm run lint`
- `npm run test`
- `npm run test:cov`

When adding tests:

- Prefer Jest tests in `src/tests`
- Cover business logic, schemas, utilities, and service behavior first
- Avoid proposing heavy UI test infrastructure unless the user explicitly asks for it

## CI and Sonar

This repository uses GitHub Actions and SonarCloud.
If a change affects CI, lint, tests, or coverage:

- keep coverage output compatible with `coverage/lcov.info`
- avoid changes that break the existing Sonar analysis flow
- prefer minimal, explicit workflow changes

## What Copilot Should Avoid

- Do not generate backend-only patterns for this repo.
- Do not introduce doctor/admin domain flows here.
- Do not add large architectural refactors unless explicitly requested.
- Do not duplicate types across `types/`, `schemas/`, and form models without a clear reason.
- Do not place reusable shared code in the project root when it belongs in `src/`.

## Preferred Contribution Style

When generating code, prefer:

1. minimal diffs
2. clear naming
3. feature-oriented organization
4. alignment with the current Expo + React Native stack
5. code that can pass lint and existing tests with minimal follow-up
