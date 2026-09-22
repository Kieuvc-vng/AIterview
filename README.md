# AIterview — AI-Powered Interview Platform

App để HR phỏng vấn ứng viên bằng AI, quản lý kỹ năng, và đánh giá tự động.

**Nhóm:** Kiểu + Tiến
**Project:** Platform phỏng vấn tương tác với AI, cho phép HR tạo job, quản lý ứng viên, và sinh báo cáo đánh giá

---

## Trong repo này có gì

| File | Dùng để làm gì |
|---|---|
| `CLAUDE.md` | Bản "nội quy" cho Claude Code. Nó tự đọc file này mỗi lần mở project, nên không cần nhắc lại các quy tắc trong chat. |
| `diary.md` | Nhật ký làm việc. Mỗi ngày có làm thì ghi một entry. Đây là thứ Alex và Triết đọc ở buổi checkpoint. |
| `README.md` | File bạn đang đọc: cách bắt đầu và cách làm việc. |
| `.gitignore` | Danh sách file **không** đưa lên GitHub (quan trọng nhất: `.env` chứa API key). |

---

## Tính năng đã làm

### ✅ Job Library Management
- **Tạo Job mới:** HR điền JD → hệ thống extract fields tự động (title, level, company)
- **Quản lý kỹ năng:** AI detect skills từ nội dung JD (25+ keywords: Python, React, AWS, Leadership, etc.)
- **Sinh câu hỏi:** Tự động tạo 3 câu hỏi cho từng skill
- **Edit job:** Sửa thông tin job sau khi tạo, dữ liệu được giữ nguyên (không re-detect)
- **Delete job:** Xoá job với confirmation modal, cascade delete candidates

### ✅ Candidate Management
- **Thêm ứng viên:** Nhập tên, email, điện thoại cho từng job
- **Generate link:** Tạo interview link duy nhất cho mỗi candidate
- **Copy link:** Copy to clipboard để gửi email/chat

### ✅ Interview Engine
- **Start interview:** Candidate vào link → phỏng vấn với AI
- **3-pass evaluation:** Hệ thống hỏi 3 lần mỗi skill, theo dõi tiến độ
- **Real-time feedback:** AI đánh giá từng câu trả lời, gợi ý follow-up questions

### ✅ Review & Export
- **Rubric scoring:** Tự động tính điểm 0-10 mỗi skill dựa trên chat
- **PDF report:** Export báo cáo phỏng vấn (kỹ năng, điểm, chứng cứ)
- **CSV export:** Xuất dữ liệu candidate cho phân tích

### ✅ UI/UX
- **Landing page:** Thư Viện Job (default khi mở app)
- **Multi-step form:** Setup page 5 bước (JD → Details → Skills → Questions → Create)
- **Job cards:** Hiển thị job info, 4 action buttons (View candidates, Add candidate, Edit, Delete)
- **Modal popups:** Job detail view, delete confirmation, candidate list

---

## Bước 0 — Cài 2 bộ skill trước khi kick-off

**Việc đầu tiên, trước cả dòng code đầu tiên:** cài 2 bộ skill cho Claude Code.

| Bộ skill | Repo | Lo phần gì |
|---|---|---|
| **Superpowers** | https://github.com/obra/superpowers | *Cách làm việc*: buộc phải hỏi cho rõ → viết kế hoạch → mới làm |
| **Design skills** (Emil Kowalski) | https://github.com/emilkowalski/skills | *Chất lượng giao diện*: app trông và "cảm giác" như đồ thật, không phải bản nháp |

Không có Superpowers, Claude có xu hướng đoán ý bạn rồi code luôn. Không có bộ design, app sẽ chạy đúng nhưng trông thô — chữ lệch, bấm nút không có phản hồi, chuyển màn hình giật cục. Ở một buổi demo, cái người ta thấy đầu tiên chính là mấy chỗ đó.

### a) Superpowers

Mở Claude Code rồi gõ (chọn **một** trong hai cách):

```
/plugin install superpowers@claude-plugins-official
```

hoặc, nếu cách trên không thấy plugin:

