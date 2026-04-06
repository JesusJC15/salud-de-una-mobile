# Triage Flow Implementation Plan (Mobile)

## 1. Objective and Scope (MVP)

Implement three screens:

### TriageSelectionScreen
- Select specialty: General Medicine or Dentistry
- CTA: "Start Triage" → POST `/v1/triage/sessions` with selected specialty
- On success → navigate to questionnaire

### TriageQuestionnaireScreen (General Medicine)
- Render one question at a time with progress indicator (Step X of N)
- Supported answer types:
  - Single choice
  - Multiple choice
  - Numeric scale (1–10)
- "Next" → POST `/v1/triage/sessions/{id}/answers` with current answer
- When backend returns `isComplete: true`:
  - Enable "Finish and Analyze"
  - Trigger analysis (based on backend contract)

### TriageResultScreen
- Display priority: LOW / MODERATE / HIGH with color coding
- Show list of red flags (title and description)
- If HIGH → show warning banner
- CTA: "View my case in consultations" → navigate to patient consultations list

### Key Criteria
- No crashes with valid inputs
- Readable backend error handling
- Accurate progress tracking
- Correct HIGH priority banner behavior

---

## 2. Navigation Design (Expo Router)

### 2.1 Routes

app/(patient)/triage/index.tsx  
app/(patient)/triage/session/[sessionId].tsx  
app/(patient)/triage/session/[sessionId]/result.tsx  

Each route acts as a wrapper:

return <TriageSelectionScreen />

### 2.2 Screen Implementation Location

src/screens/triage/TriageSelectionScreen.tsx  
src/screens/triage/TriageQuestionnaireScreen.tsx  
src/screens/triage/TriageResultScreen.tsx  

---

## 3. API Contracts: Services, Schemas, Types

### 3.1 API Service

File: src/services/triage/triage.api.ts

Responsibilities:
- createTriageSession(specialty)
- submitTriageAnswer(sessionId, payload)
- getTriageSession(sessionId)
- getTriageResult(sessionId)
- analyzeTriageSession(sessionId)

---

### 3.2 Zod Schemas

Directory: src/schemas/triage/

Files:
- triage-session.schema.ts
- triage-question.schema.ts
- triage-answer.schema.ts
- triage-result.schema.ts

Purpose:
- Safe parsing
- Controlled fallback behavior
- Prevent crashes from unexpected backend changes

---

### 3.3 Domain Types

File: src/types/triage.ts

type TriageSpecialty = 'GENERAL_MEDICINE' | 'DENTISTRY'  
type TriagePriority = 'LOW' | 'MODERATE' | 'HIGH'  
type TriageQuestionType = 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'NUMERIC_SCALE'  

---

## 4. State Management and Data Fetching (TanStack Query)

### 4.1 Mutations
- useCreateTriageSessionMutation()
- useSubmitTriageAnswerMutation(sessionId)
- useAnalyzeTriageSessionMutation(sessionId)

### 4.2 Queries
- useTriageSessionQuery(sessionId):
  - Questions
  - Current question index or ID
  - isComplete
  - Result

Structure recommendation:
- src/features/triage/
- or src/screens/triage/hooks/

---

## 5. UX/UI per Screen

### 5.1 TriageSelectionScreen

Components:
- Intro card explaining triage
- Specialty options list (icon, title, subtitle)
- CTA button

States:
- Idle
- Loading (disable CTA, show spinner)
- Error (show readable message)

Navigation:
router.push({ pathname: '/(patient)/triage/session/[sessionId]', params: { sessionId } })

---

### 5.2 TriageQuestionnaireScreen

Structure:
- Header with back button
- Progress: Step X of N + progress bar

Body:
- Question title
- Optional description
- Dynamic rendering:
  - Single: radio list
  - Multi: checkbox list
  - Scale: slider or selector 1–10

Footer:
- Back (optional)
- Next (if not complete)
- Finish and Analyze (if isComplete === true)

Validation:
- Single: exactly one option
- Multi: at least one option
- Scale: value 1–10

Behavior:
- On Next:
  - Submit mutation
  - Disable button during request
  - Refetch session on success
- Handle backend errors with readable messages

---

### 5.3 TriageResultScreen

Layout:
- Priority badge (LOW / MODERATE / HIGH)
- HIGH → warning banner
- Red flags list

CTA:
- View my case in consultations

States:
- Loading
- Error with retry
- Empty: No warning signs detected

---

## 6. Error Handling

Utility:

getHumanReadableApiError(error): string

Rules:
- Use error.response.data.message if string
- Join if array
- Fallback otherwise

Display:
- Alert or toast

---

## 7. Minimal Testing

Location:
src/tests/

Include:
- Zod schema tests
- Mapper tests
- Utility tests

Commands:
npm run lint  
npm run test  

---

## 8. Definition of Done

- Routes created
- 3 screens implemented
- API service ready
- Zod schemas implemented
- Query hooks implemented
- Progress UI correct
- HIGH banner working
- Error handling readable
- No crashes with valid input
- Basic tests implemented
- Lint and tests passing

---

## Note

Short frontend summary:

- Call POST /v1/triage/sessions → store questions  
- Send answers via POST /.../answers repeatedly → use nextQuestionId to advance  
- When isComplete === true → call POST /.../analyze to obtain priority and redFlags  