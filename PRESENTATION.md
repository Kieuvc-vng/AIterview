# 📋 THUYẾT TRÌNH: ỨNG DỤNG AI PHỎNG VẤN ỨNG VIÊN

**Thành viên:** Kiểu + Tiến  
**Ngày:** 23/09/2024  
**Trạng thái:** MVP hoàn chỉnh - sẵn sàng demo

---

## 📌 PHẦN 1: SƠ ĐỒ & CẤU TRÚC APP

### 1.1 So sánh: Thiết kế ban đầu vs Hiện tại

#### **Thiết kế ban đầu (Mục tiêu ban đầu)**

```
Luồng đơn giản:
  1. HR → Input JD
  2. Auto-extract thông tin (công ty, vị trí, kỹ năng)
  3. Chọn 1-5 kỹ năng
  4. AI tạo câu hỏi
  5. Gửi link phỏng vấn cho ứng viên
  6. Ứng viên trả lời câu hỏi
  7. AI đánh giá (score + evidence)
  8. HR xem kết quả
```

**Điểm chính:** 1 công việc = 1 session phỏng vấn

---

#### **Hiện tại: Có thêm Job Library (Thư viện công việc)**

```
Luồng mở rộng:

┌─────────────────────────────────────────────┐
│      TRANG CHỦ: JOB LIBRARY (Thư viện)      │
├─────────────────────────────────────────────┤
│ • Danh sách tất cả công việc                 │
│ • Mỗi job có 4 nút: Xem ứng viên / Thêm    │
│   ứng viên / Chỉnh sửa / Xóa                │
└─────────────────────────────────────────────┘
              ↓ Click "+ Tạo Job Mới"
┌─────────────────────────────────────────────┐
│      TRANG SETUP: Tạo công việc              │
├─────────────────────────────────────────────┤
│ Step 1: Dán JD (auto-extract công ty)       │
│ Step 2: Xác nhận chi tiết (job title, level)│
│ Step 3: Chọn & quản lý kỹ năng (1-5)        │
│ Step 4: Tạo câu hỏi (AI suggest + edit)     │
│ Step 5: Lưu công việc vào thư viện          │
└─────────────────────────────────────────────┘
              ↓ Job lưu thành công
┌─────────────────────────────────────────────┐
│   JOB DETAIL: Chi tiết công việc             │
├─────────────────────────────────────────────┤
│ • JD, Level, Skills, Questions               │
│ • Danh sách ứng viên (được thêm)            │
│ • Mỗi ứng viên: status, link, "Xem kết    │
│   quả" button                                │
└─────────────────────────────────────────────┘
              ↓ Click "Thêm Ứng Viên"
┌─────────────────────────────────────────────┐
│   FORM THÊM ỨNG VIÊN: Tên, Email           │
├─────────────────────────────────────────────┤
│ • Tạo link phỏng vấn duy nhất                │
│ • Copy link / Gửi email cho ứng viên        │
│ • Lưu ứng viên vào database                 │
└─────────────────────────────────────────────┘
              ↓ Ứng viên nhận link
┌─────────────────────────────────────────────┐
│   INTERVIEW PAGE: Ứng viên trả lời           │
├─────────────────────────────────────────────┤
│ • Adaptive chatbot (AI hỏi, ứng viên đáp)   │
│ • Max 3 lần chỉnh câu trả lời                │
│ • Tự động chuyển sang câu hỏi kế tiếp        │
│ • Khi hết câu hỏi → "Cảm ơn"                │
└─────────────────────────────────────────────┘
              ↓ (Auto-generate evaluations)
┌─────────────────────────────────────────────┐
│   REVIEW PAGE: HR xem kết quả                │
├─────────────────────────────────────────────┤
│ • Thông tin phỏng vấn (tên, vị trí, kỹ năng)│
│ • Rubric: Điểm + Nhận xét (mỗi kỹ năng)     │
│ • Lịch sử chat (toàn bộ Q&A)                │
│ • Edit evaluations + Export PDF/CSV          │
└─────────────────────────────────────────────┘
```

---

### 1.2 Tính năng mới so với thiết kế ban đầu