```
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

Kiểm tra đã cài được chưa: gõ `/plugin` và tìm `superpowers` trong danh sách. Cài xong nên khởi động lại Claude Code một lần.

> Lưu ý: các lệnh `/plugin` chỉ chạy trong cửa sổ Claude Code (terminal), không phải trong Terminal thường của máy.

### b) Design skills

Cái này **không** phải lệnh `/plugin`. Mở Terminal thường của máy, `cd` vào thư mục project rồi chạy:

```
npx skills@latest add emilkowalski/skills
```

Cần có **Node.js** trên máy trước (kiểm tra bằng `node -v`; chưa có thì tải ở https://nodejs.org). Nếu nó hỏi cài package `skills` thì đồng ý; nó cũng có thể hỏi bạn đang dùng agent nào — chọn **Claude Code**.

> Lệnh này có thể cài skill vào **trong project** (thư mục `.claude/skills/`) hoặc vào **máy của bạn** — tuỳ phiên bản, tài liệu của họ không nói rõ. Chạy xong cứ kiểm tra: nếu trong project xuất hiện thư mục `.claude/skills/` thì **commit nó lên GitHub** để người kia có luôn, không phải cài lại. Nếu không thấy → nghĩa là cài vào máy, và **người thứ hai trong nhóm phải tự chạy lại lệnh này** trên máy của họ.

Cài xong bạn sẽ có các skill sau — không cần nhớ hết, chỉ cần biết chúng tồn tại để gọi tên khi cần:

| Skill | Dùng khi nào |
|---|---|
| `emil-design-eng` | Skill chính. Chuẩn chung cho mọi thứ có giao diện. |
| `prototype` | Muốn xem 2–3 phương án UI khác nhau trước khi chọn. |
| `pick-ui-library` | Chọn thư viện giao diện cho đúng việc, đừng tự vẽ lại từ đầu. |
| `apple-design` | Nguyên tắc thiết kế + chuyển động kiểu Apple. |
| `animate` | Làm một chuyển động cụ thể (mở popup, đổi màn hình…). |
| `find-animation-opportunities` | Tìm chỗ nào trong app đang thiếu chuyển động. |
| `review-animations` | Soát lại các chuyển động đã làm, khắt khe. |
| `improve-animations` | Rà toàn bộ app, ra danh sách việc cần sửa theo thứ tự ưu tiên. |
| `animation-vocabulary` | Bạn mô tả được cảm giác muốn có nhưng không biết gọi nó là gì. |
| `ask-sonner` | Làm thông báo pop-up (toast) bằng Sonner. |

Kiểm tra đã cài chưa: hỏi Claude *"bạn đang có những skill nào?"* — trong danh sách phải thấy `emil-design-eng`.

---

## Quy tắc quan trọng nhất: Spec → Implementation plan → Build

**Mọi thứ nhóm làm trong project này đều phải đi qua đúng 3 bước này, theo đúng thứ tự.** Không nhảy thẳng vào build — dù việc trông có vẻ nhỏ.

### 1. Spec — chốt xem mình đang làm cái gì

Nói với Claude: *"mình muốn làm X, dùng skill brainstorming trước nhé"* (skill `superpowers:brainstorming`).

Nó sẽ hỏi bạn từng câu một để đào cho rõ ý: ai dùng, dùng để làm gì, xong thì trông thế nào là xong, cái gì **không** làm. Kết quả là một bản **spec** — mô tả rõ ràng thứ cần làm, viết bằng tiếng người.

Đừng bỏ qua bước này vì "mình biết rồi". Phần lớn thời gian mất oan là do bắt tay làm khi hai người trong nhóm còn đang hiểu khác nhau.

**Spec phải nói cả phần giao diện, không chỉ phần chức năng.** Chốt luôn trong spec: người dùng thấy gì trên màn hình, lúc đang chờ thì thấy gì, lúc chưa có dữ liệu gì thì thấy gì, lúc lỗi thì thấy gì. Ba trạng thái *chờ / trống / lỗi* là thứ hay bị bỏ quên nhất và cũng là thứ làm app trông như bản nháp.

Chưa hình dung được giao diện thì nói: *"dùng skill `prototype` làm 2–3 phương án cho màn hình này"* — xem rồi chọn, dễ hơn ngồi tưởng tượng. Muốn biết nguyên tắc nào là đúng thì nhờ Claude đọc `apple-design`.

### 2. Implementation plan — chốt xem làm theo thứ tự nào

Nói: *"viết implementation plan cho spec này"* (skill `superpowers:writing-plans`).

Nó chẻ spec thành danh sách việc nhỏ, mỗi việc cỡ 2–5 phút, theo thứ tự làm. Đọc lại kế hoạch **trước khi** cho làm — chỗ nào bạn không hiểu thì hỏi ngay, sửa kế hoạch rẻ hơn sửa code rất nhiều.

**Kế hoạch phải có việc cho phần giao diện.** Nếu đọc kế hoạch mà chỉ thấy toàn việc "chạy được", không thấy việc nào về trạng thái chờ/trống/lỗi hay phản hồi khi bấm — bảo nó bổ sung: *"thêm việc cho phần UI theo `emil-design-eng` vào plan"*.

Nếu tính năng cần thành phần giao diện có sẵn (bảng, dropdown, popup, thông báo…), nói *"dùng skill `pick-ui-library` chọn thư viện trước"*. Tự vẽ lại từ đầu vừa lâu vừa xấu hơn.

### 3. Build — làm theo kế hoạch, từng việc một

Nói: *"làm theo plan"* (skill `superpowers:executing-plans` hoặc `superpowers:subagent-driven-development`).

Claude làm lần lượt từng việc trong kế hoạch, kèm test cho từng phần (`superpowers:test-driven-development`). Xong thì soát lại (`superpowers:requesting-code-review`), tự kiểm chứng là chạy thật (`superpowers:verification-before-completion`), rồi mới tính chuyện merge (`superpowers:finishing-a-development-branch`).

**Mọi việc có dính đến giao diện đều phải theo `emil-design-eng`.** Cứ nói một lần ở đầu bước build: *"phần UI làm theo `emil-design-eng`"*. Cần một chuyển động cụ thể (mở popup, đổi màn hình, hiện kết quả) thì nói *"dùng skill `animate`"* — nó sẽ tự chọn kiểu chuyển động, độ dài, đường cong cho đúng, thay vì bạn phải biết mấy thứ đó.

**Trước khi merge — 3 câu để soát phần giao diện:**

```
dùng skill review-animations soát lại các chuyển động vừa làm
dùng skill find-animation-opportunities xem còn chỗ nào thiếu phản hồi
dùng skill improve-animations rà cả app, cho mình danh sách theo ưu tiên
```

Câu thứ 3 chỉ cần chạy khi app đã tương đối đủ tính năng — nó ra một danh sách dài, làm từ trên xuống, đừng làm hết.

Mô tả được cảm giác muốn có nhưng không biết gọi là gì (*"kiểu nó nảy nảy một cái khi hiện ra"*) thì dùng `animation-vocabulary` — nó dịch giúp bạn thành đúng thuật ngữ để Claude làm ra được.

### Nếu Claude bắt đầu code mà chưa có spec + plan

Dừng nó lại. Gõ đúng một câu: *"chưa có spec và plan, làm brainstorming trước đã"*.

### 3 bước này khớp với 5 bước của workshop thế nào

| 5 bước workshop | Tương ứng với |
|---|---|
| Break down · Reality check · Clarify goal | **1. Spec** (brainstorming) |
| Spec → Build | **2. Implementation plan** rồi **3. Build** |
| Test | test trong lúc build + verification trước khi merge |

**Bộ design skill không phải một bước riêng ở cuối.** Nó chạy xuyên suốt cả 3 bước: chốt giao diện ngay từ spec, có việc UI trong plan, làm theo chuẩn khi build. Để phần "làm cho đẹp" đến cuối là lúc sửa đắt nhất — vì thường phải đục lại cấu trúc đã làm.

**Trade-off, nói thẳng:** cách này chậm hơn ở đầu — có khi 20 phút hỏi đáp mà chưa thấy dòng code nào. Đổi lại gần như không phải đập đi làm lại, và bạn hiểu được app của mình đang làm gì. Với việc siêu nhỏ (sửa một chữ trên màn hình) thì quy trình này hơi nặng — nhưng workshop này chấm cả cách làm, nên cứ theo đủ 3 bước.

---

## Bắt đầu trong 5 phút

0. **Cài Superpowers** — xem *Bước 0* ở trên. Chưa cài thì đừng bắt đầu.
1. **Clone repo về máy** (hoặc bấm *Use this template* trên GitHub rồi clone bản của nhóm mình).
2. **Mở thư mục project bằng Claude Code.**
3. **Sửa 2 chỗ duy nhất:** dòng *Nhóm* và *Project* ở đầu `CLAUDE.md` và `diary.md`. Phần còn lại của `CLAUDE.md` để nguyên.
4. **Xoá phần "Mẫu" trong `diary.md`** (2 entry ví dụ 09/09 và 10/09).
5. **Tạo nhánh cho tính năng đầu tiên** (đừng làm trên `main` — xem mục *Quy tắc Git*).
6. **Câu prompt đầu tiên:** kể cho Claude nghe bạn muốn làm app gì, bằng tiếng Việt bình thường, và nói *"dùng skill brainstorming trước nhé"*. Đừng cố viết cho "giống dân kỹ thuật".

> Nếu ở bước nào bạn không hiểu Claude đang nói gì — cứ gõ **"giải thích lại đơn giản hơn"**. `CLAUDE.md` đã yêu cầu nó phải giải thích lại theo cách dễ hơn, không được lặp lại y nguyên câu cũ.

---

## 5 bước của một tính năng

Mỗi tính năng đi qua 5 bước này. Khi ghi nhật ký, bạn chỉ cần nói mình đang ở bước nào.

1. **Break down** — chẻ ý tưởng lớn thành các phần nhỏ.
2. **Reality check** — phần nào làm được thật, phần nào quá sức, phần nào bỏ.
3. **Clarify goal** — chốt lại: xong thì trông như thế nào mới gọi là xong.
4. **Spec → Build** — mô tả rõ rồi để Claude làm.
5. **Test** — tự bấm thử, xem có đúng như mong đợi không.

---

## Cách làm việc với Claude Code

- **Làm từng phần nhỏ, đừng đòi cả app trong một lần.** App to thì Claude cũng làm được nhiều thứ một lúc, nhưng khi lỗi thì không ai biết lỗi ở đâu.
- **Sau mỗi phần, tự kiểm tra ngay.** Claude sẽ nói cách kiểm tra; làm đúng theo đó rồi mới sang phần sau.
- **Hỏi lại trade-off.** Trước khi đồng ý một hướng làm, hỏi *"cách này được gì mất gì, có cách khác không?"*.
- **Không hiểu thì nói ngay.** Ghi luôn chỗ chưa hiểu vào nhật ký — đó chính là phần giá trị nhất của buổi checkpoint.

---

## Nhật ký (`diary.md`)

Mỗi ngày có làm việc, trước khi tắt máy gõ:

```
/recap
```

Claude sẽ tự viết phần dữ kiện (hôm nay nhờ làm gì, nó làm ra gì, đang ở bước nào), rồi hỏi bạn **một câu**: *"Hôm nay có chỗ nào bạn chưa hiểu, hoặc thấy lấn cấn không?"*

Dòng **Chưa hiểu** là dòng duy nhất bạn phải tự trả lời. Nói thật, kể cả "không có gì". Mẫu một entry:

```
## 09/09 — Kỳ

