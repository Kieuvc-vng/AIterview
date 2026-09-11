# Spec: Browser Token - Persistence Layer

**Ngày:** 2026-09-10  
**Phương án:** Browser Token (localStorage + Database persistence)  
**Trạng thái:** Design phase  
**Mục đích:** Cho phép ứng viên resume phỏng vấn sau khi tắt tab/trình duyệt

---

## 📋 Tổng quan

### Problem
- Hiện tại: Tất cả state lưu trong RAM → mất khi refresh
- Ứng viên tắt tab → phải bắt đầu lại từ đầu
- HR không thể xem kết quả sau

### Solution
- Backend: Lưu session data & chat history trong Database
- Frontend: Lưu SESSION_ID trong localStorage
- Resume flow: Khi quay lại, frontend tự động load lại state từ DB

### Scope
- ✅ Implement session persistence (DB)
- ✅ Add localStorage tracking
- ✅ Resume interview from saved position
- ✅ Save chat history
- ✅ HR review existing sessions
- ❌ Multi-device sync (future)
- ❌ Permanent tokens (future)

---

## 🏗️ Architecture

### Database Schema

**1. Sessions Table**
```sql
CREATE TABLE sessions (
  session_id TEXT PRIMARY KEY,
  hr_email TEXT NOT NULL,
  candidate_name TEXT,
  job_title TEXT NOT NULL,
  level TEXT NOT NULL,
  company TEXT NOT NULL,
  skills TEXT NOT NULL,  -- JSON array
  questions_by_skill TEXT NOT NULL,  -- JSON object
  status TEXT DEFAULT 'setup',  -- setup, ongoing, completed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**2. Messages Table**
```sql
CREATE TABLE messages (
  message_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  sender TEXT NOT NULL,  -- 'ai' or 'candidate'
  content TEXT NOT NULL,
  skill_name TEXT,
  question_index INTEGER,
  attempt_number INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);
```

**3. Session State Table**
```sql
CREATE TABLE session_states (
  session_id TEXT PRIMARY KEY,
  current_skill_index INTEGER DEFAULT 0,
  current_question_index INTEGER DEFAULT 0,
  current_attempt INTEGER DEFAULT 1,
  interview_started_at TIMESTAMP,
  interview_completed_at TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);
```

**4. Rubrics Table**
```sql
CREATE TABLE rubrics (
  rubric_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  score INTEGER,  -- 0-10
  evidence TEXT,  -- JSON array of quotes/evidence
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);
```

---

## 🌐 Frontend Flow

### Phase 1: Setup (Steps 1-5)

**Step 1-5 (unchanged):**
- Dùng mock API
- Không cần localStorage
- Khi "Create Session" → Backend return SESSION_ID

**On Create Session Success:**
```javascript
const response = await fetch('/api/setup/create-session', {
  method: 'POST',
  body: JSON.stringify({
    hr_email, job_title, level, company, skills, questions_by_skill
  })
});

const {session_id} = await response.json();

// ← NEW: Lưu SESSION_ID vào localStorage
localStorage.setItem('current_interview_session', session_id);

