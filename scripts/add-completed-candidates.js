require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'interview.db');
const db = new sqlite3.Database(DB_PATH);

const now = new Date().toISOString();
const yesterday = new Date(Date.now() - 86400000).toISOString();
const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();

function run(sql, params) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) { if (err) reject(err); else resolve(this); });
  });
}

async function seed() {
  const jobs = [
    { id: 'job_1789460543214_knzm2p5t9', title: 'Software Engineer (VNG)' },
    { id: 'job_test_seed_001', title: 'Frontend Developer (ABC Corp)' }
  ];

  for (const job of jobs) {
    const prefix = job.id.substring(0, 10);

    // --- Candidate 1: strong candidate ---
    const c1 = prefix + '_cand_done1';
    const i1 = prefix + '_intv_done1';
    await run(`INSERT OR REPLACE INTO candidates (id, job_id, name, phone, email, link_sent, interview_status, interview_link, created_at)
      VALUES (?,?,?,?,?,?,?,?,?)`,
      [c1, job.id, 'Pham Hoang Nam', '0911222333', 'nam.pham@example.com', 1, 'completed', 'http://localhost:3003/interview?t=fake1', yesterday]);
    await run(`INSERT OR REPLACE INTO interviews (id, job_id, candidate_id, status, created_at)
      VALUES (?,?,?,?,?)`, [i1, job.id, c1, 'completed', yesterday]);

    const t1 = (offset) => new Date(Date.now() - 80000000 + offset * 60000).toISOString();
    const msgs1 = [
      [prefix+'_m1a', i1, 'ai',       'Chao ban! Hay gioi thieu ve kinh nghiem lap trinh cua ban.', 'General', 0, null, t1(0)],
      [prefix+'_m1b', i1, 'candidate', 'Minh co 3 nam kinh nghiem lam web voi React va Node.js. Tot nghiep Bach Khoa, da lam 4 du an thuc te gom he thong quan ly don hang, trang e-commerce, dashboard analytics, va app chat noi bo.', 'General', 0, null, t1(1)],
      [prefix+'_m1c', i1, 'ai',       'Ban xu ly loi trong code async nhu the nao?', 'JavaScript', 0, null, t1(2)],
      [prefix+'_m1d', i1, 'candidate', 'Minh dung try-catch voi async/await. Voi Promise thi dung .catch(). Trong Express minh tao error middleware de bat tat ca loi. Cung log loi ra file bang Winston de debug. Trong production minh con dung Sentry de theo doi loi.', 'JavaScript', 0, null, t1(3)],
      [prefix+'_m1e', i1, 'ai',       'Khi lam viec nhom, ban giai quyet xung dot code nhu the nao?', 'Teamwork', 0, null, t1(4)],
      [prefix+'_m1f', i1, 'candidate', 'Minh dung Git branch rieng cho moi feature, tao PR de review. Khi co conflict thi ngoi lai voi teammate resolve cung nhau. Team minh dung convention Conventional Commits va co CI chay test tu dong truoc khi merge.', 'Teamwork', 0, null, t1(5)],
    ];
    for (const m of msgs1) {
      await run('INSERT OR REPLACE INTO messages (id, interview_id, sender, content, skill_name, question_index, attempt_number, created_at) VALUES (?,?,?,?,?,?,?,?)', m);
    }

    const sums1 = [
      ['s_'+prefix+'_1_0', i1, 'General', 0, 'Gioi thieu kinh nghiem lap trinh', 'Co 3 nam kinh nghiem React + Node.js, tot nghiep Bach Khoa, 4 du an thuc te. Nen tang vung chac, da lam nhieu loai du an.', 'Tra loi tu tin, co vi du cu the va da dang.'],
      ['s_'+prefix+'_1_1', i1, 'JavaScript', 0, 'Xu ly loi trong async code', 'Thanh thao try-catch, .catch(), error middleware, Winston logging, Sentry monitoring. Hieu sau ve error handling tu dev den production.', 'Quy trinh debug chuyen nghiep, biet dung monitoring tools.'],
      ['s_'+prefix+'_1_2', i1, 'Teamwork', 0, 'Giai quyet xung dot code trong nhom', 'Dung Git branch + PR workflow, Conventional Commits, CI/CD. Resolve conflict cung teammate. Tinh than hop tac tot, co quy trinh lam viec ro rang.', null],
    ];
    for (const s of sums1) {
      await run('INSERT OR REPLACE INTO summaries (id, interview_id, skill_name, question_index, question_text, main_answer_summary, followup_summary, created_at) VALUES (?,?,?,?,?,?,?,?)', [...s, now]);
    }
    console.log('[OK] ' + job.title + ': Pham Hoang Nam (completed - strong)');

    // --- Candidate 2: average candidate ---
    const c2 = prefix + '_cand_done2';
    const i2 = prefix + '_intv_done2';
    await run(`INSERT OR REPLACE INTO candidates (id, job_id, name, phone, email, link_sent, interview_status, interview_link, created_at)
      VALUES (?,?,?,?,?,?,?,?,?)`,
      [c2, job.id, 'Vo Thanh Trung', '0922333444', 'trung.vo@example.com', 1, 'completed', 'http://localhost:3003/interview?t=fake2', twoDaysAgo]);
    await run(`INSERT OR REPLACE INTO interviews (id, job_id, candidate_id, status, created_at)
      VALUES (?,?,?,?,?)`, [i2, job.id, c2, 'completed', twoDaysAgo]);

    const t2 = (offset) => new Date(Date.now() - 170000000 + offset * 60000).toISOString();
    const msgs2 = [
      [prefix+'_m2a', i2, 'ai',       'Chao ban! Hay gioi thieu ve kinh nghiem lap trinh cua ban.', 'General', 0, null, t2(0)],
      [prefix+'_m2b', i2, 'candidate', 'Minh moi hoc xong bootcamp 6 thang. Biet HTML, CSS, JavaScript co ban. Chua co kinh nghiem du an that, chi lam bai tap lon.', 'General', 0, null, t2(1)],
      [prefix+'_m2c', i2, 'ai',       'Ban xu ly loi trong code async nhu the nao?', 'JavaScript', 0, null, t2(2)],
      [prefix+'_m2d', i2, 'candidate', 'Minh biet try catch nhung chua dung nhieu. Thuong console.log ra de xem loi o dau roi sua.', 'JavaScript', 0, null, t2(3)],
      [prefix+'_m2e', i2, 'ai',       'Khi lam viec nhom, ban giai quyet xung dot code nhu the nao?', 'Teamwork', 0, null, t2(4)],
      [prefix+'_m2f', i2, 'candidate', 'Minh chua lam nhom nhieu, chi lam bai tap nhom o bootcamp. Dung Google Drive de chia file va nhan tin qua Zalo.', 'Teamwork', 0, null, t2(5)],
    ];
    for (const m of msgs2) {
      await run('INSERT OR REPLACE INTO messages (id, interview_id, sender, content, skill_name, question_index, attempt_number, created_at) VALUES (?,?,?,?,?,?,?,?)', m);
    }

    const sums2 = [
      ['s_'+prefix+'_2_0', i2, 'General', 0, 'Gioi thieu kinh nghiem lap trinh', 'Moi hoc bootcamp 6 thang, biet HTML/CSS/JS co ban. Chua co kinh nghiem du an thuc te, chi lam bai tap.', 'Can dao tao them nhieu, chua san sang lam du an that.'],
      ['s_'+prefix+'_2_1', i2, 'JavaScript', 0, 'Xu ly loi trong async code', 'Biet try-catch nhung chua quen dung. Debug bang console.log. Chua biet error middleware hay logging framework.', 'Ky nang debug con yeu, can hoc them error handling patterns.'],
      ['s_'+prefix+'_2_2', i2, 'Teamwork', 0, 'Giai quyet xung dot code trong nhom', 'Chua co kinh nghiem lam nhom that su. Dung Google Drive chia file, Zalo lien lac. Chua biet Git workflow.', 'Can hoc Git va quy trinh lam viec nhom chuyen nghiep.'],
    ];
    for (const s of sums2) {
      await run('INSERT OR REPLACE INTO summaries (id, interview_id, skill_name, question_index, question_text, main_answer_summary, followup_summary, created_at) VALUES (?,?,?,?,?,?,?,?)', [...s, now]);
    }
    console.log('[OK] ' + job.title + ': Vo Thanh Trung (completed - average)');
  }

  console.log('\n--- Done! Added 2 completed candidates to each job ---');
  console.log('VNG job (kieuvc@vng.com.vn): 2 new completed candidates');
  console.log('ABC Corp job (test@company.com): 2 new completed candidates');
  console.log('\nRefresh library.html to see them.');
}

db.serialize(() => {
  seed().then(() => db.close(() => process.exit(0))).catch(err => { console.error('ERROR:', err); db.close(); process.exit(1); });
});
