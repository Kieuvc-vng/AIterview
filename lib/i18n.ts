import { Language } from "./types";

const translations = {
  "landing.title": { vi: "AI Interview Bot", en: "AI Interview Bot" },
  "landing.subtitle": {
    vi: "Tạo câu hỏi phỏng vấn thông minh từ Job Description",
    en: "Generate smart interview questions from Job Descriptions",
  },
  "landing.cta": { vi: "Bắt đầu tạo phỏng vấn", en: "Start Creating Interviews" },
  "landing.feature1.title": { vi: "Phân tích JD tự động", en: "Auto-Analyze JD" },
  "landing.feature1.desc": {
    vi: "AI trích xuất skills và tạo câu hỏi phù hợp",
    en: "AI extracts skills and generates relevant questions",
  },
  "landing.feature2.title": { vi: "Phỏng vấn Adaptive", en: "Adaptive Interview" },
  "landing.feature2.desc": {
    vi: "Tự động follow-up dựa trên câu trả lời",
    en: "Automatic follow-ups based on responses",
  },
  "landing.feature3.title": { vi: "Chia sẻ dễ dàng", en: "Easy Sharing" },
  "landing.feature3.desc": {
    vi: "Tạo link gửi cho ứng viên, không cần đăng ký",
    en: "Generate a link for candidates, no sign-up needed",
  },

  "setup.title": { vi: "Thiết lập phỏng vấn", en: "Setup Interview" },
  "setup.step1.title": { vi: "Nhập Job Description", en: "Input Job Description" },
  "setup.step1.placeholder": {
    vi: "Dán nội dung Job Description vào đây...",
    en: "Paste the Job Description here...",
  },
  "setup.step1.language": { vi: "Ngôn ngữ phỏng vấn", en: "Interview Language" },
  "setup.step1.langVi": { vi: "Tiếng Việt", en: "Vietnamese" },
  "setup.step1.langEn": { vi: "Tiếng Anh", en: "English" },
  "setup.step1.analyze": { vi: "Phân tích JD", en: "Analyze JD" },
  "setup.step1.analyzing": { vi: "Đang phân tích...", en: "Analyzing..." },

  "setup.step2.title": { vi: "Chọn Skills", en: "Select Skills" },
  "setup.step2.subtitle": {
    vi: "Chọn 1-5 kỹ năng để phỏng vấn",
    en: "Select 1-5 skills to interview on",
  },
  "setup.step2.addCustom": { vi: "Thêm skill thủ công", en: "Add custom skill" },
  "setup.step2.technical": { vi: "Kỹ năng chuyên môn", en: "Technical Skills" },
  "setup.step2.soft": { vi: "Kỹ năng mềm", en: "Soft Skills" },
  "setup.step2.other": { vi: "Các yêu cầu khác", en: "Other Requirements" },

  "setup.step3.title": { vi: "Chỉnh sửa câu hỏi", en: "Edit Questions" },
  "setup.step3.addQuestion": { vi: "Thêm câu hỏi", en: "Add question" },
  "setup.step3.deleteQuestion": { vi: "Xóa", en: "Delete" },

  "setup.step4.title": { vi: "Xác nhận & Tạo link", en: "Confirm & Generate Link" },
  "setup.step4.summary": { vi: "Tóm tắt", en: "Summary" },
  "setup.step4.skillCount": { vi: "Số skills", en: "Skills" },
  "setup.step4.questionCount": { vi: "Tổng câu hỏi", en: "Total questions" },
  "setup.step4.language": { vi: "Ngôn ngữ", en: "Language" },
  "setup.step4.generate": { vi: "Tạo link phỏng vấn", en: "Generate Interview Link" },
  "setup.step4.copyLink": { vi: "Copy link", en: "Copy link" },
  "setup.step4.copied": { vi: "Đã copy!", en: "Copied!" },

  "setup.next": { vi: "Tiếp theo", en: "Next" },
  "setup.back": { vi: "Quay lại", en: "Back" },

  "interview.welcome": {
    vi: "Chào mừng bạn đến buổi phỏng vấn!",
    en: "Welcome to your interview!",
  },
  "interview.position": { vi: "Vị trí", en: "Position" },
  "interview.start": { vi: "Bắt đầu phỏng vấn", en: "Start Interview" },
  "interview.placeholder": { vi: "Nhập câu trả lời...", en: "Type your answer..." },
  "interview.send": { vi: "Gửi", en: "Send" },
  "interview.skill": { vi: "Kỹ năng", en: "Skill" },
  "interview.question": { vi: "Câu hỏi", en: "Question" },
  "interview.thinking": { vi: "Đang suy nghĩ...", en: "Thinking..." },
  "interview.complete": {
    vi: "Cảm ơn bạn đã hoàn thành phỏng vấn!",
    en: "Thank you for completing the interview!",
  },
  "interview.resultsSent": {
    vi: "Kết quả đã được ghi nhận.",
    en: "Your results have been recorded.",
  },
  "interview.export": { vi: "Xuất kết quả", en: "Export Results" },

  "error.invalidLink": { vi: "Link phỏng vấn không hợp lệ", en: "Invalid interview link" },
  "error.invalidLinkDesc": {
    vi: "Link này không đúng hoặc đã bị hỏng.",
    en: "This link is incorrect or corrupted.",
  },
  "error.backHome": { vi: "Về trang chủ", en: "Back to home" },
  "error.apiError": {
    vi: "Có lỗi xảy ra, vui lòng thử lại",
    en: "An error occurred, please try again",
  },
  "error.retrying": { vi: "Đang thử lại...", en: "Retrying..." },
  "error.jdTooShort": {
    vi: "JD quá ngắn, vui lòng bổ sung thêm thông tin",
    en: "JD is too short, please add more detail",
  },

  "interview.evaluating": {
    vi: "Đang tạo báo cáo đánh giá...",
    en: "Generating evaluation report...",
  },
  "interview.overallScore": { vi: "Điểm tổng", en: "Overall Score" },
  "interview.recommendation": { vi: "Đề xuất", en: "Recommendation" },
  "interview.strengths": { vi: "Điểm mạnh", en: "Strengths" },
  "interview.weaknesses": { vi: "Điểm cần cải thiện", en: "Areas for Improvement" },
  "interview.skillSummary": { vi: "Đánh giá theo kỹ năng", en: "Skill-by-Skill Evaluation" },
  "interview.reportReady": {
    vi: "Báo cáo đánh giá đã sẵn sàng.",
    en: "Evaluation report is ready.",
  },
  "jobs.title": { vi: "Danh sách Job", en: "Saved Jobs" },
  "jobs.empty": { vi: "Chưa có job nào. Hãy tạo phỏng vấn mới!", en: "No jobs yet. Create a new interview!" },
  "jobs.createNew": { vi: "Tạo phỏng vấn mới", en: "Create New Interview" },
  "jobs.candidates": { vi: "Ứng viên", en: "Candidates" },
  "jobs.addCandidate": { vi: "Thêm ứng viên", en: "Add Candidate" },
  "jobs.candidatePlaceholder": { vi: "Nhập tên ứng viên...", en: "Enter candidate name..." },
  "jobs.createLink": { vi: "Tạo link", en: "Create Link" },
  "jobs.linkCreated": { vi: "Link đã tạo!", en: "Link created!" },
  "jobs.copyLink": { vi: "Copy link", en: "Copy link" },
  "jobs.copied": { vi: "Đã copy!", en: "Copied!" },
  "jobs.skills": { vi: "kỹ năng", en: "skills" },
  "jobs.questions": { vi: "câu hỏi", en: "questions" },
  "jobs.saveJob": { vi: "Lưu Job", en: "Save Job" },
  "jobs.saveJobTitle": { vi: "Lưu Job", en: "Save Job" },
  "jobs.jobName": { vi: "Tên job", en: "Job Name" },
  "jobs.jobNamePlaceholder": { vi: "VD: Backend Developer Q3...", en: "e.g. Backend Developer Q3..." },
  "jobs.save": { vi: "Lưu", en: "Save" },
  "jobs.cancel": { vi: "Hủy", en: "Cancel" },
  "jobs.saved": { vi: "Đã lưu job!", en: "Job saved!" },
  "jobs.backToJobs": { vi: "Xem danh sách Jobs", en: "View Jobs List" },
  "jobs.deleteJob": { vi: "Xóa job", en: "Delete job" },
  "jobs.deleteConfirm": { vi: "Bạn có chắc muốn xóa job này? Tất cả link ứng viên cũng sẽ bị xóa.", en: "Are you sure you want to delete this job? All candidate links will also be deleted." },
  "jobs.deleted": { vi: "Đã xóa job!", en: "Job deleted!" },

  "candidate.notFound": { vi: "Không tìm thấy", en: "Not Found" },
  "candidate.notFoundDesc": {
    vi: "Link phỏng vấn không tồn tại hoặc đã hết hạn.",
    en: "This interview link does not exist or has expired.",
  },
  "candidate.loading": { vi: "Đang tải...", en: "Loading..." },
} as const;

type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, lang: Language): string {
  return translations[key]?.[lang] ?? key;
}
