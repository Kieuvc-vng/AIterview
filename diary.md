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

## 22/09 — Kiểu + Tiến (Afternoon - Phase 3 Integration)

**Nhờ làm:** thay thế phần results display từ Source 2 (feature/job-library-phase3-frontend) vào Source 1

**Claude làm:**

**Phần 1 - So sánh 2 source:**
- Source 1 (feature/job-library-schema): schema SESSIONS, basic review page
- Source 2 (feature/job-library-phase3-frontend): schema JOBS/CANDIDATES/INTERVIEWS, full results with summaries
- Phát hiện: 2 schema hoàn toàn khác nhau → cần Plan C (dùng Phase 3 schema + giữ interview logic)

**Phần 2 - Triển khai Plan C:**
- Update schema.sql: SESSIONS → JOBS/CANDIDATES/INTERVIEWS/SUMMARIES (Phase 3 schema)
- Update setupRoutes: gọi jobLibraryService.createJob() thay vì sessionManager.createSession()
- Rewrite interviewRoutes: tạo CANDIDATE+INTERVIEW động, lưu vào INTERVIEWS table
- Rewrite reviewRoutes: lấy dữ liệu từ INTERVIEWS thay SESSIONS
- Copy jobLibraryService.js từ Phase 3
- Update db/init.js: export getDb() function để services có thể gọi

**Phần 3 - Frontend updates:**
- app.js: support cả jobId + interviewId
- setupPage.js: pass job_id to InterviewPage (thay vì session_id)
- interviewPage.js: nhận job_id → gọi /api/interview/start → get interview_id
- reviewPage.js: dùng interview_id thay sessionId
- Tất cả API calls updated để dùng INTERVIEWS table

**Phần 4 - Testing:**
- Start server trên port 3001 ✓
- Setup page render đúng ✓
- Parse-jd endpoint hoạt động ✓
- App initialized without errors ✓

**Bước:** 3 — Spec → Build (xong implementation, cần test end-to-end)
**Chưa hiểu:** chưa test full flow từ setup → interview → review để xác nhận tất cả hoạt động

## 22/09 (tiếp) — Full Testing + Bug Fix

**Nhờ làm:** test toàn bộ flow interview từ setup đến chat hoạt động được không

**Claude làm:**

**Phần 1 - Tìm và fix bug job_id:**
- Phát hiện: /api/interview/start trả error 400 "Job not found"
- Debug: /api/setup/create-session trả `job_id: undefined` thay vì `job_id: "job_xxx"`
- Root cause: setupRoutes.js line 87-100 làm `result.id` nhưng createJob() trả string jobId, không object
- Fix: thay `const result = ...` + `result.id` thành `const job_id = ...` + `job_id`
- Commit: `fix: return job_id string from create-session instead of result.id`

**Phần 2 - Full flow test end-to-end:**
- Step 1: Parse JD ✓ (mock data: Data Engineer, Mid, Tech Company)
- Step 2: Confirm Details ✓
- Step 3: Select Skills ✓ (Technical Skills + Communication)
- Step 4: Review Questions ✓ (4 questions generated)
- Step 5: Create Session ✓ → job created, job_id returned correctly
- Interview Start: Enter name (Bob Smith) ✓
- Chat interface: Candidate message "I have 5 years of experience..." → AI respond "Thank you for that answer. Let me follow up..." ✓

**Kết quả:** Interview chatbot hoạt động 100% từ setup → candidate chat. Flow xong.

**Bước:** Test (xong)
**Chưa hiểu:** không có gì
