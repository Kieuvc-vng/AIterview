# Phase 3: HR Xem Kết Quả Phỏng Vấn

**Ngày:** 15/09/2026
**Project:** App AIterview
**Tác giả:** Kiểu + Tiến + Claude
**Nhánh:** feature/job-library-phase3-frontend

---

## 1. Tóm Tắt

Sau khi ứng viên phỏng vấn xong (Phase 2), HR cần xem kết quả. Phase 3 xây dựng giao diện để HR:
- Xem danh sách ứng viên theo từng job với trạng thái rõ ràng
- Đọc tóm tắt AI cho ứng viên đã hoàn thành
- Xem full chat nếu cần chi tiết
- Nhắc ứng viên chưa làm bài
- Xuất kết quả ra PDF/CSV

**Vị trí trong app:** Mở rộng modal "Danh Sách Ứng Viên" trên trang Job Library (`library.html`), không tạo trang mới.

---

## 2. Giao Diện — Danh Sách Ứng Viên (Modal)

Khi HR bấm "Xem Ứng Viên" trên Job Library, modal mở ra.

### Mỗi ứng viên là 1 card:

- **Tên** (in đậm)
- **Trạng thái:** badge màu
  - "Chưa hoàn thành" — badge cam
  - "Đã hoàn thành" — badge xanh
- **Nút "Copy link test"** — bấm copy link vào clipboard, hiện "Đã copy" 2 giây. Không hiện ô URL trên giao diện.

### Ứng viên "Chưa hoàn thành":

- Dòng chữ nhỏ: "Đã gửi X ngày trước" (tính từ `created_at` của candidate)
- Nút "Nhắc làm bài":
  - Bấm → nút chuyển "Đang gửi..." (disable)
  - Sau 1 giây → "Đã gửi ✓" (disable, màu xám)
  - Giả lập: chưa gửi email thật, chỉ hiện thông báo xác nhận

### Ứng viên "Đã hoàn thành":

- **Phần tóm tắt (accordion):** mặc định thu gọn
  - Bấm mở → hiện danh sách câu hỏi + tóm tắt 1-2 dòng, nhóm theo skill
  - Mỗi câu hỏi: tên câu hỏi + tóm tắt chính + tóm tắt follow-up (nếu có)
- **Nút "Xem toàn bộ câu trả lời"** — mở modal thứ 2 hiện full chat
- **Nút "Xuất PDF" / "Xuất CSV"** — mỗi nút có dropdown: "Tóm tắt" hoặc "Full chat"

---

## 3. Giao Diện — Modal Xem Full Chat

Khi HR bấm "Xem toàn bộ câu trả lời", mở modal thứ 2 (đè lên modal danh sách):

- **Header:** Tên ứng viên + tên job
- **Nội dung:** Tin nhắn theo thứ tự thời gian, kiểu chat bubble:
  - AI (interviewer) — căn trái, nền xám nhạt
  - Ứng viên — căn phải, nền xanh nhạt
- **Nút đóng** — đóng modal chat, quay lại modal danh sách
- Thanh cuộn nếu chat dài

---

## 4. Backend — API Mới

### 4.1 GET /api/job-library/candidates/:candidateId/results

Lấy kết quả 1 ứng viên.

**Response:**
```json
{
  "candidate": { "id", "name", "email", "phone", "interview_status", "created_at" },
  "summaries": [
    {
      "skill_name": "Python",
      "question_index": 0,
      "question_text": "Câu hỏi...",
      "main_answer_summary": "Tóm tắt 1-2 dòng",
      "followup_summary": "Tóm tắt follow-up"
    }
  ],
  "messages": [
    { "sender": "ai", "content": "...", "created_at": "..." },
    { "sender": "candidate", "content": "...", "created_at": "..." }
  ]
}
```

### 4.2 POST /api/job-library/candidates/:candidateId/remind

Giả lập gửi email nhắc nhở.

**Response:**
```json
{ "success": true, "message": "Đã gửi nhắc nhở đến candidate@email.com" }
```

### 4.3 POST /api/job-library/candidates/:candidateId/export

Xuất kết quả ra file.

**Request body:**
```json
{ "format": "pdf" | "csv", "content": "summary" | "full" }
```

**Response:** File download (PDF hoặc CSV).

---

## 5. Backend — Cập Nhật Code Hiện Có

### 5.1 summaryGenerator.js

Thêm hàm `generateAllSummaries(interview_id)`:
- Lấy tất cả messages của interview
- Nhóm theo skill_name + question_index
- Gọi AI tóm tắt từng câu hỏi
- Lưu tất cả summaries vào bảng `summaries`

### 5.2 exportService.js

Cập nhật `generatePDF` / `generateCSV`:
- Thay rubrics bằng summaries
- Thêm mode `content: "full"` xuất full chat thay vì tóm tắt

### 5.3 Trigger tóm tắt tự động

Khi interview status chuyển sang `completed`:
- Gọi `generateAllSummaries(interview_id)` 
- Lưu sẵn vào DB để HR mở ra thấy liền

---

## 6. Trạng Thái Đặc Biệt

### Chưa có ứng viên:
- Modal hiện: "Chưa có ứng viên nào. Bấm 'Tạo Ứng Viên' để thêm."

### Đang load tóm tắt:
- Spinner nhỏ + "Đang tải tóm tắt..." trong vùng accordion

### Đã hoàn thành nhưng chưa có tóm tắt (AI lỗi hoặc chưa chạy kịp):
- Dòng chữ: "Chưa có tóm tắt. Đang xử lý, vui lòng thử lại sau."
- Nút "Thử lại" — gọi API tạo tóm tắt lại

### Export bị lỗi:
- Toast thông báo: "Xuất file thất bại, vui lòng thử lại"

---

## 7. Database

Dùng schema hiện tại, không cần thêm bảng:
- `candidates` — đã có `interview_status`, `created_at`, `interview_link`
- `summaries` — đã có `interview_id`, `skill_name`, `question_index`, `question_text`, `main_answer_summary`, `followup_summary`
- `messages` — đã có `interview_id`, `sender`, `content`, `created_at`
- `interviews` — đã có `candidate_id`, `job_id`, `status`

---

## 8. Ngoài Scope

- Gửi email thật (giả lập trước, tích hợp sau)
- Xuất toàn bộ ứng viên gộp 1 file (mỗi ứng viên export riêng)
- Trang riêng cho kết quả (giữ trong modal)
- Chấm điểm / rubric (đã bỏ, chỉ dùng tóm tắt)

---

## 9. Tiêu Chí Thành Công

- HR mở modal thấy danh sách ứng viên với trạng thái đúng
- Ứng viên "Đã hoàn thành" có tóm tắt AI hiển thị đúng, nhóm theo skill
- HR xem được full chat trong modal thứ 2
- Copy link test hoạt động (ẩn URL, chỉ có nút copy)
- Nút nhắc làm bài hiện xác nhận (giả lập)
- Export PDF/CSV hoạt động với 2 mode: tóm tắt và full chat
- Các trạng thái loading/lỗi/trống hiển thị đúng
