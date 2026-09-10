# Implementation Spec: Phỏng vấn với AI

**Date:** 2026-09-08  
**Based on:** Design Document 2026-09-07  
**Status:** Ready for Implementation Plan  
**Tech Stack:** Node.js/Express, SQLite, Qwen 3.7 Plus API

---

## 1. Overview

A web app for HR to screen candidates via AI-powered interviews. Three phases:
1. **HR Setup:** Upload JD → AI extracts fields + suggests skills/questions → HR customizes → Generate link
2. **Candidate Interview:** Chat-based interview with adaptive follow-ups (max 3 per question)
3. **HR Review:** View chat history + AI-generated rubric with scores

**Core constraint:** No authentication for MVP (share link = access).

---

## 2. Scope: What We Build

### Phase 1: HR Setup ✅
- [ ] HR pastes JD text
- [ ] AI extracts: Job Title, Level (Junior/Mid/Senior), Company
- [ ] HR confirms/edits extracted fields
- [ ] HR chooses 1-5 skills (or accepts AI suggestion)
- [ ] AI suggests questions per skill (variable per skill, not fixed 3)
- [ ] HR can edit, add, remove questions
- [ ] HR reviews and generates unique link
- [ ] Link format: `/interview/{SESSION_ID}`

### Phase 2: Candidate Interview ✅
- [ ] Candidate opens link → sees welcome message
- [ ] For each question:
  - [ ] AI asks question
  - [ ] Candidate types answer
  - [ ] AI evaluates: enough information?
  - [ ] If yes → Move to next question
  - [ ] If no & attempts < 3 → AI asks follow-up
  - [ ] If attempts = 3 → Move to next question (accept as-is)
- [ ] No visible progress, skill name, or evaluation criteria to candidate
- [ ] Interview ends → Show "Thank you" message

### Phase 3: HR Review ✅
- [ ] HR accesses results page: `/review/{SESSION_ID}`
- [ ] Two panels side-by-side:
  - **Left:** Full chat history (Q1, A1, Q1-followup, A1-followup, Q2, A2, ...)
  - **Right:** Rubric table (skill name | score | evidence)
- [ ] Score format: 0-10 (number)
- [ ] HR can view, but not edit results
- [ ] Export buttons: PDF (chat + rubric), CSV (rubric only)

### Out of Scope (Tuần 2+)
- User authentication
- Multiple interviews per candidate
- Custom scoring rubric
- Candidate retakes
- Analytics dashboard
- Integration with HR systems (ATS)

---

## 3. Frontend: Screens & States

### Screen 1: HR Setup (Multi-step Form)

**URL:** `/setup`

**Step 1: Input JD**
- Textarea: "Paste job description..."
- Button: "Next"
- **States:**
  - Empty (default): textarea empty, Next button disabled
  - Filled: textarea has text, Next button enabled
  - Loading: "Extracting fields..." spinner
  - Error: "Failed to extract. Please try again." + red text

**Step 2: Confirm Extracted Fields**
- Display 3 fields: Job Title, Level (dropdown: Junior/Mid/Senior), Company
- Each field has "Edit" button
- When clicking Edit: field becomes editable (text input)
- Button: "Next"
- **States:**
  - Ready: all fields filled, Next enabled
  - Empty: any field missing, Next disabled
  - Editing: one field in edit mode

**Step 3: Choose Number of Skills**
- Radio buttons: 1 · 2 · 3 · 4 · 5 skills
- Selected by default: AI-suggested count (e.g., "We suggest 3 skills for this role")
- Button: "Next"
- **States:**
  - Default: AI suggestion selected
  - Custom: user selected different number
  - Loading: "Generating skill suggestions..."

**Step 4: Skills & Questions (Skill-by-Skill Editor)**
- For each skill:
  - Skill name (editable text field)
  - Button: "Add question", "Remove skill"
  - Questions under this skill (expandable list):
    - Each question is editable textarea
    - Button per question: "Edit", "Remove"
  - **Visual:** Skill card (collapsible, expandable)
- Button: "Add new skill" (if < 5 skills)
- Button: "Next"
- **States:**
  - Editing: fields are text inputs
  - Viewing: collapsed cards showing skill name + # of questions
  - Loading: "Generating questions..."
  - Error: "Failed to generate. Retry?"

