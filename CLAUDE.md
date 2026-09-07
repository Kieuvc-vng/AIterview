# CLAUDE.md — Vibe-Code Workshop

Copy nguyên file này vào thư mục gốc của project. Không cần sửa gì, trừ dòng tên nhóm ở dưới.

**Nhóm:** Kiểu + Tiến
**Project:** App để AI phỏng vấn với ứng viên

---

## 1. Người dùng file này không phải dân code

Luôn giải thích bằng ngôn ngữ bình thường, như nói với người không biết gì về tech. Không dùng thuật ngữ nếu không giải thích ngay. Nếu bắt buộc phải dùng, viết một câu ngắn giải thích nó là gì.

Mỗi khi đề xuất một hướng làm, luôn nói kèm:
- Cách này được gì, mất gì (trade-off)
- Nếu không được thì phương án thay thế là gì

Khi người dùng nói "không hiểu" hoặc "giải thích lại", giải thích đơn giản hơn nữa. Đừng lặp lại y nguyên câu cũ.

## 2. Làm từng phần nhỏ

Không build cả app trong một lần. Khi người dùng yêu cầu một thứ lớn, chia nhỏ ra trước, hỏi lại xem làm phần nào trước, rồi mới làm.

Sau mỗi phần: nói rõ vừa làm xong cái gì, và cách để người dùng tự kiểm tra xem nó chạy đúng chưa.

## 3. Nhật ký — quy tắc quan trọng nhất

Project này có file `diary.md`. Mỗi ngày làm việc phải có một entry trong đó.

### 3.1. Đầu mỗi session — kiểm tra

Ngay khi bắt đầu một session mới, đọc file `diary.md`:

- Nếu file chưa tồn tại → tạo file, không cần nhắc gì.
- Nếu entry cuối cùng **không phải hôm nay** → nói **đúng một dòng** nhắc, ví dụ:
  *"Lần làm gần nhất là ngày 08/09 mà chưa có entry. Ghi bù giờ nhé, hay để lát nữa?"*
- Nếu entry cuối cùng là hôm nay → không nhắc gì cả.

Nhắc xong thì làm tiếp việc người dùng yêu cầu, dù họ trả lời gì.

### 3.2. Khi người dùng có vẻ sắp nghỉ — hỏi một lần

Khi người dùng nói những câu kiểu "xong rồi", "nghỉ đây", "để mai làm tiếp", "tạm vậy đã" → hỏi:
*"Ghi diary hôm nay trước khi nghỉ nhé?"*

### 3.3. Giới hạn nhắc

**Tối đa 2 lần mỗi session.** Sau 2 lần, hoặc sau khi người dùng đã từ chối, không nhắc nữa trong session đó.

Không bao giờ nhắc giữa lúc đang debug, đang sửa lỗi, hoặc đang chờ kết quả. Chỉ nhắc ở đầu session và lúc họ có vẻ sắp dừng.

### 3.4. Khi người dùng gõ `/recap` (hoặc nói "ghi diary")

Làm theo đúng thứ tự sau:

**Bước 1 — tự viết phần dữ kiện.** Nhìn lại session hôm nay và ghi:
- Hôm nay người dùng nhờ làm những gì
- Mình đã làm ra cái gì, chạy được hay chưa
- Đang ở bước nào trong 5 bước: Break down · Reality check · Clarify goal · Spec → Build · Test

**Bước 2 — hỏi lại người dùng đúng một câu:**
*"Hôm nay có chỗ nào bạn chưa hiểu, hoặc thấy lấn cấn không?"*

Chờ họ trả lời. **Tuyệt đối không tự bịa hoặc tự đoán câu trả lời này.** Nếu họ nói "không có gì" thì ghi đúng "không có gì".

**Bước 3 — ghi vào cuối file `diary.md`** theo đúng mẫu:

```
## 09/09 — Kỳ

**Nhờ làm:** màn hình cho dán file vào + nút bấm
**Claude làm:** xong, bấm nút thì hiện tên file ra màn hình
**Bước:** 3 — Spec → Build
**Chưa hiểu:** sao phải tách làm 2 phần, một phần chạy trên máy mình một phần không
```

### 3.5. Cách viết trong diary

Viết cho người không biết code đọc. Người đọc file này là Alex và Triết ở buổi checkpoint.

- ❌ "refactor extraction handler để strip fenced JSON"
- ✅ "sửa chỗ bóc kết quả, vì model hay trả lời kèm chữ thừa ở đầu"

Ngắn thôi — mỗi mục 1–2 dòng. Không cần tên file, không cần tên hàm.

Nếu trong ngày làm nhiều lần thì gộp vào một entry của ngày hôm đó, đừng tạo nhiều entry cùng ngày.

## 4. Dữ liệu

Chỉ dùng dữ liệu giả để test. Không dùng CV thật, tên ứng viên thật, ghi chú phỏng vấn thật, hay bất kỳ thông tin cá nhân nào của người thật.

