# Design Document: Phỏng vấn với AI

**Date:** 2026-09-07  
**Project:** Vibe-Code Workshop - Group 1  
**Topic:** Phỏng vấn với AI (Interview with AI)  
**Author:** kieuvc@vng.com.vn

---

## 1. Objective

Build an app that allows HR to screen candidates by conducting AI-powered interviews. HR chooses 1-5 skills and writes questions for each skill → AI conducts interview following questions (with adaptive follow-ups) → Stops per question when: enough info OR 3 failed attempts → HR reviews results with chat history + skill-based rubric (scores + evidence).

**Core Value:** HR gets structured, fair candidate evaluations. Flexible per JD (different skills/questions). Interview auto-adapts based on answer quality.

---

## 2. User Personas

### HR (Interview Creator & Reviewer)
- Creates interview by uploading JD
- Customizes skills to evaluate
- Sends link to candidates
- Reviews results (chat history + rubric)

### Candidate (Interview Taker)
- Receives link from HR
- Doesn't see: skills being evaluated, level, expected score
- Just sees: chat interface with AI asking questions
- After done: sees "Thank you" message

---

## 3. High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│         INTERVIEW APP (Flexible Skills & Questions)      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  HR SETUP (Hidden)                                      │
│  ├─ Input JD                                            │
│  ├─ Auto-extract: Title, Level                          │
│  ├─ Choose # of skills (1-5)                            │
│  ├─ AI suggest questions per skill                      │
│  ├─ HR edit: skills, questions, model choice            │
│  └─ Generate interview link                             │
│                ↓                                         │
│  CANDIDATE INTERVIEW (Adaptive)                         │
│  ├─ For each Skill (1 to N):                            │
│  │  ├─ For each Question (1 to M):                      │
│  │  │  ├─ AI asks question                              │
│  │  │  ├─ Candidate answers                             │
│  │  │  ├─ AI evaluates answer quality                   │
│  │  │  ├─ If good/enough → Move to next Q               │
│  │  │  ├─ If poor → Follow-up (max 3 attempts)          │
│  │  │  └─ After 3 attempts or enough → Move to next Q   │
│  └─ No max limit (until all Q done)                     │
│                ↓                                         │
│  HR REVIEW                                              │
│  ├─ Chat history (all Q&A & follow-ups)                 │
│  ├─ Rubric: Score + Evidence per skill                  │
│  └─ Export PDF/CSV                                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Core Flows

### 4.1 HR Setup Flow

**Step 1: Input JD**
- HR pastes Job Description (any length)
- System receives and stores JD text

**Step 2: Auto-Extract & Edit Fields**
- AI parses JD → extracts Job Title, Level, Company
- HR reviews extracted fields
- HR can edit any field
- Fields saved to session

**Step 3: Choose # of Skills (1-5)**
- HR decides how many skills to evaluate
- Example: "I want to evaluate 2 skills for this role" OR "I need 4 skills"
- Default suggestion based on JD (but HR overrides)

**Step 4: Skills Setup & Question Template**
- AI suggests N skills based on JD and HR's choice
- For each skill, AI suggests questions (number varies per skill)
- Example:
  ```
  Skill 1: Problem-solving (HR chose 2 questions)
    Q1: Kể về 1 lần bạn xử lý incident khi traffic tăng đột ngột
    Q2: Bạn có thường thông qua Leader khi đưa ra quyết định không?
  
  Skill 2: Communication (HR chose 3 questions)
    Q1: Bạn giải thích concept phức tạp cho non-tech people thế nào?
    Q2: Bạn xử lý disagreement trong team như thế nào?
    Q3: Kể về lần bạn present ideas cho leadership
  
  Skill 3: Technical Depth (HR chose 2 questions)
    Q1: ...
    Q2: ...
  ```
- HR can: add/remove skills, edit questions, change # of questions per skill
- Questions saved to session

**Step 5: Finalize**
- HR reviews: fields, skills, questions per skill
- System uses: **Qwen 3.7 Plus** for interview & rubric
- Ready to generate link

**Step 6: Generate Link**
- System creates unique interview link
- Format: `/interview/{SESSION_ID}`
- HR copies link and sends to candidate

---

### 4.2 Candidate Interview Flow

**Entry:** Candidate opens link → sees welcome message + first question

**Interview Loop (Adaptive Per-Question Stopping):**

```
For each Skill (1 to N):
  For each Question (1 to M in that Skill):
    Attempt = 0
    Enough_info = false
    
    While Attempt < 3 AND NOT Enough_info:
      Attempt += 1
      
      AI asks: [Predefined Question]
      Candidate: [answers]
      
      AI evaluates answer:
        IF answer_comprehensive OR answer_good:
          Enough_info = true
          → Move to next Question
        
        ELSE IF answer_vague OR incomplete:
          IF Attempt < 3:
            AI follow-up: "Can you tell me more about X?"
            Candidate: [answers follow-up]
          ELSE (Attempt = 3):
            AI: "Thanks for that perspective."
            → Move to next Question

After all Skills & Questions completed:
Interview ends
Show candidate: "Thank you, results sent to HR"
```

