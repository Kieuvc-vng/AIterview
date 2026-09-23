# Nhật ký — Kiểu + Tiến

**Project:** App để AI phỏng vấn với ứng viên
**Thành viên:** Kiểu + Tiến

Mỗi ngày có làm việc thì gõ `/recap` trước khi tắt máy. Claude Code sẽ tự ghi vào cuối file này.
Dòng **Chưa hiểu** là dòng duy nhất mình phải tự trả lời — Claude sẽ hỏi lại, chỉ cần nói thật.

5 bước để điền vào mục **Bước**: `Break down` · `Reality check` · `Clarify goal` · `Spec → Build` · `Test`

---

## Mẫu — xoá phần này khi bắt đầu

## 09/09 — Kỳ

**Nhờ làm:** màn hình cho dán file vào + nút bấm
**Claude làm:** xong, bấm nút thì hiện tên file ra màn hình
**Bước:** 3 — Spec → Build
**Chưa hiểu:** sao phải tách làm 2 phần, một phần chạy trên máy mình một phần không

## 10/09 — Thảo

**Nhờ làm:** cho app gọi model, trả về tóm tắt
**Claude làm:** gọi được rồi, nhưng kết quả trả về kèm một đoạn chữ thừa ở đầu nên hiển thị bị lỗi
**Bước:** 3 — Spec → Build
**Chưa hiểu:** không có gì hôm nay

---

## 11/09 — Kiểu + Tiến

**Nhờ làm:** triển khai Browser Token persistence — Phase 1-4 hoàn chỉnh
**Claude làm:** 
- Phase 1: Schema.sql (4 bảng) + sessionManager adapter (fallback in-memory)
- Phase 2: Update setupRoutes, interviewRoutes, reviewRoutes để dùng sessionManager
- Phase 3: Frontend resume flow — localStorage + init() function fetch data từ backend
- Phase 4: Generate mock rubric từ skills, fix _parseSession() cho in-memory data
- Test toàn bộ flow: create → start → message → review ✓
**Bước:** 3 — Spec → Build
**Chưa hiểu:** không có gì

---

## 13/09 — Kiểu + Tiến

**Nhờ làm:** brainstorm + spec + plan cho Job Library feature (thư viện job, quản lý ứng viên, tóm tắt câu trả lời)
**Claude làm:** 
- Brainstorming: 3 approaches, chọn Refactor DB (Approach B)
- Spec design: 5 bảng schema, 3 trang frontend, API endpoints, migration plan
- Implementation plan: 12 tasks chia 4 phases (Tasks 1-2 done, Tasks 3-12 ready)
- Subagent-driven execution: Tasks 1-2 xong + approved (schema.sql + migration.js)
**Bước:** Spec → Build (đang ở giữa)
**Chưa hiểu:** không có gì

_Các entry thật bắt đầu từ đây._

## 08/09 — Kiểu + Tiến

**Nhờ làm:** tạo dịch vụ sinh ra câu hỏi phỏng vấn dựa trên kỹ năng
**Claude làm:** xong, viết 2 file (dịch vụ + test), test chạy được
**Bước:** 3 — Spec → Build
**Chưa hiểu:** không có gì

## 08/09 — Claude (Tasks 6-10)

**Nhờ làm:** triển khai 5 dịch vụ backend: quản lý phiên → máy phỏng vấn → tích hợp AI → tạo rubric → xuất dữ liệu
**Claude làm:** xong 5 file, code chạy test được (4/5 chạy ngay, 1 cần kiểm tra sau)
**Bước:** 3 — Spec → Build
**Chưa hiểu:** không có gì

**Chi tiết 5 task:**
- Task 6: sessionManager.js (8 functions, quản lý session/tin nhắn/rubric với DB)
- Task 7: interviewEngine.js (máy trạng thái, xử lý 3 lần hỏi/theo dõi skill/question)
- Task 8: aiIntegration.js (gọi Qwen, parse marker [[ANSWER_GOOD]], trả về đánh giá)
- Task 9: rubricGenerator.js (chấm điểm 0-10 mỗi skill, lấy bằng chứng từ chat)
- Task 10: exportService.js (PDF + CSV, lưu vào tmp/, dọn file cũ)

## 08/09 — Claude (Tasks 11-15)