**Nhờ làm:** màn hình cho dán file vào + nút bấm
**Claude làm:** xong, bấm nút thì hiện tên file ra màn hình
**Bước:** 3 — Spec → Build
**Chưa hiểu:** sao phải tách làm 2 phần, một phần chạy trên máy mình một phần không
```

Viết cho người không biết code đọc: *"sửa chỗ bóc kết quả, vì model hay trả lời kèm chữ thừa ở đầu"* — chứ không phải *"refactor extraction handler"*. Một ngày làm nhiều lần thì gộp vào một entry của ngày đó.

---

## Quy tắc Git — quan trọng, đọc kỹ

**Không bao giờ commit trực tiếp vào `main`.** Luôn làm trên một nhánh (branch) riêng cho từng tính năng. Xong tính năng đó, chạy được rồi, mới merge vào `main`; sau đó tạo nhánh mới cho tính năng tiếp theo.

Vì sao: `main` là bản "luôn chạy được". Nếu làm trực tiếp trên `main`, một thay đổi lỗi là cả nhóm mất bản chạy được, không có gì để quay về.

Vòng làm việc cho **một** tính năng:

```
# 1. Tạo nhánh mới cho tính năng (đứng từ main, đã cập nhật mới nhất)
git checkout main
git pull
git checkout -b feature/ten-tinh-nang

