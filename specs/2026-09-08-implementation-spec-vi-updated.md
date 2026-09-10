# Spec Triển khai: Phỏng vấn với AI

**Ngày:** 2026-09-08 (updated)
**Dựa trên:** Design Document 2026-09-07  
**Trạng thái:** Sẵn sàng viết Implementation Plan  
**Công nghệ:** Node.js/Express, SQLite, Qwen 3.7 Plus API

---

## 1. Tổng quan

Một web app cho HR phỏng vấn ứng viên qua AI. Ba giai đoạn:
1. **HR Setup (Chuẩn bị):** HR dán Job Description → AI tách thông tin + gợi ý skill/câu hỏi → HR chỉnh sửa → Tạo link
2. **Candidate Interview (Phỏng vấn):** Chat với AI, AI hỏi follow-up tối đa 3 lần per câu hỏi
3. **HR Review (Xem kết quả):** Xem toàn bộ chat + bảng đánh giá (điểm + bằng chứng) do AI tạo

**Điểm quan trọng:** Không cần login (MVP) — chỉ cần link là được vào.

---

## 2. Phạm vi: Cái gì ta làm

### Giai đoạn 1: HR Setup ✅
- [ ] HR dán Job Description (bất kỳ độ dài nào)
- [ ] AI tách: Tên công việc, Level (Junior/Mid/Senior), Công ty
- [ ] HR xác nhận hoặc sửa thông tin đã tách
- [ ] AI gợi ý 1-5 kỹ năng (HR không chọn số, AI quyết định dựa JD)
- [ ] HR xem danh sách skill, có thể sửa tên, thêm, xoá (tối đa 5)
- [ ] AI gợi ý câu hỏi per skill (số lượng khác nhau, không cố định là 3)
- [ ] HR có thể sửa, thêm, xoá câu hỏi
- [ ] HR xem lại và tạo link duy nhất
- [ ] Link format: `/interview/{SESSION_ID}`

### Giai đoạn 2: Candidate Interview ✅
- [ ] Ứng viên mở link → thấy màn hình nhập tên
- [ ] Nhập tên → Bấm "Bắt đầu phỏng vấn" → Vào chat
- [ ] Tin đầu tiên: AI chào mừng với tên ứng viên + tên công việc
- [ ] Với mỗi câu hỏi:
  - [ ] AI hỏi câu hỏi
  - [ ] Ứng viên gõ câu trả lời
  - [ ] AI đánh giá: "Đủ thông tin chưa?"
  - [ ] Nếu "có" → Chuyển câu hỏi tiếp theo
  - [ ] Nếu "chưa" & số lần hỏi < 3 → AI hỏi follow-up
  - [ ] Nếu số lần = 3 → Chuyển câu tiếp (chấp nhận câu trả lời này)
- [ ] Ứng viên không thấy: tiến độ, tên kỹ năng, điểm số
- [ ] Kết thúc → Hiển thị "Cảm ơn" message

### Giai đoạn 3: HR Review ✅
- [ ] HR truy cập trang kết quả: `/review/{SESSION_ID}`
- [ ] Hai cột cạnh nhau:
  - **Bên trái:** Toàn bộ chat (Q1, A1, Q1-follow-up, A1-follow-up, Q2, A2, ...)
  - **Bên phải:** Bảng đánh giá (tên skill | điểm | bằng chứng)
- [ ] Điểm từ 0-10 (số)
- [ ] HR chỉ xem được, không sửa được kết quả
- [ ] Nút export: PDF (chat + bảng đánh giá), CSV (chỉ bảng đánh giá)

### Không làm (Tuần 2+)
- Hệ thống login người dùng
- Nhiều lần phỏng vấn cho 1 ứng viên
- Custom rubric per công ty
- Ứng viên làm lại bài phỏng vấn
- Dashboard thống kê
- Kết nối với ATS

---

## 3. Frontend: Màn hình & Các trạng thái

### Màn hình 1: HR Setup (Form nhiều bước)

**URL:** `/setup`

