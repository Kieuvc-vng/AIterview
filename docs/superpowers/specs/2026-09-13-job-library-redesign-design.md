# Thiết Kế Lại Job Library & Tóm Tắt Câu Trả Lời

**Ngày:** 13/09/2026  
**Project:** App AIterview  
**Tác giả:** Kiểu + Tiến + Claude  
**Phương án:** Thiết kế lại Database (Phương án B)

---

## 1. Tóm Tắt

Thiết kế lại app AIterview để hỗ trợ:
1. **Thư Viện Job** — Lưu template job (lần 1), dùng lại cho nhiều ứng viên
2. **Quản Lý Ứng Viên** — Tạo link phỏng vấn riêng cho từng ứng viên
3. **Tóm Tắt Câu Trả Lời** — AI tóm tắt (thay vì chấm điểm)

**Vấn đề hiện tại:** Mỗi lần phỏng vấn phải nhập lại job info (tên job, skills, câu hỏi).  
**Giải pháp:** Tách job template ra khỏi phiên phỏng vấn.

---

## 2. Cơ Sở Dữ Liệu (5 Bảng)

### 2.1 Bảng JOBS (Template Job)
Lưu job một lần, dùng lại cho nhiều ứng viên.

```sql
CREATE TABLE jobs (
  job_id TEXT PRIMARY KEY,
  job_title TEXT NOT NULL,              -- Tên vị trí
  level TEXT NOT NULL,                  -- Cấp độ (Junior/Mid/Senior)
  company TEXT NOT NULL,                -- Tên công ty
  description TEXT,                     -- Mô tả công việc (NEW)
  skills TEXT NOT NULL,                 -- JSON: ["Python", "SQL", ...]
  questions_by_skill TEXT NOT NULL,     -- JSON: {Python: [câu1, câu2], ...}
  created_by TEXT NOT NULL,             -- Email của HR
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2.2 Bảng CANDIDATES (Ứng Viên)
Lưu thông tin ứng viên cho mỗi job.

```sql
CREATE TABLE candidates (
  candidate_id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,                 -- Link đến JOBS
  name TEXT NOT NULL,                   -- Tên ứng viên
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(job_id)
);
```

### 2.3 Bảng INTERVIEWS (Phiên Phỏng Vấn)
Một phiên phỏng vấn = 1 ứng viên + 1 job.

```sql
CREATE TABLE interviews (
  interview_id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,                 -- Link đến JOBS
  candidate_id TEXT NOT NULL,           -- Link đến CANDIDATES
  status TEXT DEFAULT 'setup',          -- setup / active / completed
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(job_id),
  FOREIGN KEY (candidate_id) REFERENCES candidates(candidate_id)
);
```

### 2.4 Bảng MESSAGES (Tin Nhắn Chat)
Lưu tất cả tin nhắn trong phỏng vấn.

```sql
CREATE TABLE messages (
  message_id TEXT PRIMARY KEY,
  interview_id TEXT NOT NULL,           -- Link đến INTERVIEWS
  sender TEXT NOT NULL,                 -- 'candidate' hay 'interviewer'
  content TEXT NOT NULL,                -- Nội dung tin nhắn
  skill_name TEXT,                      -- Kỹ năng được hỏi
  question_index INTEGER,               -- Câu hỏi thứ mấy
  attempt_number INTEGER,               -- Lần trả lời thứ mấy
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (interview_id) REFERENCES interviews(interview_id)
);
```

### 2.5 Bảng SUMMARIES (Tóm Tắt Câu Trả Lời) — MỚI
AI tóm tắt câu trả lời của ứng viên (thay vì chấm điểm).

```sql
CREATE TABLE summaries (
  summary_id TEXT PRIMARY KEY,
  interview_id TEXT NOT NULL,           -- Link đến INTERVIEWS
  skill_name TEXT NOT NULL,             -- Kỹ năng
  question_index INTEGER NOT NULL,      -- Câu hỏi thứ mấy
  question_text TEXT NOT NULL,          -- Nội dung câu hỏi
  main_answer_summary TEXT,             -- Tóm tắt câu trả lời chính
  followup_summary TEXT,                -- Tóm tắt phần follow-up (nếu có)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (interview_id) REFERENCES interviews(interview_id)
);
```

**Migration:** Archive/xóa bảng cũ (SESSIONS, SESSION_STATES, RUBRICS).

---

## 3. API Endpoints (Mới & Cập Nhật)

### Phase 1: Setup (Tạo Job Template)
- `POST /setup/parse-jd` — Parse job từ JD
- `POST /setup/suggest-skills` — AI suggest skills (HR có thể thêm/sửa/xóa)
- `POST /setup/generate-questions` — Sinh câu hỏi per skill
- `POST /jobs` **[MỚI]** — Lưu job vào thư viện

### Phase 2: Gửi cho Ứng Viên
- `GET /jobs` **[MỚI]** — Danh sách jobs trong thư viện
- `GET /jobs/:job_id` **[MỚI]** — Chi tiết job
- `POST /candidates` **[MỚI]** — Tạo candidate record
- `POST /interviews` **[MỚI]** — Tạo phiên phỏng vấn (sinh link)

### Phase 3: Phỏng Vấn
- `GET /interviews/:interview_id` — Lấy session phỏng vấn
- `POST /interviews/:interview_id/start` — Bắt đầu phỏng vấn
- `POST /interviews/:interview_id/message` — Gửi/nhận tin nhắn
- `POST /summaries` **[MỚI]** — Lưu tóm tắt (sau mỗi câu hỏi)

### Phase 4: Xem Kết Quả
- `GET /jobs/:job_id/candidates` **[MỚI]** — Danh sách ứng viên per job
- `GET /summaries/:interview_id` **[MỚI]** — Xem tóm tắt của ứng viên
- `POST /export/pdf` — Cập nhật (dùng summaries thay vì rubrics)
- `POST /export/csv` — Cập nhật (dùng summaries thay vì rubrics)

---

## 4. Giao Diện (3 Trang)

### Trang 1: Thư Viện Job
**URL:** `/library`  
**Hiển thị:**
- Danh sách jobs đã lưu
- Tên job, cấp độ, công ty
- Số lượng skills
- Số lượng ứng viên đã phỏng vấn
- Nút: "Gửi cho Ứng Viên", "Chỉnh Sửa"

### Trang 2: Gửi cho Ứng Viên (Modal Popup)
**Kích hoạt:** Click "Gửi cho Ứng Viên" ở Trang 1  
**Form:**
- Tên ứng viên
- Email
- Số điện thoại
- Nút: "Tạo Link"

**Kết quả:** Tạo CANDIDATE + INTERVIEW record, sinh link độc nhất (browser token), hiển thị link để HR copy/send.

### Trang 3: Xem Kết Quả
**URL:** `/review/jobs/:job_id`  
**Layout:** Hybrid (mặc định tóm tắt, có nút mở rộng xem full chat)

**Mỗi ứng viên:**
- Tên, email, trạng thái
- **Phần Tóm Tắt (Thu gọn):**
  - Hiển thị main_answer_summary + followup_summary cho mỗi câu
  - Nút: "Mở Rộng Chat" để xem toàn bộ cuộc trò chuyện
- **Phần Chat Mở Rộng:**
  - Lịch sử tin nhắn đầy đủ
- **Actions:** Export PDF, Export CSV

---

## 5. Services (Mới & Bỏ)

### Service Mới: summaryGenerator.js
**Mục đích:** Tóm tắt câu trả lời bằng AI sau mỗi câu hỏi.

**Input:**
- interview_id
- skill_name
- question_index
- Tất cả tin nhắn liên quan (câu trả lời chính + follow-ups)
- question_text

**Quy trình:**
1. Lấy tất cả tin nhắn cho câu hỏi này
2. Gọi AI (với prompt tóm tắt)
3. Parse kết quả → main_answer_summary, followup_summary
4. Lưu vào bảng SUMMARIES

**System Prompt ví dụ:**
```
Tóm tắt câu trả lời của ứng viên thành 1-2 dòng.
Tập trung vào những kỹ năng và kinh nghiệm chính được đề cập.
Giữ ngắn gọn và trung thực với thực tế.
```

### Service Bỏ: rubricGenerator.js
**Lý do:** Không cần nữa (chuyển từ chấm điểm sang tóm tắt).

### Services Cập Nhật:
- `questionGenerator.js` — Không đổi
- `aiIntegration.js` — Bỏ logic chấm điểm, giữ lại phần follow-up
- `exportService.js` — Cập nhật để lấy SUMMARIES thay vì RUBRICS

---

## 6. Browser Token & Quản Lý Session

**Cơ chế:** Browser token lưu interview_id trong localStorage.  
**Phạm vi:** 1 device duy nhất (nếu mở link từ device khác = session mới).  
**Persistence:** Tồn tại qua F5, xóa khi user clear storage.

---

## 7. Kế Hoạch Migration (Schema Cũ → Mới)

**Bước 1:** Tạo bảng mới (jobs, candidates, interviews, summaries)

**Bước 2:** Migrate data:
```
SESSIONS (cũ) → Extract unique (job_title, level, company) → JOBS
SESSIONS (cũ) → Extract candidate_name → CANDIDATES (link đến JOBS)
SESSIONS (cũ) → Rename thành INTERVIEWS (cập nhật FK)
```

**Bước 3:** Migrate MESSAGES (rename FK: session_id → interview_id)

**Bước 4:** Xóa/Archive bảng RUBRICS

**Bước 5:** Archive/xóa bảng SESSIONS, SESSION_STATES

**Testing:** Đảm bảo phiên phỏng vấn cũ vẫn chạy được.

---

## 8. Cấu Hình Model LLM

**3 Model Slots (cấu hình trong .env):**

| Phase | Slot | Config |
|-------|------|--------|
| Setup | 1 chính | `SETUP_MODEL` |
| Interview | 1 chính + 1 backup | `INTERVIEW_MODEL`, `INTERVIEW_MODEL_BACKUP` |
| Summarization | 1 chính + 1 backup | `SUMMARY_MODEL`, `SUMMARY_MODEL_BACKUP` |

**Cách làm:**
- Mỗi service (setup, interview, summary) nhận config model
- Nếu model chính fail → dùng backup
- File .env có template với placeholder values
- **Không hardcode API keys** — tất cả trong .env (không commit)

---

## 9. Xử Lý Lỗi & Edge Cases

### Phỏng vấn bị ngắt
- Browser token mất? User mở lại link → fetch data từ backend
- Backend lưu toàn bộ state phỏng vấn (tin nhắn, câu hỏi hiện tại)

### AI service fail
- Tóm tắt fail? Log error, bỏ qua, tiếp tục phỏng vấn
- User có thể tóm tắt thủ công khi xem kết quả (future feature)

### Nhiều ứng viên cho 1 job
- Mỗi ứng viên = 1 interview_id riêng (via browser token)
- Đảm bảo riêng tư/isolation

### Export (PDF/CSV)
- Cập nhật để lấy SUMMARIES, không phải RUBRICS
- Include main_answer_summary + followup_summary

---

## 10. So Sánh: Flow Cũ vs. Flow Mới

### Flow Cũ (Hiện Tại)
```
HR Upload JD → Suggest Skills → Sinh Câu Hỏi → Tạo Session
→ Ứng Viên Phỏng Vấn → AI Chấm Điểm (Rubric) → Export Kết Quả
[Vấn đề: Job info không tái sử dụng; chấm điểm bị loại bỏ]
```

### Flow Mới (Đề Xuất)
```
Phase 1: HR Upload JD → Suggest Skills → Sinh Câu Hỏi → LƯU VÀO THƯ VIỆN
Phase 2: HR Chọn Job → Nhập Info Ứng Viên → Sinh Link Độc Nhất
Phase 3: Ứng Viên Phỏng Vấn → AI Tóm Tắt → Export Kết Quả (Tóm Tắt)
[Lợi ích: Job tái sử dụng, link riêng per ứng viên, kết quả đơn giản]
```

---

## 11. Tiêu Chí Thành Công

✅ HR có thể tạo job template 1 lần, dùng lại cho nhiều ứng viên  
✅ Mỗi ứng viên nhận link phỏng vấn độc nhất (browser token, 1 device)  
✅ AI sinh tóm tắt sau mỗi câu hỏi  
✅ Trang review hiển thị tóm tắt (có thể mở rộng xem full chat)  
✅ Cấu hình model flexible (có thể swap LLM provider)  
✅ Migration bảo tồn data phỏng vấn cũ  
✅ Export PDF/CSV hoạt động với summaries  

---

## 12. Mở Rộng Tương Lai (Ngoài Scope)

- Chấm điểm dựa trên rubric (nếu cần sau)
- Phỏng vấn multi-device (cần sync backend)
- Tích hợp ATS (sau Phase 1 launch)
- Quản lý pipeline ứng viên (feature tương lai)

---

## 13. Ghi Chú Implement

**Thời gian dự tính:** 4-5 ngày  
**Thứ tự:** Phase 1 (Setup) → Phase 2 (Send) → Phase 3 (Interview) → Phase 4 (Review)  
**Testing:** Unit tests cho mỗi service mới, integration tests cho flow toàn bộ  
**Tài liệu:** API docs, frontend component guide, migration runbook