**Key Points:**
- HR-defined questions (not fixed 3 per skill, flexible per role)
- Adaptive per-question: AI asks follow-ups until enough info OR 3 attempts
- Stops naturally when question answered well, not based on time limit
- No max total questions (follows all questions until done)
- Candidate doesn't see: which skill, question number, attempt counter, evaluation criteria
- Interview length varies per candidate (thorough for good answers, quicker for clear answers)
- Feels natural conversation (AI adapts based on answer quality)

---

### 4.3 HR Review Flow

**After interview completes:**

1. System analyzes chat history
2. For each skill: Extract evidence + assign score
3. Generate rubric (3 rows = 3 skills)
4. HR opens results:
   - Full chat history (Q1, A1, Q2, A2, ...)
   - Rubric table:
     ```
     Skill          | Score | Evidence from Chat
     ─────────────────────────────────
     [Skill 1]      | 7/10  | Answered Q1, Q2 well but struggled with...
     [Skill 2]      | 8/10  | Clearly explained... good examples...
     [Skill 3]      | 5/10  | Limited examples, needs improvement...
     ```
   - Export buttons (PDF / CSV)

5. HR admin page: List all interviews, click to view any

---

## 5. Data Model

### Session Schema
```
{
  session_id: String (unique),
  hr_email: String,
  
  // Setup
  jd_text: String,
  job_title: String,
  level: String (Junior/Mid/Senior),
  company: String (optional),
  skills: [String] (3 skills),
  questions: [Question] (9 questions, 3 per skill),
  model_choice: String (Qwen/Claude),
  
  // Interview state
  status: String (setup/in_progress/completed),
  created_at: Date,
  started_at: Date (nullable),
  completed_at: Date (nullable),
  
  // Interview data
  messages: [Message],
  current_question_index: Int (0-8),
  total_messages: Int,
  
  // Results
  rubric: Rubric (nullable)
}
```

### Question Schema
```
{
  question_id: Int (0-8),
  skill_name: String,
  question_text: String,
  order: Int (1-3 within skill)
}
```

### Message Schema
```
{
  question_number: Int,
  question_text: String,
  answer_text: String,
  skill_being_evaluated: String,
  timestamp: Date,
  
  // Internal
  ai_decision: String (optional) // "stay_on_skill" or "move_to_next"
}
```

### Rubric Schema
```
{
  session_id: String,
  
  skill_evaluations: [
    {
      skill_name: String,
      score: Float (0-10),
      evidence: String, // "Evidence: Q2 showed... Q5 demonstrated..."
      strengths: [String],
      weaknesses: [String],
      questions_asked: [Int] // [1, 2, 5, 7]
    }
  ],
  
  overall_notes: String,
  generated_at: Date
}
```

---

## 6. Interview Engine Logic

### How AI Evaluates Answer Quality & Decides Follow-ups

**System Prompt Structure:**

```
You are conducting a structured interview for a [Job Title] position.

Current Question:
[Question Text]

Skill Being Evaluated: [Skill Name]
This is attempt [N] for this question (max 3).
Previous attempts: [A1, A2, ...]

Your task:
1. Ask the exact question above
2. Wait for candidate's answer
3. Evaluate answer quality:
   - Is it comprehensive/detailed? (good answer → move to next Q)
   - Is it vague/incomplete? (poor answer → follow-up if attempt < 3)
4. If answer is good:
   Output: "[[ANSWER_GOOD]]" at end (so backend knows)
5. If answer is vague AND attempt < 3:
   Ask ONE follow-up: "Can you tell me more about X?"
6. If attempt = 3:
   Accept answer and wait for backend to send next question

Example:
Good answer: "I designed a microservices system handling... [[ANSWER_GOOD]]"
Poor answer: "I've worked on some projects" → "Can you tell me about the largest one?"
```

**Backend Logic:**
- Maintain `attempt_count` (1-3) per question
- After candidate answers, parse response for `[[ANSWER_GOOD]]`
- If found OR attempt = 3: Increment to next question
- If not found AND attempt < 3: Increment attempt, send follow-up prompt

### Per-Question Adaptive Logic