**Bước 1: Dán Job Description**
- Textarea: "Dán mô tả công việc..."
- Nút: "Tiếp tục"
- **Trạng thái:**
  - Trống (mặc định): textarea rỗng, nút Tiếp tục bị tắt
  - Có dữ liệu: textarea có text, nút bật
  - Đang xử lý: "Đang tách thông tin..." spinner
  - Lỗi: "Không thể tách thông tin. Thử lại?" + text đỏ

**Bước 2: Xác nhận thông tin đã tách**
- Hiển thị 3 field: Tên công việc, Level (dropdown: Junior/Mid/Senior), Công ty
- Mỗi field có nút "Sửa"
- Click Sửa: field thành text input có thể chỉnh sửa
- Nút: "Tiếp tục"
- **Trạng thái:**
  - Sẵn sàng: toàn bộ field đã điền, nút bật
  - Thiếu: bất kỳ field nào rỗng, nút tắt
  - Đang sửa: một field ở chế độ edit

**Bước 3: Danh sách kỹ năng (Skill List)**
- Mặc định: AI gợi ý 1-5 kỹ năng (HR không chọn số, AI tự quyết dựa JD)
- Mỗi dòng trong danh sách:
  - STT (1, 2, 3, ...)
  - Tên kỹ năng (text field, sửa tại chỗ)
  - Nhãn "AI gợi ý" (hiển thị nếu là gợi ý của AI)
  - Nút "Xoá" (xoá skill này)
- Nút dưới cùng: "+ Thêm kỹ năng" (tối đa 5 kỹ năng, nút tắt khi = 5)
- Nút: "Tiếp tục"
- **Trạng thái:**
  - Rỗng: AI chưa gợi ý xong (loading)
  - Sẵn sàng: AI gợi ý + HR có thể thêm/xoá/sửa
  - Tối đa: 5 kỹ năng, nút "+ Thêm" bị tắt
  - Đang sửa: HR đang chỉnh sửa tên kỹ năng

**Bước 4: Kỹ năng & Câu hỏi (Editor theo từng skill)**
- Với mỗi kỹ năng:
  - Tên kỹ năng (text field có thể sửa)
  - Nút: "Thêm câu hỏi", "Xoá kỹ năng"
  - Danh sách câu hỏi (có thể mở rộng/thu gọn):
    - Mỗi câu là textarea có thể sửa
    - Nút per câu: "Sửa", "Xoá"
  - **Cách hiển thị:** Skill card (có thể gập/mở)
- Nút: "Thêm kỹ năng mới" (nếu < 5 kỹ năng)
- Nút: "Tiếp tục"
- **Trạng thái:**
  - Đang sửa: các field là text input
  - Xem: card gập hiện tên skill + số câu hỏi
  - Đang xử lý: "Đang tạo câu hỏi..."
  - Lỗi: "Không thể tạo. Thử lại?"

**Bước 5: Xem lại & Hoàn tất**
- Hiển thị tóm tắt (chỉ xem, không sửa):
  - Tên công việc, Level, Công ty
  - Kỹ năng: [Skill 1] (Q1, Q2, Q3), [Skill 2] (Q1, Q2), ...
  - Tổng số câu hỏi: X
- Nút: "Quay lại sửa", "Tạo link"
- **Trạng thái:**
  - Sẵn sàng: toàn bộ dữ liệu đã điền, nút bật
  - Đang tạo: "Đang tạo link..." spinner
  - Thành công: "Link đã tạo! Sao chép bên dưới:"
    - Hiển thị link (có thể copy): `https://interview.app/session/abc123xyz`
    - Nút: "Copy vào clipboard"
  - Lỗi: "Không thể tạo link. Thử lại?"

### Màn hình 2a: Candidate Welcome & Name Input

**URL:** `/interview/{SESSION_ID}`

**Layout:**
- Header: "Phỏng vấn [Tên công việc]"
- Nội dung chính:
  - Thông điệp: "Chuẩn bị cho cuộc phỏng vấn với AI"
  - Text: "Vui lòng nhập tên của bạn để chúng tôi bắt đầu"
  - Input field: "Tên của bạn..." (placeholder)
  - Button: "Bắt đầu phỏng vấn"