// Redirect sang interview page
window.location.href = `/interview/${session_id}`;
```

### Phase 2: Interview Page Load

**Khi tải `/interview/{sessionId}`:**
```javascript
const InterviewPage = {
  async init(sessionId) {
    // 1. Check localStorage có SESSION_ID không
    const storedSessionId = localStorage.getItem('current_interview_session');
    
    if (!storedSessionId) {
      // Lần đầu - show "Enter candidate name" form
      this.showNameForm(sessionId);
      return;
    }
    
    if (storedSessionId !== sessionId) {
      // URL mismatch - show error
      this.showError('Session mismatch');
      return;
    }
    
    // 2. Fetch interview data từ backend
    try {
      const data = await this.fetchSessionData(sessionId);
      
      // 3. Hydrate state
      this.state = {
        sessionId: data.session.session_id,
        candidateName: data.session.candidate_name,
        jobTitle: data.session.job_title,
        messages: data.messages || [],
        currentSkill: data.current_position?.skill_index || 0,
        currentQuestion: data.current_position?.question_index || 0,
        currentAttempt: data.current_position?.attempt || 1
      };
      
      // 4. Render chat history
      this.renderChatHistory(this.state.messages);
      
      // 5. Show next question
      this.displayNextQuestion();
      
    } catch (error) {
      // Session không tìm thấy - treat as new
      this.showNameForm(sessionId);
    }
  },
  
  async fetchSessionData(sessionId) {
    const response = await fetch(`/api/interview/${sessionId}`);
    if (response.status === 404) {
      throw new Error('Session not found');
    }
    return await response.json();
  },
  
  async showNameForm(sessionId) {
    // Show input form
    // On submit: POST /api/interview/{sessionId}/start
    const candidateName = prompt('Your name:');
    const response = await fetch(`/api/interview/${sessionId}/start`, {
      method: 'POST',
      body: JSON.stringify({candidate_name: candidateName})
    });
    
    const data = await response.json();
    this.state = {sessionId, candidateName, messages: [data.opening_message], ...};
    this.renderChatHistory([data.opening_message]);
  }
};
```

### Phase 3: Submit Answer

**Khi ứng viên gõ câu trả lời:**
```javascript
async function submitAnswer(candidateMessage) {
  const sessionId = this.state.sessionId;
  
  // POST answer
  const response = await fetch(`/api/interview/${sessionId}/message`, {
    method: 'POST',
    body: JSON.stringify({candidate_message})
  });
  
  const {ai_response, next_action, next_question, interview_complete} = 
    await response.json();
  
  // Backend đã tự động lưu message vào DB
  // Frontend cập nhật UI
  this.addMessageToChat('candidate', candidateMessage);
  this.addMessageToChat('ai', ai_response);
  
  if (interview_complete) {
    this.showCompletionMessage();
    // Clear localStorage - phỏng vấn xong
    localStorage.removeItem('current_interview_session');
  } else if (next_question) {
    this.displayNextQuestion(next_question);
  }
}
```

### Key: Auto-save & Resume

```javascript
// ← Không cần localStorage khác
// ← Backend lưu tất cả vào DB
// ← Frontend chỉ cần lưu SESSION_ID

// Nếu ứng viên tắt tab:
// 1. localStorage vẫn còn SESSION_ID
// 2. Quay lại trang → fetch /api/interview/{sessionId}
// 3. Backend return tất cả messages + current position
// 4. Frontend render lại → tiếp tục
```

---

## 🖥️ Backend API Changes

### Endpoint 1: GET /api/interview/{sessionId}

**Purpose:** Fetch interview data (cho resume)

**Response:**
```json
{
  "session": {
    "session_id": "uuid",
    "candidate_name": "John Doe",
    "job_title": "Data Engineer",
    "level": "Mid",
    "company": "Tech Corp",
    "status": "ongoing"
  },
  "messages": [
    {
      "message_id": "msg1",
      "sender": "ai",
      "content": "Hello John...",
      "skill_name": "Python",
      "question_index": 0,
      "attempt_number": 1
    },
    {
      "message_id": "msg2",
      "sender": "candidate",
      "content": "I have 5 years...",
      "skill_name": "Python",
      "question_index": 0,
      "attempt_number": 1
    }
  ],
  "current_position": {
    "skill_index": 0,
    "question_index": 0,
    "attempt": 1
  }
}
```

### Endpoint 2: POST /api/interview/{sessionId}/start

**Purpose:** Start interview (set candidate name, send opening message)

**Request:**
```json
{
  "candidate_name": "John Doe"
}
```

**Response:**
```json
{
  "session": {...},
  "opening_message": "Hello John, welcome to the interview for Data Engineer...",
  "current_question": {
    "skill": "Python",
    "question": "Tell me about your experience with Python",
    "question_index": 0
  }
}
```

**DB Actions:**
```sql
-- Update session
UPDATE sessions SET 
  candidate_name = 'John Doe',
  status = 'ongoing'
WHERE session_id = '{sessionId}';

