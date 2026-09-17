/**
 * Script tạo dữ liệu giả để test Phase 3 (HR xem kết quả phỏng vấn)
 * Chạy: node scripts/seed-test-data.js
 *
 * Tạo: 1 job, 1 ứng viên chưa hoàn thành, 2 ứng viên đã hoàn thành (có chat + tóm tắt)
 */

require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'interview.db');
const db = new sqlite3.Database(DB_PATH);

const JOB_ID = 'job_test_seed_001';
const HR_EMAIL = 'test@company.com';

const CAND_PENDING = 'cand_seed_pending';
const CAND_1 = 'cand_seed_completed_1';
const CAND_2 = 'cand_seed_completed_2';
const INTERVIEW_1 = 'interview_seed_1';
const INTERVIEW_2 = 'interview_seed_2';

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

async function seed() {
  console.log('Dang tao du lieu gia...\n');

  // 1. Job
  await run(`INSERT OR REPLACE INTO jobs (id, hr_email, job_title, level, company, skills, questions_by_skill, jd_text)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
    JOB_ID, HR_EMAIL,
    'Frontend Developer', 'Junior', 'ABC Corp',
    JSON.stringify(['JavaScript', 'React', 'CSS']),
    JSON.stringify({
      'JavaScript': ['Ban hieu gi ve closure trong JS?', 'Giai thich su khac nhau giua var, let, const?'],
      'React': ['useEffect hoat dong nhu the nao?', 'State va Props khac nhau cho nao?'],
      'CSS': ['Flexbox va Grid khac nhau the nao?']
    }),
    'Tuyen Frontend Developer cho du an web app noi bo.'
  ]);
  console.log('  [OK] Job: Frontend Developer - ABC Corp');

  // 2. Ung vien chua hoan thanh
  const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();
  await run(`INSERT OR REPLACE INTO candidates (id, job_id, name, phone, email, link_sent, interview_status, interview_link, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [CAND_PENDING, JOB_ID, 'Le Van Chua Xong', '0901111222', 'chuaxong@example.com', 1, 'not_started', 'http://localhost:3000/interview?token=pending', twoDaysAgo]);
  console.log('  [OK] Ung vien: Le Van Chua Xong (chua hoan thanh)');

  // 3. Ung vien 1 - da hoan thanh
  const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
  await run(`INSERT OR REPLACE INTO candidates (id, job_id, name, phone, email, link_sent, interview_status, interview_link, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [CAND_1, JOB_ID, 'Nguyen Thi Lan', '0902222333', 'lan@example.com', 1, 'completed', 'http://localhost:3000/interview?token=c1', oneDayAgo]);

  await run(`INSERT OR REPLACE INTO interviews (id, job_id, candidate_id, status, created_at)
    VALUES (?, ?, ?, ?, ?)`, [INTERVIEW_1, JOB_ID, CAND_1, 'completed', oneDayAgo]);

  // Chat messages cho ung vien 1
  const msgs1 = [
    ['msg_s1_01', 'ai', 'Chao ban! Cam on ban da tham gia phong van. Hay cho mình biet ban hieu gi ve closure trong JavaScript?', 'JavaScript', 0],
    ['msg_s1_02', 'candidate', 'Closure la khi mot function co the truy cap bien cua function cha ke ca khi function cha da chay xong. Vi du nhu khi tao counter, function ben trong van nho duoc bien count cua function ben ngoai.', 'JavaScript', 0],
    ['msg_s1_03', 'ai', 'Rat tot! Vay ban co the giai thich su khac nhau giua var, let va const khong?', 'JavaScript', 1],
    ['msg_s1_04', 'candidate', 'var co function scope va bi hoisting, let va const co block scope. const thi khong the gan lai gia tri, con let thi co the. Trong du an thuc te minh thuong dung const mac dinh, chi dung let khi can thay doi gia tri.', 'JavaScript', 1],
    ['msg_s1_05', 'ai', 'useEffect trong React hoat dong nhu the nao?', 'React', 0],
    ['msg_s1_06', 'candidate', 'useEffect chay sau moi lan render. Neu truyen dependency array rong thi chi chay 1 lan khi mount. Neu truyen bien vao array thi chay lai khi bien do thay doi. Minh thuong dung de goi API hoac setup event listener.', 'React', 0],
    ['msg_s1_07', 'ai', 'Flexbox va Grid khac nhau the nao?', 'CSS', 0],
    ['msg_s1_08', 'candidate', 'Flexbox tot cho layout 1 chieu (hang hoac cot), Grid tot cho layout 2 chieu. Minh dung Flexbox cho navbar, card row. Dung Grid cho toan bo page layout hoac dashboard.', 'CSS', 0],
  ];

  for (const [id, sender, content, skill, qIdx] of msgs1) {
    const t = new Date(Date.now() - 85000000 + msgs1.indexOf(msgs1.find(m => m[0] === id)) * 60000).toISOString();
    await run(`INSERT OR REPLACE INTO messages (id, interview_id, sender, content, skill_name, question_index, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`, [id, INTERVIEW_1, sender, content, skill, qIdx, t]);
  }

  // Summaries cho ung vien 1
  const sums1 = [
    [`summary_${INTERVIEW_1}_0`, 'JavaScript', 0, 'Ban hieu gi ve closure trong JS?',
      'Ung vien hieu ro closure: function con truy cap bien cua function cha sau khi cha da thuc thi xong. Cho vi du cu the ve counter.',
      'Giai thich ro rang, co vi du thuc te.'],
    [`summary_${INTERVIEW_1}_1`, 'JavaScript', 1, 'Giai thich su khac nhau giua var, let, const?',
      'Phan biet dung: var (function scope, hoisting), let/const (block scope). Const khong gan lai duoc. Thuc hanh tot: dung const mac dinh.',
      'Co kinh nghiem thuc te, biet best practice.'],
    [`summary_${INTERVIEW_1}_2`, 'React', 0, 'useEffect hoat dong nhu the nao?',
      'Hieu dung lifecycle: chay sau render, dependency array dieu khien khi nao chay lai. Biet dung cho API call va event listener.',
      null],
    [`summary_${INTERVIEW_1}_3`, 'CSS', 0, 'Flexbox va Grid khac nhau the nao?',
      'Phan biet chinh xac: Flexbox cho 1 chieu, Grid cho 2 chieu. Co vi du cu the khi nao dung cai nao.',
      null],
  ];

  for (const [id, skill, qIdx, qText, mainSum, followup] of sums1) {
    await run(`INSERT OR REPLACE INTO summaries (id, interview_id, skill_name, question_index, question_text, main_answer_summary, followup_summary)
      VALUES (?, ?, ?, ?, ?, ?, ?)`, [id, INTERVIEW_1, skill, qIdx, qText, mainSum, followup]);
  }
  console.log('  [OK] Ung vien: Nguyen Thi Lan (da hoan thanh, 4 cau hoi, co tom tat)');

  // 4. Ung vien 2 - da hoan thanh
  const threeHoursAgo = new Date(Date.now() - 3 * 3600000).toISOString();
  await run(`INSERT OR REPLACE INTO candidates (id, job_id, name, phone, email, link_sent, interview_status, interview_link, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [CAND_2, JOB_ID, 'Tran Minh Duc', '0903333444', 'duc@example.com', 1, 'completed', 'http://localhost:3000/interview?token=c2', threeHoursAgo]);

  await run(`INSERT OR REPLACE INTO interviews (id, job_id, candidate_id, status, created_at)
    VALUES (?, ?, ?, ?, ?)`, [INTERVIEW_2, JOB_ID, CAND_2, 'completed', threeHoursAgo]);

  const msgs2 = [
    ['msg_s2_01', 'ai', 'Chao ban! Hay cho mình biet ban hieu gi ve closure trong JavaScript?', 'JavaScript', 0],
    ['msg_s2_02', 'candidate', 'Closure la mot khai niem trong JS, khi function ghi nho scope cua no. Minh chua co nhieu kinh nghiem voi closure nhung biet no lien quan den scope chain.', 'JavaScript', 0],
    ['msg_s2_03', 'ai', 'State va Props trong React khac nhau cho nao?', 'React', 0],
    ['msg_s2_04', 'candidate', 'Props la du lieu truyen tu component cha xuong con, khong the thay doi. State la du lieu noi bo cua component, co the thay doi bang setState hoac useState. Khi state thay doi, component se re-render.', 'React', 0],
    ['msg_s2_05', 'ai', 'Flexbox va Grid khac nhau the nao?', 'CSS', 0],
    ['msg_s2_06', 'candidate', 'Minh biet Flexbox dung de xep hang, Grid thi phuc tap hon. Thuong minh chi dung Flexbox vi don gian hon.', 'CSS', 0],
  ];

  for (const [id, sender, content, skill, qIdx] of msgs2) {
    const t = new Date(Date.now() - 10000000 + msgs2.indexOf(msgs2.find(m => m[0] === id)) * 60000).toISOString();
    await run(`INSERT OR REPLACE INTO messages (id, interview_id, sender, content, skill_name, question_index, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`, [id, INTERVIEW_2, sender, content, skill, qIdx, t]);
  }

  const sums2 = [
    [`summary_${INTERVIEW_2}_0`, 'JavaScript', 0, 'Ban hieu gi ve closure trong JS?',
      'Ung vien biet khai niem co ban ve closure (lien quan scope chain) nhung chua giai thich duoc chi tiet hoac cho vi du.',
      'Can hoc them ve closure va ung dung thuc te.'],
    [`summary_${INTERVIEW_2}_1`, 'React', 0, 'State va Props khac nhau cho nao?',
      'Tra loi dung: Props la read-only tu cha, State la noi bo co the thay doi. Biet useState va re-render.',
      null],
    [`summary_${INTERVIEW_2}_2`, 'CSS', 0, 'Flexbox va Grid khac nhau the nao?',
      'Biet Flexbox co ban nhung chua hieu sau ve Grid. Chi dung Flexbox trong thuc te.',
      'Nen tim hieu them ve CSS Grid de layout phuc tap hon.'],
  ];

  for (const [id, skill, qIdx, qText, mainSum, followup] of sums2) {
    await run(`INSERT OR REPLACE INTO summaries (id, interview_id, skill_name, question_index, question_text, main_answer_summary, followup_summary)
      VALUES (?, ?, ?, ?, ?, ?, ?)`, [id, INTERVIEW_2, skill, qIdx, qText, mainSum, followup]);
  }
  console.log('  [OK] Ung vien: Tran Minh Duc (da hoan thanh, 3 cau hoi, co tom tat)');

  console.log('\n--- XONG! ---');
  console.log('Mo trinh duyet: http://localhost:3000/library.html');
  console.log('Mo Console (F12), go: localStorage.setItem("hr_email", "test@company.com")');
  console.log('Refresh trang (F5) de thay job "Frontend Developer" voi 3 ung vien.');
}

db.serialize(() => {
  seed().then(() => {
    db.close(() => {
      console.log('\nDatabase da dong.');
      process.exit(0);
    });
  }).catch(err => {
    console.error('LOI:', err.message);
    db.close();
    process.exit(1);
  });
});