| Tính năng | Ban đầu | Hiện tại | Ghi chú |
|-----------|---------|---------|---------|
| **Job Library** | ❌ | ✅ | Quản lý nhiều công việc cùng lúc |
| **Candidate Management** | ❌ | ✅ | Thêm/xóa/xem ứng viên per job |
| **Edit Job** | ❌ | ✅ | Chỉnh sửa job (JD, skills, questions) |
| **Auto-generate Evaluations** | ❌ | ✅ | AI tự đánh giá từng skill |
| **Edit Evaluations** | ❌ | ✅ | HR chỉnh sửa đánh giá trước export |
| **Separate Candidate/HR Views** | ❌ | ✅ | Ứng viên chỉ thấy "Cảm ơn", HR thấy full review |
| **Persistent Database** | ❌ | ✅ | SQLite lưu jobs, candidates, interviews |
| **Link Tracking** | ❌ | ✅ | Theo dõi "Đã gửi link" status |
| **Export PDF/CSV** | ✅ | ✅ | Xuất kết quả |

---

### 1.3 Các trang trong app

**1. Job Library** (`/library.html`) - Trang chủ
- Danh sách tất cả jobs
- Nút: Xem ứng viên / Thêm ứng viên / Chỉnh sửa / Xóa
- Status: Job tạo ngày nào, lần cuối chỉnh ngày nào

**2. Setup Page** (`/index.html`) - Tạo/Chỉnh sửa job
- 5 bước: JD → Chi tiết → Skills → Questions → Lưu
- Có chế độ "Edit Mode" khi chỉnh sửa job cũ

**3. Job Detail** (`/job-detail.html`) - Quản lý ứng viên
- Chi tiết công việc (JD, Level, Company, Skills, Questions)
- Danh sách ứng viên (Status, link, kết quả)
- Nút "Xem kết quả" (dành cho HR)

**4. Interview Page** (`/interview.html`) - Phỏng vấn
- Chat với AI (Adaptive)
- Ứng viên chỉ thấy "Cảm ơn" sau phỏng vấn

**5. Review Page** - Xem kết quả
- Thông tin phỏng vấn + Rubric + Chat
- Edit evaluations + Export

---

## 🎬 PHẦN 2: CÁCH DEMO APP

### Demo Script (15-20 phút)

#### **Bước 1: Trang chủ - Job Library** (2 phút)

1. Mở `http://localhost:3000`
2. Hiển thị: Danh sách jobs (nếu có)
3. Nói: *"Đây là thư viện công việc. Mỗi công việc hiển thị tên vị trí, công ty, số kỹ năng, và ngày tạo. HR có thể quản lý toàn bộ công việc tại đây."*
4. Click nút "+ Tạo Job Mới" để sang bước tiếp

---

#### **Bước 2: Setup - Tạo công việc** (5-6 phút)

**Step 1: Input JD**
1. Dán JD mẫu (chuẩn bị sẵn):
   ```
   Position: Senior Python Developer
   Company: TechCorp Vietnam
   Level: 3+ years
   
   Responsibilities:
   - Design and build Python services
   - Work with AWS, Docker
   - Mentor junior developers
   
   Required Skills: Python, AWS, Docker
   ```
2. Nói: *"HR dán mô tả công việc. App tự động trích xuất tên công ty, vị trí."*
3. Click Next

**Step 2: Xác nhận chi tiết**
1. Show: Auto-extracted fields (Công ty, vị trí, level)
2. Có thể chỉnh sửa
3. Nói: *"Nếu trích xuất sai, HR chỉnh sửa lại. Ví dụ company name, job title."*
4. Click Next

**Step 3: Chọn & quản lý kỹ năng**
1. Show: Auto-suggest skills (Python, AWS, Docker, etc.)
2. HR có thể:
   - Thêm skill (+ Add Skill)
   - Xóa skill (X button)
   - Xem số câu hỏi per skill
3. Nói: *"App gợi ý kỹ năng từ JD. HR chọn 1-5 kỹ năng để hỏi. Mỗi kỹ năng sẽ có câu hỏi riêng."*
4. Click Next

**Step 4: Tạo câu hỏi**
1. Show: AI-suggested questions per skill
2. HR có thể:
   - Edit từng câu hỏi
   - Thêm câu hỏi mới (+ Add Question)
   - Xóa câu hỏi (X)