# 2. Làm việc trên nhánh này, commit bao nhiêu lần cũng được
git add .
git commit -m "mô tả ngắn vừa làm gì"
git push -u origin feature/ten-tinh-nang

# 3. Chỉ khi tính năng đã chạy đúng: merge vào main
git checkout main
git merge feature/ten-tinh-nang
git push

# 4. Xong nhánh này rồi mới quay lại bước 1 cho tính năng kế tiếp
```

Luật rút gọn:

- **1 nhánh = 1 tính năng.** Đừng nhồi 3 tính năng vào một nhánh.
- **Chỉ merge khi tính năng chạy được** và đã tự bấm thử (bước 5 — Test).
- **Merge xong mới mở nhánh mới.** Không làm 2 tính năng song song.
- Trước khi commit, kiểm tra mình đang ở nhánh nào: `git branch --show-current`. Nếu nó in ra `main` → **dừng**, tạo nhánh trước đã.
- Đặt tên nhánh dễ đọc: `feature/upload-cv`, `feature/man-hinh-ket-qua`, `fix/loi-hien-thi`.

Nếu bạn lỡ commit vào `main`, đừng tự sửa bằng lệnh lạ — nói với Claude *"mình vừa commit vào main, giúp mình chuyển sang nhánh"*, nó sẽ hướng dẫn từng bước.

---

## Làm việc nhiều người trên một repo

Nguyên tắc vẫn như trên: **mỗi người một nhánh riêng, ai xong trước merge trước, không phải chờ nhau.** Người chưa xong cứ làm tiếp trên nhánh của mình.

Nhưng thêm **một bước bắt buộc**: mỗi khi có người merge lên `main`, những người còn lại phải kéo `main` mới về nhánh của mình.

Vì sao: nhánh của bạn là bản copy của `main` **tại lúc bạn tạo nhánh**. Người khác merge xong thì `main` đã đổi, còn nhánh bạn vẫn nhìn vào bản `main` cũ. Để lâu, hai bên lệch càng xa, và lúc merge sẽ bị **conflict** — cùng một dòng trong cùng một file bị hai người sửa hai kiểu, Git không tự đoán được nên giữ bản nào nên nó dừng lại chờ người quyết định.

```
main   ──●────────────●──────────●────►   (luôn là bản chạy được)
          \            \        /