- **Trạng thái:**
  - Rỗng (mặc định): Input trống, button tắt
  - Có dữ liệu: Input có text, button bật
  - Đang tải: "Đang khởi động phỏng vấn..." spinner, button tắt
  - Error: "Không thể bắt đầu. Thử lại?" + text đỏ

### Màn hình 2b: Candidate Interview (Chat)

**URL:** `/interview/{SESSION_ID}` (sau khi nhập tên)

**Layout:**
- Header: "Phỏng vấn [Tên công việc]"
- Khu chat (có thể scroll):
  - Tin đầu tiên (AI): "Xin chào [Tên ứng viên]! Tôi sẽ phỏng vấn bạn cho vị trí [Tên công việc]. Bắt đầu thôi. [Câu hỏi đầu tiên]"
  - Tin xen kẽ: Câu hỏi AI → Trả lời ứng viên → Follow-up AI (nếu có) → Trả lời follow-up → Câu hỏi tiếp
  - Không thấy: số câu hỏi, tên kỹ năng, số lần hỏi, thanh tiến độ
- Khu nhập:
  - Textarea: "Câu trả lời của bạn..."
  - Nút: "Gửi"
  - Đếm ký tự: "500 ký tự còn lại"
- **Trạng thái:**
  - Đang xử lý: "AI đang suy nghĩ..." placeholder
  - Chờ input: input field bật, nút Gửi bật
  - Đang gửi: "Đang gửi..." spinner, nút tắt
  - Lỗi: "Mất kết nối. Thử lại?" + nút Thử lại
  - Kết thúc: "Cảm ơn bạn đã tham gia phỏng vấn! Kết quả đã được gửi cho HR."

### Màn hình 3: HR Admin — Danh sách Phỏng vấn

**URL:** `/admin`

**Cột trong bảng:**
- Tên ứng viên (hoặc "Ứng viên {ID}" nếu ẩn danh)
- Ngày tạo
- Trạng thái: Chuẩn bị / Đang phỏng vấn / Đã xong
- Lần cập nhật cuối
- Hành động: Click vào dòng → Mở trang review

**Trạng thái:**
- Trống: "Chưa có phỏng vấn nào. Tạo một phỏng vấn để bắt đầu."
- Đang tải: Skeleton rows
- Lỗi: "Không thể tải danh sách. Thử lại?"

### Màn hình 4: HR Review — Trang Kết quả

**URL:** `/review/{SESSION_ID}`

**Layout (Hai cột):**

**Cột trái (Chat History):**
- Header: "Lịch sử chat"
- Tin nhắn theo thứ tự:
  - Q1: [Nội dung câu hỏi]
  - A1: [Câu trả lời ứng viên]
  - Q1-Follow: [Follow-up của AI] (nếu có)
  - A1-Follow: [Trả lời follow-up] (nếu có)
  - Q2: [Nội dung câu hỏi]
  - A2: [Câu trả lời]
  - ... (toàn bộ tin, không sửa)
- Nút: "Copy tất cả chat"

**Cột phải (Rubric):**
- Header: "Bảng Đánh giá"
- Bảng:
  | Tên kỹ năng | Điểm | Bằng chứng |
  |---|---|---|
  | Giải quyết vấn đề | 7/10 | Trả lời Q1 tốt, gặp khó khăn với khả năng mở rộng... |
  | Giao tiếp | 8/10 | Giải thích rõ ràng, ví dụ hay... |
  | Kiến thức kỹ thuật | 6/10 | Kiến thức cơ bản, thiếu sâu về edge cases... |
- Nút export:
  - "Export PDF" (chat + rubric cùng file)
  - "Export CSV" (chỉ rubric)

**Trạng thái:**
- Đang tải: "Đang tạo bảng đánh giá..." spinner (Qwen xử lý)
- Sẵn sàng: Cả hai cột hiển thị
- Lỗi: "Không thể tạo rubric. Thử lại?"

---

## 4. Backend: API & Dịch vụ

### Các endpoint API

#### Giai đoạn Setup

