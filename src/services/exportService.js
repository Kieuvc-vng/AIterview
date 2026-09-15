const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const os = require('os');

const getTmpDir = () => {
  const dir = path.join(os.tmpdir(), 'interview-exports');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const timestamp = () => new Date().toISOString().replace(/[:.]/g, '-');

const generateSummaryPDF = async (candidate, summaries, jobTitle) => {
  const filePath = path.join(getTmpDir(), `summary_${candidate.name}_${timestamp()}.pdf`);
  const doc = new PDFDocument();
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  doc.fontSize(18).text(`Ket Qua Phong Van - Tom Tat`, { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Ung vien: ${candidate.name}`);
  doc.text(`Email: ${candidate.email} | SĐT: ${candidate.phone}`);
  doc.text(`Vi tri: ${jobTitle}`);
  doc.moveDown();

  let currentSkill = '';
  for (const s of summaries) {
    if (s.skill_name !== currentSkill) {
      currentSkill = s.skill_name;
      doc.moveDown().fontSize(14).text(currentSkill, { underline: true });
    }
    doc.fontSize(11).text(`Q: ${s.question_text}`);
    doc.fontSize(10).text(`A: ${s.main_answer_summary}`);
    if (s.followup_summary) {
      doc.text(`Follow-up: ${s.followup_summary}`);
    }
    doc.moveDown(0.5);
  }

  doc.end();
  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
};

const generateFullChatPDF = async (candidate, messages, jobTitle) => {
  const filePath = path.join(getTmpDir(), `fullchat_${candidate.name}_${timestamp()}.pdf`);
  const doc = new PDFDocument();
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  doc.fontSize(18).text(`Ket Qua Phong Van - Full Chat`, { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Ung vien: ${candidate.name}`);
  doc.text(`Email: ${candidate.email} | SĐT: ${candidate.phone}`);
  doc.text(`Vi tri: ${jobTitle}`);
  doc.moveDown();

  for (const m of messages) {
    const label = m.sender === 'ai' ? 'AI' : 'Ung vien';
    doc.fontSize(10).text(`[${label}] ${m.content}`);
    doc.moveDown(0.3);
  }

  doc.end();
  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
};

const generateSummaryCSV = async (candidate, summaries, jobTitle) => {
  const filePath = path.join(getTmpDir(), `summary_${candidate.name}_${timestamp()}.csv`);

  const header = 'ung_vien,email,vi_tri,skill,cau_hoi,tom_tat,follow_up\n';
  const rows = summaries.map(s =>
    `"${candidate.name}","${candidate.email}","${jobTitle}","${s.skill_name}","${s.question_text}","${s.main_answer_summary}","${s.followup_summary || ''}"`
  ).join('\n');

  fs.writeFileSync(filePath, header + rows, 'utf8');
  return filePath;
};

const generateFullChatCSV = async (candidate, messages, jobTitle) => {
  const filePath = path.join(getTmpDir(), `fullchat_${candidate.name}_${timestamp()}.csv`);

  const header = 'ung_vien,email,vi_tri,sender,content,time\n';
  const rows = messages.map(m =>
    `"${candidate.name}","${candidate.email}","${jobTitle}","${m.sender}","${(m.content || '').replace(/"/g, '""')}","${m.created_at || ''}"`
  ).join('\n');

  fs.writeFileSync(filePath, header + rows, 'utf8');
  return filePath;
};

const cleanupOldExports = () => {
  try {
    const dir = path.join(os.tmpdir(), 'interview-exports');
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    const oneHourAgo = Date.now() - 3600000;
    for (const file of files) {
      const fp = path.join(dir, file);
      const stat = fs.statSync(fp);
      if (stat.mtimeMs < oneHourAgo) fs.unlinkSync(fp);
    }
  } catch (err) {
    console.error('[Export] Cleanup error:', err.message);
  }
};

module.exports = {
  generateSummaryPDF,
  generateFullChatPDF,
  generateSummaryCSV,
  generateFullChatCSV,
  cleanupOldExports
};