-- Update session_state
INSERT INTO session_states (session_id, interview_started_at)
VALUES ('{sessionId}', NOW());

-- Save opening message
INSERT INTO messages (...) VALUES (...)
```

### Endpoint 3: POST /api/interview/{sessionId}/message

**Purpose:** Process candidate answer, save to DB

**Request:**
```json
{
  "candidate_message": "I have 5 years of experience..."
}
```

**Response:**
```json
{
  "ai_response": "Great! Can you tell me more about...",
  "answer_good": true,
  "next_action": "next_question",  -- or "follow_up" or "end_interview"
  "next_question": {
    "skill": "SQL",
    "question": "Tell me about SQL experience",
    "question_index": 1
  },
  "interview_complete": false
}
```

**DB Actions:**
```sql
-- Save candidate message
INSERT INTO messages (session_id, sender, content, skill_name, ...)
VALUES ('{sessionId}', 'candidate', '...', 'Python', ...);

-- Save AI response
INSERT INTO messages (session_id, sender, content, skill_name, ...)
VALUES ('{sessionId}', 'ai', '...', 'Python', ...);

-- Update state if needed
UPDATE session_states SET 
  current_question_index = 1
WHERE session_id = '{sessionId}';
```

---

## 🔄 Review Flow

### GET /api/review/{sessionId}

**Response:**
```json
{
  "session": {...},
  "messages": [...all messages...],
  "rubric": [
    {
      "skill": "Python",
      "score": 8,
      "evidence": ["Good understanding of...", "Mentioned experience with..."]
    }
  ]
}
```

---

## 📊 Implementation Steps

### Phase 1: Database Schema (Step 1-2)
- [ ] Create 4 tables (sessions, messages, session_states, rubrics)
- [ ] Run migrations
- [ ] Test schema

### Phase 2: Backend Persistence (Step 3-5)
- [ ] Modify sessionManager to use DB instead of in-memory
- [ ] Update setupRoutes to save session to DB
- [ ] Implement GET /api/interview/{sessionId}
- [ ] Implement POST /api/interview/{sessionId}/start
- [ ] Implement POST /api/interview/{sessionId}/message with DB save

### Phase 3: Frontend Resume (Step 6-7)
- [ ] Add localStorage logic on create-session
- [ ] Add session-fetch on interview page init
- [ ] Handle resume flow (render chat history)
- [ ] Test: close tab → reopen → continue

### Phase 4: Review Flow (Step 8)
- [ ] Modify reviewRoutes to fetch from DB
- [ ] Implement GET /api/review/{sessionId}
- [ ] Test HR can see chat history

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] sessionManager CRUD operations
- [ ] Database queries return correct format
- [ ] Message saving and retrieval

### Integration Tests
- [ ] Setup flow → save to DB
- [ ] Start interview → save opening message
- [ ] Submit answer → save to DB & return state
- [ ] Resume interview → fetch from DB → render correctly

### E2E Tests
- [ ] HR creates session
- [ ] Candidate starts, answers 1 question, closes tab
- [ ] Candidate reopens tab → continue from question 2
- [ ] HR reviews → see all chat history
- [ ] HR exports PDF with full conversation

---

## ⚠️ Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Database query slow on resume | Add indexes on session_id, cache recent sessions |
| Concurrent writes from multiple attempts | Use transaction for message save + state update |
| localStorage cleared → can't resume | Show clear message, provide alternative (re-enter email to find session) |
| Session data corrupted | Add data validation, backup strategy |

---

## 🚀 Success Criteria

- ✅ Candidate can close tab mid-interview
- ✅ On reopening, interview resumes from exact position
- ✅ All chat history persisted
- ✅ HR can review complete conversation
- ✅ No data loss on page refresh
- ✅ Database load < 100ms for typical session

---

## 📌 Notes

- localStorage chỉ lưu SESSION_ID (simple, safe)
- Tất cả dữ liệu thật lưu ở backend (secure, persistent)
- Không cần login - chỉ cần link + localStorage tracking
- Future: có thể upgrade to Permanent Token (URL-based) sau