**Step 5: Review & Finalize**
- Summary display (read-only):
  - Job Title, Level, Company
  - Skills: [Skill 1] (Q1, Q2, Q3), [Skill 2] (Q1, Q2), ...
  - Total questions: X
- Buttons: "Back to Edit", "Generate Link"
- **States:**
  - Ready: all data filled, Generate Link enabled
  - Generating: "Creating interview link..." spinner
  - Success: "Link created! Copy below:"
    - Display link (copyable): `https://interview.app/session/abc123xyz`
    - Button: "Copy to clipboard"
  - Error: "Failed to create link. Retry?"

### Screen 2: Candidate Interview (Chat Interface)

**URL:** `/interview/{SESSION_ID}`

**Layout:**
- Header: "Backend Engineer Interview" (job title from setup)
- Chat area (scrollable):
  - First message (AI): "Hi! I'll be interviewing you for the [Job Title] position. Let's get started. [First Question]"
  - Messages alternate: AI question → Candidate answer → AI follow-up (if any) → Candidate follow-up answer → AI next question
  - No visible: question number, skill name, attempt counter, progress bar
- Input area:
  - Textarea: "Your answer..."
  - Button: "Send"
  - Character count: "500 characters left"
- **States:**
  - Loading: "AI is thinking..." placeholder
  - Waiting for input: input field active, Send button enabled
  - Sending: "Sending..." spinner, Send button disabled
  - Error: "Connection lost. Retry?" + Retry button
  - End: "Thank you for this interview! Your results have been sent to HR."

### Screen 3: HR Admin — Interview List

**URL:** `/admin`

**Table columns:**
- Candidate name (or "Candidate {ID}" if anonymous)
- Date created
- Status: Setup / In Progress / Completed
- Last action time
- Action: Click row → Open review page

**States:**
- Empty: "No interviews yet. Create one to get started."
- Loading: Skeleton rows
- Error: "Failed to load interviews. Retry?"

### Screen 4: HR Review — Results Page

**URL:** `/review/{SESSION_ID}`

**Layout (Two-column):**

**Left column (Chat History):**
- Header: "Chat History"
- Messages in order:
  - Q1: [Question text]
  - A1: [Candidate answer]
  - Q1-Follow: [AI follow-up] (if any)
  - A1-Follow: [Candidate follow-up] (if any)
  - Q2: [Question text]
  - A2: [Candidate answer]
  - ... (all messages, no edits)
- Copy button: "Copy all chat"

**Right column (Rubric):**
- Header: "Evaluation Rubric"
- Table:
  | Skill Name | Score | Evidence |
  |---|---|---|
  | Problem-solving | 7/10 | Answered Q1 well, struggled with scalability concerns... |
  | Communication | 8/10 | Clear explanations, good examples provided... |
  | Technical Depth | 6/10 | Basic knowledge, limited depth on edge cases... |
- Export buttons:
  - "Export as PDF" (chat + rubric on same file)
  - "Export as CSV" (rubric only)

**States:**
- Loading: "Generating rubric..." spinner (while Qwen processes)
- Ready: Both columns visible
- Error: "Failed to generate rubric. Retry?"

---

## 4. Backend: API & Services

### API Endpoints

#### Setup Phase

**POST `/api/setup/parse-jd`**
- Input: `{ jd_text: string }`
- Output: `{ job_title: string, level: string, company: string }`
- Service: JD Parser (calls Qwen)
- Error: 400 (invalid input), 500 (API error)

**POST `/api/setup/suggest-skills`**
- Input: `{ jd_text: string, num_skills: number }`
- Output: `{ skills: [string] }`
- Service: Skills Suggestion (calls Qwen)
- Error: 400, 500

**POST `/api/setup/suggest-questions`**
- Input: `{ jd_text: string, skills: [string], job_title: string, level: string }`
- Output: `{ questions_by_skill: { [skill_name]: [string] } }`
- Service: Question Suggestion (calls Qwen)
- Error: 400, 500

**POST `/api/setup/create-session`**
- Input: `{ job_title: string, level: string, company: string, skills: [{ name: string, questions: [string] }] }`
- Output: `{ session_id: string, interview_link: string }`
- Service: Session Manager (saves to SQLite)
- Error: 400, 500