3. Nói: *"AI tạo câu hỏi dựa trên kỹ năng. HR có thể chỉnh sửa hoặc thêm câu hỏi riêng. Số câu hỏi mỗi kỹ năng có thể khác nhau."*
4. Click Next

**Step 5: Lưu công việc**
1. Show: "Tạo Job" button (hoặc "Update Job" nếu edit)
2. Click → Job lưu vào database
3. Redirect về Job Detail hoặc Job Library
4. Nói: *"Công việc được lưu vào thư viện. Giờ HR quản lý ứng viên từ trang chi tiết."*

---

#### **Bước 3: Job Detail - Quản lý ứng viên** (3-4 phút)

1. Show: Chi tiết công việc (JD, Level, Company, Skills, Questions)
2. Danh sách ứng viên (nếu có)
3. Click "+ Thêm Ứng Viên"
   - Form: Tên, Email
   - Tạo link phỏng vấn
   - Copy link / Gửi email (mock)
4. Nói: *"Sau khi tạo công việc, HR thêm ứng viên. Mỗi ứng viên nhận link duy nhất để trả lời. HR có thể xem danh sách, copy link, hoặc gửi email."*

---

#### **Bước 4: Interview - Phỏng vấn ứng viên** (5-6 phút)

**Scenario:** Ứng viên mở link và trả lời

1. Show interview link (copy từ bước trên)
2. Mở link → Interview page
3. Nói: *"Ứng viên mở link, thấy câu hỏi đầu tiên."*
4. Type mẫu câu trả lời:
   ```
   Câu hỏi: "Tell me about your Python experience"
   Trả lời: "I've worked with Python for 4 years, built REST APIs with Flask and FastAPI..."
   ```
5. Click "Send" → AI evaluate
   - AI nói: "Good answer!" hoặc "Can you elaborate?"
   - Nếu "Good" → chuyển câu hỏi kế
   - Nếu "Not good" → Follow-up question (max 3 lần)
6. Tiếp tục cho 1-2 câu hỏi để show flow
7. Khi hết câu → Show "Thank you" message
8. Nói: *"AI phỏng vấn theo kịch bản. Nếu câu trả lời tốt, chuyển câu tiếp. Nếu chưa đủ, AI hỏi thêm (tối đa 3 lần). Ứng viên chỉ thấy 'Cảm ơn', không thấy điểm số."*

---

#### **Bước 5: Review - HR xem kết quả** (2-3 phút)

1. Quay lại Job Detail → Click "Xem kết quả" (nút ở danh sách ứng viên)
2. Show: Review modal
   - **Interview Info**: Tên ứng viên, vị trí, ngày phỏng vấn
   - **Evaluation Rubric**: Mỗi skill có:
     - Tên skill
     - Nhận xét (AI generated)
     - Edit button (chỉnh sửa nhận xét)
   - **Interview Transcript**: Toàn bộ Q&A
3. Click "Edit" (cạnh Evaluation Rubric)
   - Hiện form với textarea mỗi skill
   - HR có thể chỉnh sửa
   - Click "Save"
4. Nói: *"HR xem toàn bộ kết quả: điểm, nhận xét AI, lịch sử chat. HR có thể chỉnh sửa nhận xét trước khi export."*
5. Click "Export PDF" hoặc "Export CSV"
6. Nói: *"Xuất kết quả PDF hoặc CSV để lưu lại hoặc gửi cho team."*

---

### Demo Notes

- **Chuẩn bị data:**
  - JD mẫu (copy-paste sẵn)
  - Email/tên ứng viên mẫu
  - Câu trả lời mẫu

- **Khoảng thời gian:**
  - Job Library: 2 phút
  - Setup: 5-6 phút
  - Job Detail: 3-4 phút
  - Interview: 5-6 phút
  - Review: 2-3 phút
  - **Tổng: 17-21 phút**

---

## 📊 PHẦN 3: TỔNG HỢP DIARY & LESSON LEARN

### 3.1 Timeline - Những gì đã làm