**POST `/api/setup/parse-jd`**
- Input: `{ jd_text: string }`
- Output: `{ job_title: string, level: string, company: string }`
- Dịch vụ: JD Parser (gọi Qwen)
- Lỗi: 400 (input sai), 500 (API error)

**POST `/api/setup/suggest-skills`**
- Input: `{ jd_text: string }`
- Output: `{ skills: [string] }` (1-5 kỹ năng, AI tự quyết)
- Dịch vụ: Skills Suggestion (gọi Qwen)
- Lỗi: 400, 500

**POST `/api/setup/suggest-questions`**
- Input: `{ jd_text: string, skills: [string], job_title: string, level: string }`
- Output: `{ questions_by_skill: { [skill_name]: [string] } }`
- Dịch vụ: Question Suggestion (gọi Qwen)
- Lỗi: 400, 500

**POST `/api/setup/create-session`**
- Input: `{ job_title: string, level: string, company: string, skills: [{ name: string, questions: [string] }] }`
- Output: `{ session_id: string, interview_link: string }`
- Dịch vụ: Session Manager (lưu vào SQLite)
- Lỗi: 400, 500

#### Giai đoạn Interview

**POST `/api/interview/{SESSION_ID}/start`**
- Input: `{ candidate_name: string }`
- Output: `{ status: string, message: string }`
- Dịch vụ: Session Manager (lưu tên ứng viên vào SQLite, set status = "in_progress")
- Lỗi: 400 (name missing), 404, 500

**GET `/api/interview/{SESSION_ID}`**
- Output: `{ status: string, candidate_name: string, current_question_index: number, current_skill_index: number, message_history: [Message] }`
- Dịch vụ: Session Manager (đọc từ SQLite)
- Lỗi: 404 (session không tìm thấy), 500

**POST `/api/interview/{SESSION_ID}/message`**
- Input: `{ candidate_answer: string }`
- Output: `{ ai_response: string, next_action: "follow_up" | "next_question" | "end_interview" }`
- Dịch vụ: Interview Engine + AI Integration (gọi Qwen)
- Lỗi: 400, 404, 500

#### Giai đoạn Review

**GET `/api/review/{SESSION_ID}`**
- Output: `{ messages: [Message], rubric: Rubric }`
- Dịch vụ: Session Manager + Rubric Generator
- Lỗi: 404, 500

**POST `/api/review/{SESSION_ID}/export`**
- Input: `{ format: "pdf" | "csv" }`
- Output: File download (PDF hoặc CSV)
- Dịch vụ: Export Service
- Lỗi: 400, 404, 500

---

## 5. Database Schema (SQLite)

### Bảng: sessions (Phiên làm việc)
```
session_id (TEXT PRIMARY KEY)
hr_email (TEXT)
job_title (TEXT)
level (TEXT)
company (TEXT)
skills (TEXT) -- JSON array stringify
questions_by_skill (TEXT) -- JSON object stringify: { "Skill1": ["Q1", "Q2"], "Skill2": ["Q1"] }
candidate_name (TEXT, nullable) -- Tên ứng viên, set khi bắt đầu interview
status (TEXT) -- "setup", "in_progress", "completed"
created_at (DATETIME)
started_at (DATETIME, nullable)
completed_at (DATETIME, nullable)
```

### Bảng: messages (Tin nhắn)
```
message_id (INTEGER PRIMARY KEY AUTOINCREMENT)
session_id (TEXT FOREIGN KEY → sessions.session_id)
sender (TEXT) -- "ai" hoặc "candidate"
content (TEXT)
skill_being_evaluated (TEXT, nullable)
question_index (INTEGER, nullable)
attempt_number (INTEGER, nullable)
created_at (DATETIME)
```

### Bảng: rubrics (Bảng đánh giá)
```
rubric_id (INTEGER PRIMARY KEY AUTOINCREMENT)
session_id (TEXT FOREIGN KEY → sessions.session_id)
skill_name (TEXT)
score (FLOAT)
evidence (TEXT)
strengths (TEXT) -- JSON array stringify
weaknesses (TEXT) -- JSON array stringify
created_at (DATETIME)
```

---

## 6. Các dịch vụ Backend (Phân chia module)