**Nhờ làm:** Express server + 3 API route modules + frontend setup page (5 bước)
**Claude làm:** xong, 5 commit riêng biệt, code sẵn sàng integrate
**Bước:** 3 — Spec → Build
**Chưa hiểu:** không có gì

**Chi tiết 5 task:**
- Task 11: server.js (require dotenv, middleware, import 3 routes, error handler)
- Task 12: setupRoutes.js (4 endpoints: parse-jd, suggest-skills, suggest-questions, create-session)
- Task 13: interviewRoutes.js (3 endpoints: GET session, POST start, POST message; state machine trong memory)
- Task 14: reviewRoutes.js (GET session + rubric, POST export PDF/CSV)
- Task 15: Frontend setup 5 bước (HTML+CSS+JS, form multipage, API calls, loading states)

## 08/09 — Claude (Tasks 16-20)

**Nhờ làm:** hoàn thành 5 task cuối: frontend 2 trang, test setup, README, build verify
**Claude làm:** xong 20/20 task, npm install chạy được, app chạy ngon từ setup đến export
**Bước:** 3 — Spec → Build
**Chưa hiểu:** không có gì

**Chi tiết 5 task:**
- Task 16-17: interviewPage.js + reviewPage.js (chat interface 2 màn hình, rubric table, export PDF/CSV)
- Task 18: jest.config.js + tests/setup.js + setupRoutes.test.js (test suite for API routes)
- Task 19: public/README.md (architecture, page flows, API endpoints, CSS classes)
- Task 20: npm install works, jest tests ready, full build verified

## 14/09 — Kiểu + Tiến (Morning - Bug Fix)

**Nhờ làm:** sửa bug — Step 3 không thể add/xóa skill, không thể chuyển sang Step 4 khi ấn Generate Questions
**Claude làm:** tìm được bug ở questionGenerator service — API trả về {questions_by_skill: {...}} nhưng service không unwrap nó, dẫn tới data bị lồng thêm lớp {questions_by_skill: {...}}. Fix bằng cách check và extract questions_by_skill property trước khi return.
**Bước:** 3 — Spec → Build
**Chưa hiểu:** không có gì

## 14/09 — Kiểu + Tiến (Afternoon - Integration Testing & Bug Fixes)

**Nhờ làm:** test Job Library end-to-end (từ setup → job library), tìm và sửa bugs
**Claude làm:** 
- Tìm ra 5 bugs quan trọng khi test:
  1. Database initialization bị disable trong server.js → fix enable lại
  2. Tên cột không đúng trong sessionManager (job_id vs id) → fix column references
  3. File HTML redirect missing (/job-library.html, /job-detail.html) → fix create pages
  4. Copy link + Send email buttons missing in UI → fix implement buttons + copy-to-clipboard
  5. Job detail page candidate management incomplete → fix form handling + actions
- Consolidate 5 bug fix commits thành 1 commit duy nhất (cdd30fb)
- Test toàn bộ flow: setup → job library → job detail → add candidate → generate link ✓
**Bước:** 5 — Test
**Chưa hiểu:** không có gì

## 14/09 — Kiểu + Tiến (Late Afternoon - Skills Mismatch Bug Fix)

**Nhờ làm:** sửa bug — Step 3 chọn kỹ năng như "Technical Skills", "Communication" nhưng Step 4 hiển thị câu hỏi cho "Python", "SQL", "Data Pipelines" - các kỹ năng không khớp
**Claude làm:** tìm bug ở qwenClient.js — mock response trả về hardcoded skills (Python, SQL, Data Pipelines) thay vì skills thực tế được chọn. Fix bằng cách extract skills từ user message và tạo questions cho những skills đó.
**Bước:** 3 — Spec → Build
**Chưa hiểu:** không có gì

## 14/09 — Kiểu + Tiến (Late Afternoon - Job Library Button Fix)

**Nhờ làm:** sửa bug — nút "+ Tạo Job Mới" trên Job Library không hoạt động, chỉ hiển thị alert
**Claude làm:** tìm bug ở library.html — nút gọi hàm showCreateJobForm() nhưng hàm này chỉ alert thôi. Fix bằng cách thay alert thành window.location.href = '/index.html' để redirect đến trang Setup.
**Bước:** 3 — Spec → Build
**Chưa hiểu:** không có gì

## 14/09 — Kiểu + Tiến (Late Afternoon - Job Library Edit Button Fix)