| Ngày | Mô tả | Trạng thái |
|------|-------|-----------|
| **08/09** | Tạo dịch vụ sinh câu hỏi + 5 backend services (sessionManager, interviewEngine, aiIntegration, rubricGenerator, exportService) | ✅ Xong |
| **08/09** | Express server + 3 API routes (setup, interview, review) + frontend setup page (5 bước) | ✅ Xong |
| **08/09** | Hoàn thành frontend 2 trang (interview, review) + test suite + README | ✅ Xong |
| **10/09** | Gọi model AI, trả về tóm tắt (sửa bug kết quả kèm chữ thừa) | ✅ Xong |
| **11/09** | Browser Token persistence - Phase 1-4 (database schema + sessionManager adapter) | ✅ Xong |
| **13/09** | Brainstorm + Spec + Plan Job Library feature | ✅ Xong |
| **14/09** | Fix 5 bugs, consolidate commits, test e2e flow | ✅ Xong |
| **15/09** | Fix 2 bugs lớn (database async race condition, edit flow) | ✅ Xong |
| **16/09** | Fix edit job data preservation, hardcoded skills, thêm delete button | ✅ Xong |
| **17/09** | Fix app redirect, email bug, test e2e | ✅ Xong |
| **21/09** | Fix 4 email/link bugs, thêm delete candidate feature | ✅ Xong |
| **22/09** | Fix interview chatbot, question progression, review back button | ✅ Xong |
| **23/09** | Consolidate 8 commits, fix candidate data persistence, separate candidate/HR views | ✅ Xong |
| **23/09** | Auto-generate AI evaluations, HR edit evaluations UI | 🔄 In Progress |

---

### 3.2 Bugs tìm & sửa (15+ bugs)

**Danh sách bugs chính:**

1. **Database initialization** - Disabled → Fix enable
2. **Column name mismatch** - job_id vs id → Fix column references
3. **Missing HTML pages** - job-library.html, job-detail.html → Create pages
4. **Button handlers** - Copy, Send Email missing → Implement + fallback
5. **Candidate management** - Form incomplete → Fix form handling
6. **Skills mismatch** - Mock response hardcoded → Extract từ request
7. **Database async race** - getDb() not awaited → Fix async/await
8. **Edit flow stuck** - Step navigation hang → Fix flow logic
9. **JD company parsing** - Extract sai → Fix regex
10. **Copy button** - execCommand fail → Add fallback
11. **Email field disabled** - Setup Step 1 → Remove disabled
12. **Interview link** - Relative path → Generate full URL
13. **Interview chatbot fail** - "Failed to start interview" → Fix API calls
14. **Question progression** - Luôn hỏi skill đầu → Implement proper progression
15. **Review page** - Back button → Fix navigation

---

### 3.3 Kiến trúc Database

**5 bảng chính:**

```sql
1. JOBS
   - job_id, title, company, level, jd_text, 
   - skills (JSON), questions (JSON), hr_email

2. CANDIDATES
   - id, job_id, name, email, interview_link, 
   - status, created_at, link_sent_at

3. INTERVIEWS
   - interview_id, candidate_id, job_id, 
   - questions_by_skill (JSON), status, created_at

4. MESSAGES
   - message_id, interview_id, role, content, 
   - created_at

5. SUMMARIES (Evaluations)
   - summary_id, interview_id, skill_name, 
   - main_answer_summary, created_at
```

---

### 3.4 Key Technical Decisions

#### **1. Database: SQLite**
- **Lý do:** Đơn giản, portable, không cần server
- **Tradeoff:** 
  - ✅ Dễ setup, không phụ thuộc bên ngoài
  - ❌ Performance kém nếu concurrent writes nhiều

#### **2. Fallback Mock Mode cho AI**
- **Lý do:** Qwen API không stable, need fallback
- **Tradeoff:**
  - ✅ App luôn chạy được
  - ❌ Không có AI thực, mock response cứng

#### **3. In-memory state + Database persistence**
- **Lý do:** Interview state cần nhanh, output cần lưu
- **Tradeoff:**
  - ✅ Interview smooth, data không mất
  - ❌ Phức tạp hơn, cần 2 lớp storage