A          ●──●──●──────┘merge
            \
B            ●──●──(pull main)──●──┘merge
```

Người merge sau (bạn B) làm 3 bước:

```
# 1. Kéo phần mới của main về nhánh mình
git checkout feature/nhanh-cua-B
git pull origin main

# 2. TEST LẠI MỘT LẦN NỮA — code của B chạy đúng khi đứng một mình,
#    nhưng ghép với thay đổi của A thì chưa chắc. Chạy thử app.

# 3. Đúng rồi mới merge vào main
git checkout main
git pull
git merge feature/nhanh-cua-B
git push
```

4 luật để nhóm không đụng nhau:

1. **Chia việc theo file, không theo dòng.** Thống nhất trước: A làm phần giao diện, B làm phần gọi model. Hai người sửa hai file khác nhau thì gần như không bao giờ conflict. Cùng sửa một file là nguồn conflict số một.
2. **Nhánh sống ngắn.** Xong trong 1–2 ngày rồi merge. Nhánh để cả tuần là nhánh sẽ conflict.
3. **Nói to khi merge.** Merge xong nhắn nhóm một câu "đã merge X lên main". Người kia kéo về ngay.
4. **`main` luôn chạy được.** Không merge thứ chưa test. `main` vỡ là cả nhóm mất bản để quay về.

**Gặp conflict thì làm gì:** đừng tự gõ lệnh lạ để chữa. Mở Claude Code trong project và nói: *"mình đang merge main vào nhánh, bị conflict ở file X, giúp mình xử lý"*. Nó đọc được cả hai bản, giải thích đoạn nào của ai, giữ cái nào hoặc ghép cả hai — bạn quyết, nó gõ.

**Nhóm từ 3 người trở lên** thì nên đổi sang **Pull Request**: đẩy nhánh lên GitHub, mở PR, người khác đọc và approve mới merge. Được: có người soát trước khi vào `main`, có lịch sử ai duyệt cái gì. Mất: thêm vài bước và phải chờ nhau. Nhóm 2 người thì merge trực tiếp như trên là đủ.

---

## Dữ liệu và bảo mật

- **Chỉ dùng dữ liệu giả để test.** Không dùng CV thật, tên ứng viên thật, ghi chú phỏng vấn thật, hay bất kỳ thông tin cá nhân nào của người thật. Cần dữ liệu mẫu thì nhờ Claude tạo bộ giả.
- **API key luôn nằm trong `.env`, và `.env` luôn nằm trong `.gitignore`.** Key không bao giờ được nằm ở phần chạy trên trình duyệt — người dùng xem nguồn trang là thấy.
- **Nếu bạn đã dán key vào chat hoặc push lên GitHub**, coi như key đó mất: vào nhà cung cấp xoá key cũ, tạo key mới, đặt vào `.env`.

---

## Cần mang gì đến buổi checkpoint

1. App chạy được — dù nhỏ, và đã qua soát giao diện (`review-animations`) một lần.
2. `diary.md` có entry cho những ngày đã làm, đặc biệt là các dòng **Chưa hiểu**.
3. Một câu trả lời cho: *tính năng tiếp theo là gì, và vì sao là nó chứ không phải cái khác.*