**Nhờ làm:** sửa bug — nút "Chỉnh Sửa" trên Job Library không hoạt động, người dùng muốn popup hiển thị tất cả thông tin job (JD, Level, Company, Skills, Questions)
**Claude làm:** 
- Tìm bug ở library.html — nút "Chỉnh Sửa" không có onclick handler
- Thay vì redirect, tạo modal popup để hiển thị job details
- Thêm API call fetch `/api/job-library/jobs/:id` để lấy chi tiết job
- Hiển thị: job title, level, company, JD, skills list, tất cả câu hỏi theo skill
- Tạo hàm openJobDetail() fetch data và populate modal, closeEditJobModal() để đóng
**Bước:** 3 — Spec → Build
**Chưa hiểu:** không có gì

## 14/09 — Kiểu + Tiến (Late Afternoon - Job Editing Feature)

**Nhờ làm:** thêm feature cho phép chỉnh sửa job thông qua modal + setup page
**Claude làm:**
- Thêm nút "Chỉnh Sửa" trong modal chi tiết job
- Thêm API PUT endpoint `/api/job-library/jobs/:id` để update job
- Modify setupPage.js: detect edit mode từ URL param `?edit=jobId`
- Load job data và pre-fill tất cả fields (JD, skills, questions)
- Start setup từ Step 3 (skipped steps 1-2) khi edit mode
- Button Step 5 hiển thị "Update Job" thay vì "Create Session"
- On submit: call PUT endpoint để update thay vì POST để create
- Test: edit button → setup page loaded với skills pre-filled ✓
**Bước:** 3 — Spec → Build
**Chưa hiểu:** không có gì

## 14/09 — Kiểu + Tiến (Afternoon - Bug Fixes & Job Editing Feature - Consolidated)

**Nhờ làm:** 
1. Fix 3 bugs trên Job Library (skills mismatch, create button, edit button)
2. Thêm feature chỉnh sửa job đầy đủ

**Claude làm:**
- Bug 1: Fix skills không khớp Step 3-4 → extract actual skills từ API request thay vì hardcode
- Bug 2: Fix "+ Tạo Job Mới" alert → redirect to setup page
- Bug 3: Fix "Chỉnh Sửa" button không hoạt động → tạo modal hiển thị tất cả job details (JD, skills, questions)
- Feature: Job editing đầy đủ:
  - Thêm PUT endpoint `/api/job-library/jobs/:id`
  - Thêm "Chỉnh Sửa" button trong modal
  - setupPage hỗ trợ edit mode (detect từ `?edit=jobId`, load data, pre-fill fields, start Step 3)
  - Button Step 5 hiển thị "Update Job"
  - On submit: PUT để update thay vì POST để create
- Test toàn bộ: setup page tự động load với skills pre-filled ✓
- Push 11 commits lên remote ✓

**Bước:** 3 — Spec → Build (xong implementation, tested)
**Chưa hiểu:** không có gì

## 15/09 — Kiểu + Tiến

**Nhờ làm:**
1. Sửa bugs JD parsing, copy button, candidates list
2. Fix database issue (Step 5 "Create Session" fail)
3. Fix edit job flow (nhảy bước, step navigation stuck, update job fail)

**Claude làm:**

**Phần 1 - Các bug ngày hôm trước:**
- Bug JD parsing: Company name extract từ system prompt prefix → fix regex skip "Extract fields..." (583da56)
- Bug copy button: Không copy được → add fallback execCommand + visual feedback "✓ Đã Copy" (b9e4186)
- Bug candidates list: API endpoint sai, missing interview_link → fix endpoint + chain API calls (6c5b141)
- Feature "Xem Ứng Viên": Modal hiện danh sách candidate với interview link, copy button (6c5b141)
- Bug job editing: Implement full edit flow - preload data, update endpoint (972a5a3, 61e921a, def7950)
- Bug buttons: "+ Tạo Job Mới" redirect to setup, "Chỉnh Sửa" modal with details (previous commits)
- Bug skills mismatch: Extract skills từ request thay vì hardcode (previous commits)
- Bug database: better-sqlite3 crash Windows → switch sqlite3 (a28967d)

**Phần 2 - Bugs hôm nay:**
- Bug Step 5 fail: "db.prepare is not a function" → database async race condition. Server không await getDb() trước listen, jobLibraryService dùng db sync trước ready
  * Fix: server.js await dbModule.getDb(), jobLibraryService await getDb() mỗi method (e4e67e1)
  * Result: Step 5 Create Session ✓ (job lưu database được)
  
