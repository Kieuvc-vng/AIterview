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
1. Sửa bug JD parsing (tên vị trí hiển thị sai)
2. Fix copy button không hoạt động
3. Bỏ tùy chọn gửi email
4. Thêm danh sách ứng viên trên job

**Claude làm:**
- Bug 1: Fix JD parsing — company name bị extract từ system prompt prefix thay vì actual JD text → updated regex để skip "Extract fields from this JD:" và lấy first line thực của JD
  * Test: Vietnamese JD "Tai Game Studio 9" giờ parse correctly ✓
- Bug 2: Fix copy button — thêm fallback cho trình duyệt cũ + visual feedback (button text đổi thành "✓ Đã Copy" trong 2 giây)
- Bug 3: Xóa "Gửi Email" button khỏi modal "Gửi cho Ứng Viên"
- Feature: Thêm "Xem Ứng Viên" button trên job card
  * Khi click → modal hiện danh sách ứng viên (tên, email, phone, interview link)
  * Mỗi candidate có nút Copy riêng cho interview link
  * Hiển thị trạng thái phỏng vấn

**Bước:** 3 — Spec → Build
**Chưa hiểu:** không có gì