#### Interview Phase

**GET `/api/interview/{SESSION_ID}`**
- Output: `{ status: string, current_question_index: number, current_skill_index: number, message_history: [Message] }`
- Service: Session Manager (reads from SQLite)
- Error: 404 (session not found), 500

**POST `/api/interview/{SESSION_ID}/message`**
- Input: `{ candidate_answer: string }`
- Output: `{ ai_response: string, next_action: "follow_up" | "next_question" | "end_interview" }`
- Service: Interview Engine + AI Integration (calls Qwen)
- Error: 400, 404, 500

#### Review Phase

**GET `/api/review/{SESSION_ID}`**
- Output: `{ messages: [Message], rubric: Rubric }`
- Service: Session Manager + Rubric Generator
- Error: 404, 500

**POST `/api/review/{SESSION_ID}/export`**
- Input: `{ format: "pdf" | "csv" }`
- Output: File download (PDF or CSV)
- Service: Export Service
- Error: 400, 404, 500

---

## 5. Database Schema (SQLite)

### Table: sessions
```
session_id (TEXT PRIMARY KEY)
hr_email (TEXT)
job_title (TEXT)
level (TEXT)
company (TEXT)
skills (TEXT) -- JSON array stringified
questions_by_skill (TEXT) -- JSON object stringified: { "Skill1": ["Q1", "Q2"], "Skill2": ["Q1"] }
status (TEXT) -- "setup", "in_progress", "completed"
created_at (DATETIME)
started_at (DATETIME, nullable)
completed_at (DATETIME, nullable)
```

### Table: messages
```
message_id (INTEGER PRIMARY KEY AUTOINCREMENT)
session_id (TEXT FOREIGN KEY → sessions.session_id)
sender (TEXT) -- "ai" or "candidate"
content (TEXT)
skill_being_evaluated (TEXT, nullable)
question_index (INTEGER, nullable)
attempt_number (INTEGER, nullable)
created_at (DATETIME)
```

### Table: rubrics
```
rubric_id (INTEGER PRIMARY KEY AUTOINCREMENT)
session_id (TEXT FOREIGN KEY → sessions.session_id)
skill_name (TEXT)
score (FLOAT)
evidence (TEXT)
strengths (TEXT) -- JSON array stringified
weaknesses (TEXT) -- JSON array stringified
created_at (DATETIME)
```

---

## 6. Backend Services (Module Breakdown)

### Service 1: JD Parser
- Input: JD text
- Process: Call Qwen API with prompt: "Extract job title, level, company from this JD: {jd_text}"
- Output: Structured fields
- Error handling: Retry on timeout, fallback to default values

### Service 2: Skills Suggester
- Input: JD text + number of skills
- Process: Call Qwen API with prompt: "Suggest {num_skills} skills to evaluate for a {level} {job_title}"
- Output: Skill list
- Error handling: Retry on timeout, return empty list

### Service 3: Question Generator
- Input: JD text + skills + job_title + level
- Process: For each skill, call Qwen API: "Generate interview questions for evaluating {skill} in a {level} {job_title}"
- Output: Questions per skill (variable count, not fixed 3)
- Error handling: Retry on timeout, return generic questions

### Service 4: Interview Engine
- State machine: Track current_skill_index, current_question_index, attempt_count
- Logic:
  ```
  skill_idx = 0
  question_idx = 0
  
  while skill_idx < num_skills:
    attempt = 0
    while attempt < 3:
      attempt += 1
      // Send question to frontend
      // Wait for candidate answer
      // Call AI Evaluator
      if answer_good OR attempt == 3:
        question_idx += 1
        break
    
    if question_idx >= num_questions_in_skill:
      question_idx = 0
      skill_idx += 1
  
  // Interview complete
  ```
- Persistence: Save state to SQLite after each message

### Service 5: AI Integration (Interview Conductor)
- Input: Current question, previous answers, skill name, attempt number
- Process: Build system prompt + call Qwen API
- Output: AI response (with or without `[[ANSWER_GOOD]]` marker)
- Parsing: Check for marker to decide next action