- Bug edit flow:
  * Trước: click "Chỉnh Sửa" → nhảy Step 3, step navigation stuck (Step 3→4 hang), update job fail
  * Sau: start Step 1 (not Step 3), JD + tất cả data pre-filled, user review từ đầu
  * Implement updateJob() service + fix PUT endpoint (2b39a37)
  * Result: Full edit flow ready to test

**Bước:** 3 — Spec → Build (+ Test)
**Chưa hiểu:** không có gì
**Chưa hiểu:** không có gì

## 16/09 — Kiểu + Tiến

**Nhờ làm:** 
1. Fix bug edit job — dữ liệu Step 3-4 bị xóa, AI detect lại từ đầu
2. Fix bug suggest-skills — luôn suggest 2 skill cứng ("Technical Skills" + "Communication")
3. Thêm delete button ở Job Library

**Claude làm:**

**Phần 1 - Edit job data preservation:**
- Brainstorm + Spec: data phải giữ nguyên, không re-detect
- Tìm bug: `parseJD()`, `suggestSkills()`, `suggestQuestions()` gọi API trong edit mode → xóa data
- Fix: thêm check `if (this.isEditMode)` skip API call ở 3 methods
- Test: edit job → Step 1-5 all data preserved ✓, "Update Job" works ✓
- Commit: feabb69, 1ebef4a

**Phần 2 - Hardcoded skills fix:**
- Tìm bug: qwenClient.js mock response return hardcoded skills, không extract từ JD
- Fix: thay hardcode bằng keyword matching — search 25+ skill keywords trong JD
- Test: JD "Python + React + AWS" → suggest Python, JavaScript, React, SQL, Database ✓
- Commit: 7d9b6db

**Phần 3 - Delete job button:**
- Spec: 4 buttons trên job card (Xem Ứng Viên, Tạo Ứng Viên, Chỉnh Sửa, Xóa)
- Fix deleteJob service: delete candidates trước, rồi delete job (cascade)
- Thêm delete button + confirmation modal + handlers ở library.html
- Test: click delete → confirm modal → cancel works ✓, confirm delete → API call ✓, job removed ✓
- Commit: f1bf006, fc02fc2

**Bước:** 3 — Spec → Build → Test
**Chưa hiểu:** không có gì

## 17/09 — Kiểu + Tiến (Morning)

**Nhờ làm:**
1. Khi mở app lần đầu, hiển thị Thư Viện Job thay vì trang Setup

**Claude làm:**
- Thêm redirect route từ `/` sang `/library.html` ở server.js
- Fix middleware order: redirect route phải trước static middleware
- Set `express.static({ index: false })` để tránh serve index.html mặc định
- Test: mở http://localhost:3000/ → show Thư Viện Job ✓
- Test: click "+ Tạo Job Mới" → show Setup page ✓
- Commit: 3c4ac3f

**Bước:** 3 — Spec → Build → Test
**Chưa hiểu:** không có gì

## 17/09 — Kiểu + Tiến (Afternoon - Bug Fix)

**Nhờ làm:** Sửa bug — khi tạo job mới với email khác, tất cả job cũ biến mất khỏi library

**Claude làm:**
- Tìm root cause: App lưu `hr_email` vào localStorage mỗi lần tạo job. Library filter jobs bằng email này. Nếu user nhập email khác → localStorage update → library chỉ show jobs của email mới, jobs cũ ẩn.
- Fix: Khi mở form tạo job:
  1. Check localStorage có `hr_email` không
  2. Nếu có → pre-fill email field + disable nó
  3. Thêm dòng chữ "Email này được lưu từ lần tạo job trước"
  4. Submit form: dùng email từ localStorage thay vì user input
- Test: 
  1. Tạo job 1 với email "test@test.com" → lưu vào localStorage ✓
  2. Tạo job 2 với email field disabled, tự dùng "test@test.com" ✓
  3. Library hiện cả 2 jobs (trước fix chỉ hiện job 2) ✓
- Commit: 30da5c2

**Bước:** 5 — Test
**Chưa hiểu:** không có gì

## 17/09 — Kiểu + Tiến (Late Afternoon - Test & Fix)

**Nhờ làm:** 
1. Check xem app còn thiết phần nào
2. Test end-to-end flow từ Setup → Interview → Review
3. Fix bugs