Nếu người dùng đưa dữ liệu có vẻ là thật, nhắc họ một lần rồi đề nghị tạo dữ liệu giả tương tự để test.

## 5. API key

API key không bao giờ được nằm ở phần chạy trên trình duyệt. Luôn để ở backend, trong file `.env`, và `.env` phải nằm trong `.gitignore`.

Nếu người dùng dán API key thẳng vào chat, nhắc họ đổi key đó và hướng dẫn cách đặt vào `.env`.

## 6. Quy trình bắt buộc: Spec → Implementation plan → Build

Project này dùng 2 bộ skill, phải cài cả hai trước khi bắt đầu:

- **Superpowers** (https://github.com/obra/superpowers) — quy trình làm việc.
- **Design skills của Emil Kowalski** (https://github.com/emilkowalski/skills) — chuẩn chất lượng giao diện.

Mọi yêu cầu tạo mới hoặc thay đổi tính năng phải đi qua đúng 3 bước, đúng thứ tự:

1. **Spec** — dùng skill `superpowers:brainstorming`. Hỏi từng câu một để chốt: app/tính năng này cho ai, xong thì trông thế nào mới gọi là xong, cái gì **không** làm. Không đoán ý người dùng. Nếu tính năng có giao diện, spec phải chốt cả: người dùng thấy gì trên màn hình, và thấy gì ở 3 trạng thái **đang chờ / chưa có dữ liệu / lỗi**. Người dùng chưa hình dung được giao diện thì đề nghị dùng `prototype` để dựng 2–3 phương án cho họ chọn; nguyên tắc thiết kế tham chiếu `apple-design`.
2. **Implementation plan** — dùng `superpowers:writing-plans`. Chẻ spec thành các việc nhỏ 2–5 phút, có thứ tự. Kế hoạch phải có việc cụ thể cho phần giao diện (3 trạng thái ở trên, phản hồi khi bấm, chuyển động khi đổi màn hình) — không được để phần này thành "làm đẹp sau". Cần thành phần giao diện có sẵn (bảng, dropdown, popup, toast…) thì dùng `pick-ui-library` để chọn thư viện, đừng tự dựng lại từ đầu. Đưa kế hoạch cho người dùng đọc và đồng ý **trước khi** bắt đầu làm.
3. **Build** — dùng `superpowers:executing-plans` (hoặc `superpowers:subagent-driven-development`), làm lần lượt từng việc trong kế hoạch, kèm test (`superpowers:test-driven-development`). Sau đó soát lại bằng `superpowers:requesting-code-review` và `superpowers:verification-before-completion`.

**Mọi thứ có giao diện đều phải theo `emil-design-eng`** — không chờ người dùng nhắc. Làm một chuyển động cụ thể thì dùng `animate`; đừng tự chọn thời lượng/đường cong theo cảm tính. Toast dùng Sonner thì tham chiếu `ask-sonner`.

Trước khi merge một tính năng có giao diện, tự chạy `review-animations` và `find-animation-opportunities`, rồi báo người dùng những gì tìm được. `improve-animations` chỉ chạy khi app đã tương đối đủ tính năng, và chỉ làm các mục ưu tiên cao — đừng làm sạch danh sách.

Người dùng mô tả cảm giác mà không biết gọi tên (*"kiểu nó nảy một cái"*) thì dùng `animation-vocabulary` để dịch thành thuật ngữ đúng, rồi xác nhận lại với họ trước khi làm.

Không viết code khi chưa có spec và plan được người dùng đồng ý — kể cả khi việc trông nhỏ.

Nếu người dùng đòi code luôn: nhắc **một** câu ngắn về 3 bước này. Họ vẫn muốn code luôn thì làm theo họ, đừng nhắc lại.

Chỉ nói "xong" khi đã tự chạy thử và thấy nó chạy thật. Không suy đoán, không báo xong khi chưa kiểm chứng.

## 7. Git — không bao giờ commit trực tiếp vào `main`

`main` là bản luôn chạy được. Mọi thay đổi phải làm trên một nhánh riêng cho từng tính năng.

- **Trước khi commit, luôn kiểm tra đang ở nhánh nào** (`git branch --show-current`). Nếu là `main` → dừng, tạo nhánh trước đã.
- **1 nhánh = 1 tính năng.** Đặt tên dễ đọc: `feature/upload-cv`, `fix/loi-hien-thi`.
- **Chỉ merge vào `main` khi tính năng chạy đúng** và người dùng đã tự bấm thử.
- **Merge xong mới mở nhánh mới.** Không làm 2 tính năng song song.
- **Nhiều người làm chung repo:** mỗi khi `main` có thay đổi mới, kéo `main` về nhánh đang làm (`git pull origin main`) rồi **test lại** trước khi merge.
- **Không tự chạy các lệnh Git có thể làm mất việc** (`reset --hard`, `push --force`, xoá nhánh) mà chưa hỏi và chưa giải thích hậu quả.
- Người dùng không phải dân code: trước khi chạy lệnh Git, nói một câu lệnh đó làm gì.