```
current_skill_index = 0
current_question_index = 0

While current_skill_index < num_skills:
  attempt = 0
  enough_info = false
  
  While attempt < 3 AND NOT enough_info:
    attempt += 1
    
    Backend sends: current_question with attempt count
    AI asks question
    Candidate answers
    
    Backend parses response:
      IF "[[ANSWER_GOOD]]" found OR attempt = 3:
        enough_info = true
        current_question_index += 1
        
        IF current_question_index >= num_questions_in_skill:
          current_question_index = 0
          current_skill_index += 1
      ELSE:
        Send follow-up prompt to AI

Interview ends when all skills & questions completed
```

**Key Points:**
- Flexible questions: HR defines number per skill (not fixed 3)
- Adaptive follow-ups: Max 3 attempts per question
- Smart stopping: Moves when enough info OR hits attempt limit
- No max total (follows all questions, length varies per candidate)
- Natural flow: Follows question order but adapts based on answer quality

---

## 7. Tech Components (High-Level)

### Backend Services

1. **JD Parser Service**
   - Input: JD text
   - Output: Job Title, Level, Company
   - Tech: **Qwen 3.7 Plus API**

2. **Skills Suggestion Service**
   - Input: JD + extracted fields
   - Output: N skill suggestions (1-5 per HR choice)
   - Tech: **Qwen 3.7 Plus API**

2.5 **Question Suggestion Service**
   - Input: JD, skills, extracted fields
   - Output: Questions per skill (variable per skill)
   - Tech: **Qwen 3.7 Plus API**
   - Example prompt: "Generate interview questions for [Skill] to evaluate a [Level] candidate for [Job Title]. Questions should be..."

3. **Interview Session Service**
   - Create session, generate link
   - Store/retrieve session data
   - Update session state

4. **Interview Engine Service**
   - Manage interview state machine
   - Track current skill, question count
   - Decide when to move skills or stop

5. **AI Integration Service**
   - Build system prompt (with current question + context)
   - Call **Qwen 3.7 Plus API**
   - Parse response (check if `[[ANSWER_GOOD]]` marker or attempt = 3)

6. **Rubric Generator Service**
   - Analyze chat history post-interview
   - Call **Qwen 3.7 Plus API** to generate scores + evidence per skill
   - Extract and structure results

7. **Export Service**
   - Generate PDF (chat history + rubric)
   - Generate CSV (rubric only)

### Frontend Components

1. **HR Setup Page (Multi-step)**
   - Step 1: JD input textarea
   - Step 2: Fields display + edit buttons
   - Step 3: Skills list + edit buttons
   - Step 4: Questions display + edit interface
     - AI-generated template shown
     - HR can edit, add, remove questions
     - Visual: Skill 1 (Q1, Q2, Q3) | Skill 2 (Q1, Q2, Q3) | Skill 3 (Q1, Q2, Q3)
   - Step 5: Model dropdown + Review + "Generate Link" button

2. **Candidate Interview Page**
   - Chat display (Q/A in conversation format)
   - Current question shown naturally (not "Question 1 of 9")
   - Input field for candidate + Send button
   - No visible indicators of: skill name, score, question count, progress

3. **HR Admin Dashboard**
   - Interview list (table: candidate name, date, status, skill scores preview)
   - Click row → Interview Detail page
   - Chat history (Q1, A1, Q2, A2, ...) chronological display
   - Rubric display (3 rows for 3 skills with scores + evidence)
   - Export buttons (PDF / CSV)

### Database

- Store: Session, Messages, Rubric
- Index: session_id, hr_email, created_at
- Query patterns: Get by session, Get by HR, Pagination

---

## 8. Key Constraints & Decisions

| Constraint | Decision | Reasoning |
|-----------|----------|-----------|
| Skills | Flexible 1-5 (HR chooses per role) | Adapt to different role complexity |
| Questions per Skill | HR-defined (varies per skill) | HR optimizes per skill importance |
| Q per Candidate | Varies (adaptive per answer quality) | Efficient: thorough when needed, quick when clear |
| Max Total Questions | No hard max (follows all Q until done) | Focus on quality over speed |
| Stopping Logic | Per-question: 3 attempts OR enough_info | Natural: stops when answer is good OR tries exhausted |
| Question Source | HR writes (AI suggests template) | Ensures quality, consistency, fairness |
| AI Flexibility | Adaptive follow-ups (up to 3 per Q) | Natural conversation + quality-driven |
| Candidate Visibility | Only chat + no evaluation criteria | Prevents gaming, natural feel |
| Rubric Visibility | HR only | Protects candidate privacy |
| LLM Model | **Qwen 3.7 Plus** (all phases) | All: setup, interview, rubric generation |
| Fairness | Same questions per candidate (per role) | Easy to compare within same role |

---

## 9. Success Criteria

**For HR:**
- [ ] Can upload JD and customize in <2 minutes
- [ ] Receives unique shareable link
- [ ] Can view candidate results: chat + rubric
- [ ] Can export results to PDF/CSV