#### **4. Separate candidate/HR views**
- **Lý do:** Security + UX (ứng viên không thấy điểm)
- **Tradeoff:**
  - ✅ Privacy, mỗi người thấy đúng cái cần thấy
  - ❌ Code phức tạp hơn, 2 frontend flows

---

### 3.5 Những điều học được

#### **1. Spec trước, code sau**
- **Học được:** Khi spec rõ ràng, code nhanh hơn 50%
- **Ví dụ:** Job Library feature có plan cụ thể 12 tasks → làm lần lượt, ít rework
- **Áp dụng:** Luôn brainstorm + spec trước coding

#### **2. Database schema cần suy nghĩ kỹ**
- **Học được:** Column name, foreign keys sai → bug cascade
- **Ví dụ:** `job_id` vs `id`, `session_id` vs `interview_id` → 3+ bugs
- **Áp dụng:** Draw schema trước, double-check khi coding

#### **3. Mock data & fallback quan trọng**
- **Học được:** Khi API external không stable, app crash
- **Ví dụ:** Qwen API → add mock mode → app vẫn chạy được
- **Áp dụng:** Luôn có fallback, không depend 100% bên ngoài

#### **4. Testing during development**
- **Học được:** Bug sớm phát hiện = sửa nhanh, cost thấp
- **Ví dụ:** Step 3 skills không khớp Step 4 → phát hiện sớm khi test → sửa ngay
- **Áp dụng:** Test e2e sau mỗi feature, không đợi cuối

#### **5. Commit message rõ ràng**
- **Học được:** Khi merge nhiều commits, message rõ ràng → dễ review, ít sai
- **Ví dụ:** "fix: resolve interview chatbot initialization failures" → hiểu ngay vấn đề
- **Áp dụng:** Viết commit message cho người khác hiểu

#### **6. User journey visualization**
- **Học được:** Vẽ luồng trước → design tốt hơn, ít refactor
- **Ví dụ:** Job Library thêm vào → vẽ luồng → ít mất thời gian design UI
- **Áp dụng:** Luôn vẽ wireflow trước, đừng code mù

---

### 3.6 Những thứ vẫn chưa hoàn hảo

| Vấn đề | Lý do | Cách fix |
|--------|-------|---------|
| **Mock AI responses** | API không stable | Dùng real Qwen API + caching |
| **Performance** | SQLite, 1 file | Migrate sang PostgreSQL |
| **Concurrent interviews** | Lock issues | Implement job queue |
| **Email sending** | Mock chỉ alert | Integrate sendgrid/smtp |
| **File upload** | Chưa có | Implement S3/cloud storage |
| **Export formatting** | Cơ bản | Improve PDF layout + styling |

---

### 3.7 User Feedback Summary

**Chưa hỏi user trực tiếp, nhưng từ diary:**
- ✅ User hài lòng với:
  - Tính năng Job Library
  - Adaptive interview
  - HR evaluation editing
  - E2E flow rõ ràng

- 🤔 Có thể cải thiện:
  - Vẫn chưa hỏi feedback cụ thể từ HR thực tế
  - Chưa test với ứng viên thực
  - Chưa measure "satisfaction" hay "completion rate"

---

### 3.8 Lessons for Next Phase

1. **Integrate real AI:** Qwen/GPT stable + caching
2. **Scale database:** PostgreSQL + migration
3. **Production deployment:** Heroku/Railway + env config
4. **Monitoring:** Logs, error tracking (Sentry)
5. **User testing:** Beta test với HR + ứng viên thực
6. **Analytics:** Track completion rate, question difficulty

---

## 📝 Kết luận

### Ứng dụng hiện tại:

✅ **Core features hoàn chỉnh:**
- Job Library (Create, Read, Update, Delete)
- Candidate management (Add, Remove, Track)
- Adaptive interview (Q&A with AI)
- HR review + edit evaluations
- Export PDF/CSV

✅ **Quality:**
- 15+ bugs tìm & sửa
- E2E flow tested
- Database persistence
- Secure (separate views)

✅ **Sẵn sàng:**
- Demo cho stakeholders
- Beta test với HR real
- Refine UI/UX từ feedback

---

**Tài liệu này được tạo:** 23/09/2024  
**Trạng thái:** Ready for presentation