### Dịch vụ 1: JD Parser (Tách Job Description)
- Input: Text Job Description
- Quá trình: Gọi Qwen API với prompt: "Tách tên công việc, level, công ty từ JD này: {jd_text}"
- Output: Các field đã tách
- Xử lý lỗi: Retry khi timeout, fallback đến giá trị mặc định

### Dịch vụ 2: Skills Suggester (Gợi ý kỹ năng)
- Input: Text JD (không cần num_skills, AI tự quyết)
- Quá trình: Gọi Qwen API: "Gợi ý 1-5 kỹ năng để đánh giá cho vị trí {level} {job_title} dựa trên JD này"
- Output: Danh sách kỹ năng (1-5 items)
- Xử lý lỗi: Retry khi timeout, return danh sách rỗng

### Dịch vụ 3: Question Generator (Tạo câu hỏi)
- Input: Text JD + danh sách skill + job_title + level
- Quá trình: Với mỗi skill, gọi Qwen API: "Tạo câu hỏi phỏng vấn để đánh giá {skill} cho ứng viên {level} vị trí {job_title}"
- Output: Câu hỏi per skill (số lượng khác nhau, không cố định)
- Xử lý lỗi: Retry khi timeout, return câu hỏi generic

### Dịch vụ 4: Interview Engine (Máy phỏng vấn)
- State machine: Theo dõi current_skill_index, current_question_index, attempt_count
- Logic:
  ```
  skill_idx = 0
  question_idx = 0
  
  while skill_idx < num_skills:
    attempt = 0
    while attempt < 3:
      attempt += 1
      // Gửi câu hỏi cho frontend
      // Chờ câu trả lời ứng viên
      // Gọi AI Evaluator
      if answer_good OR attempt == 3:
        question_idx += 1
        break
    
    if question_idx >= num_questions_in_skill:
      question_idx = 0
      skill_idx += 1
  
  // Phỏng vấn xong
  ```
- Lưu trữ: Lưu state vào SQLite sau mỗi tin nhắn

### Dịch vụ 5: AI Integration (Nhà phỏng vấn AI)
- Input: Câu hỏi hiện tại, các câu trả lời trước, tên skill, số lần hỏi
- Quá trình: Xây dựng system prompt + gọi Qwen API
- Output: Câu trả lời AI (có hoặc không có marker `[[ANSWER_GOOD]]`)
- Parsing: Kiểm tra marker để quyết định hành động tiếp theo

**Mẫu System Prompt:**
```
Bạn đang phỏng vấn cho vị trí {job_title} ở level {level}.
Tên ứng viên: {candidate_name}

Câu hỏi hiện tại: {question_text}
Kỹ năng đang đánh giá: {skill_name}
Đây là lần hỏi {attempt_number}/3.

Hướng dẫn:
1. Hỏi câu hỏi một cách tự nhiên, như trong hội thoại.
2. Sử dụng tên ứng viên ({candidate_name}) khi chào hỏi để tạo cảm giác thân thiện.
3. Chờ câu trả lời của ứng viên.
4. Đánh giá câu trả lời:
   - Nó có chi tiết, trả lời đầy đủ không? (câu trả lời tốt)
   - Nó có mơ hồ, không đầy đủ, không trả lời câu hỏi không? (câu trả lời yếu)
5. Nếu câu trả lời tốt:
   - Phát biểu tích cực.
   - Kết thúc bằng: [[ANSWER_GOOD]]
6. Nếu câu trả lời yếu VÀ lần hỏi < 3:
   - Hỏi ONE follow-up: "Bạn có thể kể thêm về [phần cụ thể] không?"
7. Nếu lần hỏi = 3:
   - Cảm ơn ứng viên về câu trả lời (đừng đánh dấu là tốt).
   - Chờ backend gửi câu hỏi tiếp theo.
```

### Dịch vụ 6: Rubric Generator (Tạo bảng đánh giá)
- Input: Chat history + metadata session (danh sách skill)
- Quá trình: Với mỗi skill, gọi Qwen API: "Phân tích chat history này và đánh giá {skill} từ 0-10. Cung cấp bằng chứng từ chat."
- Output: Rubric (skill, điểm, bằng chứng)
- Xử lý lỗi: Retry khi timeout, return rubric rỗng