**For Candidate:**
- [ ] Can open link without login
- [ ] Chat feels natural (not robot-like)
- [ ] Doesn't see evaluation criteria
- [ ] Gets completion confirmation

**For App:**
- [ ] Interview stays within 15 questions
- [ ] AI doesn't "drift" from skill context
- [ ] Rubric reflects actual chat (evidence is accurate)
- [ ] No errors/crashes during interview
- [ ] Export files are readable & complete

---

## 10. Out of Scope (Tuần 2+)

- User authentication for HR (MVP: share link = access)
- Multiple interviewers reviewing same candidate
- Custom scoring rubric per company
- Live monitoring / admin override
- Analytics dashboard
- Candidate feedback form
- Integration with HR systems (ATS, etc.)
- Scheduling/calendar integration
- Bulk interview creation
- Interview retakes / revisions

---

## 11. Notes for Implementation

1. **System Prompt Quality is Critical**
   - Needs to balance: natural conversation + skill evaluation
   - Must clearly instruct on `[[SKILL_SATISFIED]]` marker
   - Test with multiple candidates to refine

2. **Persona Consistency Risk**
   - 15 questions is safer than unlimited
   - Monitor: Does AI stay in character?
   - If persona drifts: Tighten system prompt

3. **Edge Cases to Handle**
   - Candidate goes silent / doesn't respond
   - Candidate tries to game system
   - AI refuses to answer (safety filters)
   - API timeout
   - Session timeout

4. **Scoring Logic (TBD)**
   - How to score: 0-10 scale? A-F grades? Rubric points?
   - How to use evidence to justify score?
   - Define before coding rubric generator

---

## 12. Appendix: Example Interview Flow

**Setup (HR does):**
- Paste JD: "Backend Engineer, Mid-level"
- Skills: [System Design, Communication, Problem-solving] (auto-suggested, HR approves)
- Questions (AI suggests template, HR approves):
  ```
  System Design:
    Q1: Describe your largest system design project. What was the scope and architecture?
    Q2: How did you approach scalability and performance optimization?
    Q3: What was the most challenging technical problem you encountered, and how did you solve it?
  
  Communication:
    Q1: Tell me about a time you had to explain a complex technical concept to non-technical stakeholders.
    Q2: How do you handle disagreements within your team when you believe your approach is better?
    Q3: Can you share an example of when you had to present your ideas or findings to leadership?
  
  Problem-solving:
    Q1: Walk me through your approach to debugging a critical production issue.
    Q2: How do you balance speed and quality when you're under time pressure?
    Q3: Describe a situation where your initial approach didn't work. How did you adapt?
  ```
- Model: Qwen 3.7 Plus
- HR generates link: `https://interview.app/session/abc123`

**Interview (Candidate Sees):**
```
AI: Hi! I'll be interviewing you for the Backend Engineer position. Let's get started.
    Describe your largest system design project. What was the scope and architecture?

Candidate: I designed a microservices platform for payment processing. It had 5 main services...

AI: That's interesting. How did you handle service-to-service communication and ensure reliability?

Candidate: We used async messaging with RabbitMQ and implemented circuit breakers...

AI: [Moves to next question]

AI: How did you approach scalability and performance optimization?

Candidate: For scalability, we implemented horizontal scaling with load balancing...

[... continues with Q3, then moves to Communication skill ...]

[After all 9 questions + optional follow-ups, stays within 15 messages]

AI: Thank you for this interview. I've really appreciated your detailed responses.

Candidate Sees: "Interview complete! Your results have been sent to HR."
```

**HR Sees (Results):**
```
Chat History:
Q1: Describe your largest system design project. What was the scope and architecture?
A1: I designed a microservices platform for payment processing...

Q1-Followup: How did you handle service-to-service communication?
A1-Followup: We used async messaging with RabbitMQ...

Q2: How did you approach scalability and performance optimization?
A2: For scalability, we implemented horizontal scaling...

[... all 9 questions + follow-ups, total <= 15 messages]

Rubric:
| Skill            | Score | Evidence from Chat                                              |
|------------------|-------|---------------------------------------------------------------|
| System Design    | 8/10  | Q1-Q3: Demonstrated solid architecture knowledge, good grasp   |
|                  |       | of scalability concerns, mentioned concrete patterns           |
|                  |       | (microservices, async messaging, circuit breakers)            |
|                  |       |                                                                |
| Communication    | 7/10  | Q4-Q6: Explained concepts clearly, provided good examples,     |
|                  |       | but answers were somewhat lengthy could be more concise       |
|                  |       |                                                                |
| Problem-solving  | 6/10  | Q7-Q9: Basic problem-solving approach, showed adaptation but   |
|                  |       | lacked depth in edge cases and preventive thinking            |

[Export to PDF / CSV]
```

---

**End of Design Document**