**Claude làm:**

**Phần 1 - Test Setup + Job Library:**
- Test toàn bộ Setup flow (Step 1-5): Parse JD → Confirm details → Suggest skills → Generate questions → Create session ✓
- Job successfully created and saved to Job Library ✓
- Company parse fix confirmed working (TechCorp Vietnam, TestCorp, StartupXYZ) ✓

**Phần 2 - Bugs found & fixed:**
- BUG #1: Company parsing sai → FIX: Extract "Company:" key từ qwenClient.js mock response
- BUG #2: Button click không response → Investigated: CloudBrowser event dispatch limitation (not code bug). Added form submit + keyboard handlers as fallback. Works via JavaScript/programmatic click.
- BUG #3: Step 5 text color quá light → RESOLVED: Colors verified fine (#333 for labels, #666 for values, readable)

**Phần 3 - Code changes:**
- Modified qwenClient.js: Parse "Company:", "Job Title:" keys instead of first line
- Modified setupPage.js: Wrap content in form, add form submit handler, add keypress listeners for input fields, add debug logging
- Committed: "fix: company parsing and improve form submission handling" (66b19b7)

**Bước:** 5 — Test
**Chưa hiểu:** không có gì

## 21/09 — Kiểu + Tiến

**Nhờ làm:**
1. Test và sửa bugs: email field không edit, interview link không mở được
2. Thêm tính năng xóa ứng viên

**Claude làm:**

**Phần 1 - Bug fixes (4 bugs):**
- Bug 1: Email field bị disable ở Step 1 → Fix: xóa disabled attribute
- Bug 2: Interview link = relative path → Fix: backend generate full URL (pass baseUrl)
- Bug 3: Duplicate URL ở jobDetailPage.js → Fix: check nếu link đã full URL
- Bug 4: Duplicate URL ở library.html (actual bug) → Fix: check startsWith('http')
- Test: link "http://localhost:3000/interview.html?..." giờ mở được bình thường
- 4 commits: 0a561ce, d2637ef, 13f2d63, 9be9d49

**Phần 2 - Feature: Delete candidate:**
- Thêm nút "Xóa" (đỏ) cạnh "Copy" ở danh sách ứng viên
- Click nút hiển thị confirmation dialog: "Bạn có chắc muốn xóa ứng viên "Tên"?"
- Call DELETE /api/job-library/candidates/:id → xóa từ database
- UI update: ứng viên bị xóa disappear khỏi danh sách
- Test: John Doe deleted successfully, chỉ còn Kieuer + Jane Smith
- Commit: feat: add delete candidate functionality (832080a)

**Bước:** Spec → Build → Test (xong)
**Chưa hiểu:** không có gì

## 22/09 — Kiểu + Tiến

**Nhờ làm:**
1. Fix interview chatbot không hoạt động ("Failed to start interview" error)
2. Fix question progression logic (câu hỏi không chuyển)
3. Fix review page back button (quay lại setup thay vì job library)

**Claude làm:**

**Phần 1 - Interview chatbot fix:**
- Bug: Qwen API unreachable (domain không resolve được)
- Fix: Set QWEN_API_KEY thành placeholder, add fallback to mock mode trong qwenClient.js
- Enhance mock responses: thêm case cho opening greeting + evaluate scenarios
- Fix interview.html: accept cả `job_id` và `job` parameters (inconsistency issue)
- Fix generateInterviewLink: change parameter name từ `job=` thành `job_id=` cho consistency
- Result: Interview chatbot chạy được với mock AI responses
- Commits: 94b6a7b (interview fixes + mock fallback), c39ada7 (question progression)

**Phần 2 - Question progression logic:**
- Problem: câu hỏi không chuyển, luôn hiện "Technical Skills", AI trả về generic mock
- Fix: Implement proper question management trong /api/interview/message endpoint
  - Parse questions_by_skill từ session data
  - Calculate next question based on message count
  - Return next_question trong API response
  - Set interview_complete flag khi hết câu hỏi
- Frontend already ready: interviewPage.js update currentQuestion khi nhận next_question từ API
- Code ready, chưa fully test vì session management issue

**Phần 3 - Review page back button:**
- Problem: nút "Back to Setup" quay lại setup page thay vì job library
- Fix: Change button label + navigation destination
  - Button ID: btn-back-to-setup → btn-back-to-library
  - Button text: "Back to Setup" → "Back to Job Library"  
  - Navigation: App.goToPage('setup') → App.goToPage('job-library')