### Dịch vụ 7: Export Service (Xuất dữ liệu)
- PDF: Gộp chat history + rubric thành PDF có format (dùng thư viện như `pdfkit`)
- CSV: Export bảng rubric thành CSV
- Xử lý lỗi: Fallback đến plain text nếu PDF generation fail

---

## 7. Xử lý lỗi & Trường hợp đặc biệt

| Tình huống | Cách xử lý |
|-----------|-----------|
| Tách JD fail | Hiển thị lỗi, cho HR thử lại hoặc bỏ qua tách |
| Gợi ý skill fail | Hiển thị lỗi, gợi ý HR nhập skill thủ công |
| Tạo câu hỏi fail | Hiển thị lỗi, gợi ý HR nhập câu hỏi thủ công |
| Ứng viên bỏ cuộc | Session ở "in_progress", HR có thể thử lại link |
| Ứng viên im lặng (5 phút không reply) | Frontend hiển thị "Bạn còn đây không?" prompt, auto-timeout sau 15 phút |
| AI từ chối trả lời (safety filter) | System prompt tránh trigger filter; nếu trigger, log + hiển thị "AI không thể trả lời, vui lòng phát biểu lại" |
| API timeout (Qwen không respond trong 30s) | Retry 1 lần; nếu vẫn timeout, hiển thị lỗi cho user |
| SQLite locked (concurrent writes) | Retry với exponential backoff |
| Export fail | Hiển thị lỗi, nút "Thử lại" |

---

## 8. Tiêu chí Thành công

**Cho HR:**
- [ ] Tạo phỏng vấn từ JD trong <3 phút (5 bước)
- [ ] Xem kết quả ứng viên: chat + rubric
- [ ] Export PDF và CSV

**Cho Ứng viên:**
- [ ] Mở link không cần login
- [ ] Chat cảm giác tự nhiên (AI không nghe như robot)
- [ ] Không thấy tiêu chí đánh giá, số câu, tiến độ
- [ ] Nhận được xác nhận hoàn tất

**Cho App:**
- [ ] Phỏng vấn ≤ 15 tin (câu hỏi + follow-up)
- [ ] Điểm rubric phản ánh chat (bằng chứng chính xác)
- [ ] Không crash hoặc lỗi 500
- [ ] Export file đầy đủ và có thể đọc

---

## 9. Thứ tự triển khai (Dependency Graph)

1. **Dịch vụ Setup** (độc lập, test với dữ liệu fake)
   - JD Parser ✓ (chỉ phụ thuộc Qwen API)
   - Skills Suggester ✓
   - Question Generator ✓
   - Session Manager ✓ (SQLite setup)

2. **Interview Phase** (phụ thuộc Session Manager)
   - Interview Engine ✓ (state machine)
   - AI Integration ✓ (phụ thuộc Qwen API + Interview Engine)

3. **Review Phase** (phụ thuộc Session Manager + Interview Engine)
   - Rubric Generator ✓ (phụ thuộc Qwen API + message history)
   - Export Service ✓

4. **Frontend** (phụ thuộc toàn bộ backend services)
   - HR Setup screens ✓
   - Candidate Interview chat ✓
   - HR Review results ✓

---

## 10. Ghi chú triển khai

1. **Lưu API Key:** File `.env` (không commit), load bằng `dotenv` package
2. **Qwen API:** Dùng `axios` hoặc `node-fetch` gọi HTTP
3. **SQLite:** Dùng `better-sqlite3` hoặc `sqlite3` package
4. **UI:** Giữ đơn giản (vanilla HTML/CSS/JS hoặc lightweight như Alpine.js)
5. **Testing:** Dùng fake data (fake JD, fake câu trả lời) — KHÔNG DÙNG dữ liệu thật
6. **Logging:** Ghi nhật ký sự kiện quan trọng (session tạo, phỏng vấn bắt đầu, lỗi) để debug

---

**Hết Implementation Spec (Updated)**