**System Prompt Template:**
```
You are conducting an interview for a {job_title} position at {level} level.

Current Question: {question_text}
Skill Being Evaluated: {skill_name}
This is attempt {attempt_number} of 3.

Instructions:
1. Ask the question naturally, as if in conversation.
2. Wait for the candidate's answer.
3. Evaluate the answer:
   - Is it comprehensive and addresses the question fully? (good answer)
   - Is it vague, incomplete, or doesn't address the question? (poor answer)
4. If answer is good:
   - Acknowledge it positively.
   - End your response with: [[ANSWER_GOOD]]
5. If answer is poor AND attempt < 3:
   - Ask ONE follow-up: "Can you tell me more about [specific part]?"
6. If attempt = 3:
   - Thank the candidate for their response (don't mark as good).
   - Wait for backend to send next question.
```

### Service 6: Rubric Generator
- Input: Chat history + session metadata (skills)
- Process: For each skill, call Qwen API: "Analyze this chat history and score the {skill} on a 0-10 scale. Provide evidence from the chat."
- Output: Rubric (skill, score, evidence)
- Error handling: Retry on timeout, return empty rubric

### Service 7: Export Service
- PDF: Combine chat history + rubric into formatted PDF (use library like `pdfkit`)
- CSV: Export rubric table to CSV
- Error handling: Fallback to plain text if PDF generation fails

---

## 7. Error Handling & Edge Cases

| Scenario | Behavior |
|----------|----------|
| JD parsing fails | Show error message, let HR retry or skip extraction |
| Skill suggestion fails | Show error, suggest HR enter skills manually |
| Question generation fails | Show error, suggest HR enter questions manually |
| Candidate abandons interview | Session stays in "in_progress", HR can retry link |
| Candidate goes silent (no response for 5 min) | Frontend shows "You there?" prompt, auto-timeout after 15 min |
| AI refuses to answer (safety filter) | System prompt avoids triggering filters; if triggered, log and show "AI couldn't respond, please try rephrasing" |
| API timeout (Qwen doesn't respond in 30s) | Retry once; if still timeout, show error to user |
| SQLite locked (concurrent writes) | Retry with exponential backoff |
| Export fails | Show error, offer "Try again" button |

---

## 8. Success Criteria

**For HR:**
- [ ] Can create interview from JD in <3 minutes (Setup steps 1-5)
- [ ] Can view candidate results with chat history and rubric
- [ ] Can export to PDF and CSV

**For Candidate:**
- [ ] Can open link without login
- [ ] Chat feels natural (AI doesn't sound robotic)
- [ ] Doesn't see evaluation criteria, question numbers, or progress
- [ ] Gets completion confirmation

**For App:**
- [ ] Interview stays within 15 messages total (questions + follow-ups)
- [ ] Rubric scores reflect actual chat (evidence is accurate)
- [ ] No crashes or 500 errors
- [ ] All exports are readable and complete

---

## 9. Implementation Order (Dependency Graph)

1. **Setup Phase Services** (independent, can test with mock data)
   - JD Parser ✓ (depends on Qwen API only)
   - Skills Suggester ✓
   - Question Generator ✓
   - Session Manager ✓ (SQLite setup)

2. **Interview Phase** (depends on Session Manager)
   - Interview Engine ✓ (state machine)
   - AI Integration ✓ (depends on Qwen API + Interview Engine)

3. **Review Phase** (depends on Session Manager + Interview Engine)
   - Rubric Generator ✓ (depends on Qwen API + message history)
   - Export Service ✓

4. **Frontend** (depends on all backend services)
   - HR Setup screens ✓
   - Candidate Interview chat ✓
   - HR Review results ✓

---

## 10. Notes for Implementation

1. **API Key Storage:** `.env` file (never committed), loaded via `dotenv` package
2. **Qwen API:** Use `axios` or `node-fetch` for HTTP requests
3. **SQLite:** Use `better-sqlite3` or `sqlite3` package
4. **UI Library:** Keep it simple (vanilla HTML/CSS/JS or lightweight framework like Alpine.js)
5. **Testing:** Use fake data (fake JD, fake candidate answers) — never real CVs or personal info
6. **Logging:** Log important events (session created, interview started, error occurred) for debugging

---

**End of Implementation Spec**