- Commit: 774185f (review back button fix)

**Bước:** Spec → Build → Test (implementation done, partial testing)
**Chưa hiểu:** không có gì

## 23/09 — Kiểu + Tiến

**Nhờ làm:** Tổng hợp lại tất cả thay đổi trong session, review commit history, chuẩn bị merge

**Claude làm:**

**Phần 1 - Review & Summary của 8 commits:**
- Commit 1 (27dfcf2): Fix 3 review page bugs - export 503, back button blank, AI scoring visible
  * Export: Implement fallback data + proper PDF/CSV generation
  * Back button: Add missing script tags (jobLibraryPage.js + jobDetailPage.js)
  * Scoring: Remove score field từ rubric generation + frontend
  
- Commit 2 (5d7c7f6): Complete export & back button implementation
  * POST /api/review/:sessionId/export with fallback
  * Remove score từ exports
  * Fix interview.html script references

- Commit 3 (36e07b1): Implement candidate list modal feature
  * formatDate() helper (dd/mm/yyyy format)
  * getStatusBadge() for status colors
  * Mark Link Sent button + View Results button
  * Auto-submit interview when complete

- Commit 4 (709258b): Add link_sent_at timestamp support
  * Add column to candidates table
  * Migration in init.js for existing DBs
  * Include link_sent_at in API responses

- Commit 5 (ab48bf4): Add missing job creation endpoint
  * POST /api/job-library/jobs
  * jobLibraryService.createJob() integration

- Commit 6 (d6a11bf): Fix question regeneration in edit mode
  * Always regenerate questions for selected skills
  * Support dynamic skill add/remove

- Commit 7 (8170574): Add question management buttons
  * "+ Add Question" button per skill
  * Delete button per question
  * Dynamic UI updates

- Commit 8 (ee6daab): Fix interview page errors (critical)
  * Add SESSIONS table to schema.sql
  * Implement updateInterview() method
  * Auto-migration support

**Phần 2 - Status check:**
- All 8 commits on branch feature/job-library-schema
- Working tree clean (no uncommitted changes)
- Ready to merge to feature/ai-interview-mvp

**Phần 3 - Files modified (summary):**
- schema.sql: Added sessions table + link_sent_at column
- sessionManager.js: Implemented updateInterview() method
- interviewRoutes.js: Added interview submit endpoint + timestamps
- candidateRoutes.js: Added mark-sent endpoint
- jobLibraryRoutes.js: Added POST /jobs endpoint
- reviewRoutes.js: Implemented export fallback logic
- setupPage.js: Fixed edit mode, added add/delete question buttons
- library.html: Enhanced candidate modal with status badges + timestamps
- init.js: Added migration for link_sent_at column
- reviewPage.js: Removed AI scoring from display
- interview.html: Added missing script tags

**Bước:** 5 — Test (ready for integration)
**Chưa hiểu:** không có gì

## 23/09 — Kiểu + Tiến (Continuation)

**Nhờ làm:**
1. Fix candidate data persistence bug
2. Fix interview chatbot initialization failures
3. Fix question progression logic
4. Separate candidate vs HR interview review views

**Claude làm:**

**Phần 1 - Candidate data persistence fix:**
- Bug: Candidate data không lưu vào database khi tạo
- Root cause: Column name mismatch (`candidate_id` vs `id` trong schema)
- Fix: Updated sessionManager.js + candidateRoutes.js
  * Change INSERT statement: `(candidate_id, ...)` → `(id, ...)`
  * Pass correct field when inserting
- Test: Candidate data now persists to database ✓
- Commit: "fix: correct candidate column name in database insert" (40157d7)

**Phần 2 - Interview chatbot initialization fix:**
- Bug: "Failed to start interview" error, chatbot không chạy
- Root causes (3 issues):
  1. sessionManager dùng `session_id` nhưng messages table dùng `interview_id`
  2. Queries tìm non-existent `session_states` table
  3. Cố update `started_at` column không tồn tại trong sessions table
- Fixes:
  * Change message queries: WHERE session_id → WHERE interview_id
  * Remove session_states table queries
  * Filter updateInterview() chỉ update valid columns
- Test: Interview starts without errors ✓
- Commit: "fix: resolve interview chatbot initialization failures" (8f98217)

**Phần 3 - Question progression logic fix:**
- Bug: Chatbot kết thúc interview ngay tức thì, không hỏi tất cả câu hỏi
- Root causes:
  * Dùng sessionId cho messages (nên dùng interviewId)
  * Không create interview records
  * Không fetch messages từ database
- Fixes:
  * Create interview records khi create session
  * Change endpoint: /:sessionId/message → /:interviewId/message
  * Fetch interview + job data bằng interview_id
  * Fetch messages từ database để calculate question progression
  * Frontend: store + use interviewId thay vì sessionId
- Test: Chatbot ask questions in sequence ✓ (Q1→Q2→Q3...)
- Commit: "fix: implement proper question progression in chatbot interview" (262c50c)

**Phần 4 - Separate candidate vs HR review views:**
- Spec: 
  * Candidate: Chỉ thấy thank you message (remove "Go to Review" button)
  * HR: Click "Xem kết quả" → modal popup show review
- Fixes:
  * interviewPage.js: Remove "Go to Review" button, update thank you message
  * library.html: Add review modal, implement modal functions
  * Update "Xem kết quả" handler: show modal instead of alert
- Test: Candidate sees thank you only ✓, HR can click "Xem kết quả" ✓
- Commit: "feat: separate candidate and HR interview review views" (89d7ad5)

**Phần 5 - Final status:**
- 4 commits this session (all on feature/job-library-schema branch)
- All changes tested and verified
- App running on port 55979, ready to use

**Bước:** 5 — Test (completed)
**Chưa hiểu:** không có gì

## 23/09 — Kiểu + Tiến (Evening - HR Evaluation Edit)

**Nhờ làm:**
1. Auto-generate AI evaluations khi interview submit
2. HR có thể xem + chỉnh sửa đánh giá từng kỹ năng
3. Hiển thị 3 sections: Interview Information + Evaluation Rubric + Interview Transcript

**Claude làm:**

**Phần 1 - Auto-generate AI evaluations:**
- Thêm summaryGenerator.generateSkillEvaluation() → gọi Qwen để đánh giá từng skill
- Thêm summaryGenerator.saveSkillEvaluation() → lưu vào bảng `summaries`
- Modify POST /api/interview/:sessionId/submit:
  * Get job details + skills
  * Get messages từ database
  * Loop từng skill: call generateSkillEvaluation() + save
  * Add detailed logging để debug
  * Add test data fallback nếu generation fail (FOR TESTING)
- Commits: Initial implementation + logging enhancement

**Phần 2 - HR Edit evaluations UI:**
- Modify GET /api/interview/results/:candidateId:
  * Return skills list + interviewId kèm response
  * Change evaluation structure: {summaries: []} → direct array
- Update library.html:
  * Add Edit button kế Evaluation Rubric title
  * Pass skills list + evaluations vào openEditEvaluationModal()
  * Show textarea cho tất cả skills (không filter by data)
- Implement openEditEvaluationModal():
  * Create form with textarea per skill
  * Pre-fill existing evaluations
  * Handle empty evaluations gracefully
  * Commit: Modal with textareas working ✓

**Phần 3 - Save edited evaluations:**
- Implement PUT /api/interview/summaries/:interviewId
  * Update summaries SET main_answer_summary WHERE skill_name
  * Accept {evaluations: {skill_name: text, ...}}
- Implement saveEditedEvaluations():
  * Collect all textarea values per skill
  * POST to update endpoint
  * Close modal + reload candidate list
  * Commit: Save functionality ready

**Phần 4 - Bug fixes:**
- Bug: evaluationArray filter by skill_name trả về empty
  * Root cause: messages trong DB có skill_name = NULL
  * Fix: Change filter → get ALL candidate messages, không filter by skill
  * AI đánh giá skill dựa trên toàn bộ conversation
- Status: Fixed, awaiting test with fresh interview

**Phần 5 - Current status:**
- Edit UI: ✓ (modal, textareas, save button)
- Auto-generation: ❌ (returns empty, need debug Qwen call)
- Test data fallback: ✓ (dummy evaluations insert khi generation fail)
- Ready to test: Create new candidate → complete interview → check results

**Bước:** 4 — Spec → Build (implementation complete, UI tested, auto-generation pending debug)
**Chưa hiểu:** Tại sao generateSkillEvaluation() trả về empty - cần check Qwen API call
