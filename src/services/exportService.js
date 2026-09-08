const PDFDocument = require('pdfkit');
const { createObjectCsvWriter } = require('csv-writer');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Generate PDF export with chat history and rubric
 * @param {Array} messages - Array of messages from interview
 * @param {Array} rubrics - Array of rubric entries
 * @param {Object} sessionData - Session data (job_title, candidate_name, etc)
 * @returns {Promise<string>} Path to generated PDF file
 */
const generatePDF = async (messages, rubrics, sessionData) => {
  try {
    const tmpDir = path.join(os.tmpdir(), 'interview-exports');

    // Create tmp directory if it doesn't exist
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `interview_${sessionData.candidate_name || 'candidate'}_${timestamp}.pdf`;
    const filePath = path.join(tmpDir, fileName);

    // Create PDF document
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // Header
    doc.fontSize(16).font('Helvetica-Bold').text('Interview Report', { align: 'center' });
    doc.moveDown();

    // Session Information
    doc.fontSize(12).font('Helvetica-Bold').text('Interview Details:');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Position: ${sessionData.job_title}`);
    doc.text(`Level: ${sessionData.level}`);
    doc.text(`Company: ${sessionData.company}`);
    doc.text(`Candidate: ${sessionData.candidate_name}`);
    doc.text(`Date: ${new Date(sessionData.started_at).toLocaleString()}`);
    doc.moveDown();

    // Chat History
    doc.fontSize(12).font('Helvetica-Bold').text('Interview Chat:');
    doc.fontSize(10).font('Helvetica');

    for (const msg of messages) {
      const sender = msg.sender === 'ai' ? 'Interviewer' : 'Candidate';
      doc.text(`${sender}: ${msg.content}`, { align: 'left' });
      doc.moveDown(0.5);
    }

    doc.addPage();

    // Rubric
    doc.fontSize(12).font('Helvetica-Bold').text('Evaluation Rubric:');
    doc.moveDown();

    // Create table headers
    const pageWidth = doc.page.width;
    const margin = 50;
    const availableWidth = pageWidth - 2 * margin;
    const colWidths = {
      skill: availableWidth * 0.35,
      score: availableWidth * 0.15,
      evidence: availableWidth * 0.5
    };

    // Table header
    const headerY = doc.y;
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Skill', margin, headerY, { width: colWidths.skill });
    doc.text('Score', margin + colWidths.skill, headerY, { width: colWidths.score, align: 'center' });
    doc.text('Evidence', margin + colWidths.skill + colWidths.score, headerY, { width: colWidths.evidence });

    doc.moveTo(margin, headerY + 15).lineTo(pageWidth - margin, headerY + 15).stroke();
    doc.moveDown();

    // Table rows
    doc.fontSize(9).font('Helvetica');
    for (const rubric of rubrics) {
      const rowY = doc.y;
      const scoreText = `${rubric.score}/10`;

      doc.text(rubric.skill_name, margin, rowY, { width: colWidths.skill });
      doc.text(scoreText, margin + colWidths.skill, rowY, { width: colWidths.score, align: 'center' });
      doc.text(rubric.evidence, margin + colWidths.skill + colWidths.score, rowY, {
        width: colWidths.evidence,
        ellipsis: true,
        height: 30
      });

      doc.moveTo(margin, doc.y + 5).lineTo(pageWidth - margin, doc.y + 5).stroke();
      doc.moveDown();
    }

    // Footer
    doc.fontSize(8).font('Helvetica').text(
      `Generated on ${new Date().toLocaleString()}`,
      { align: 'center' }
    );

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => {
        resolve(filePath);
      });
      stream.on('error', (error) => {
        reject(new Error(`PDF generation failed: ${error.message}`));
      });
      doc.on('error', (error) => {
        reject(new Error(`PDF document error: ${error.message}`));
      });
    });
  } catch (error) {
    console.error('Error generating PDF:', error.message);
    throw new Error(`PDF export failed: ${error.message}`);
  }
};

/**
 * Generate CSV export with rubric data only
 * @param {Array} rubrics - Array of rubric entries
 * @param {Object} sessionData - Session data for filename
 * @returns {Promise<string>} Path to generated CSV file
 */
const generateCSV = async (rubrics, sessionData) => {
  try {
    const tmpDir = path.join(os.tmpdir(), 'interview-exports');

    // Create tmp directory if it doesn't exist
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `rubric_${sessionData.candidate_name || 'candidate'}_${timestamp}.csv`;
    const filePath = path.join(tmpDir, fileName);

    // Prepare data for CSV
    const csvData = rubrics.map((rubric) => ({
      skill_name: rubric.skill_name,
      score: rubric.score,
      evidence: rubric.evidence,
      strengths: Array.isArray(rubric.strengths) ? rubric.strengths.join('; ') : '',
      weaknesses: Array.isArray(rubric.weaknesses) ? rubric.weaknesses.join('; ') : ''
    }));

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'skill_name', title: 'Skill' },
        { id: 'score', title: 'Score (0-10)' },
        { id: 'evidence', title: 'Evidence' },
        { id: 'strengths', title: 'Strengths' },
        { id: 'weaknesses', title: 'Weaknesses' }
      ],
      encoding: 'utf8'
    });

    await csvWriter.writeRecords(csvData);
    return filePath;
  } catch (error) {
    console.error('Error generating CSV:', error.message);
    throw new Error(`CSV export failed: ${error.message}`);
  }
};

/**
 * Clean up old export files (older than 24 hours)
 * @returns {Promise<number>} Number of files deleted
 */
const cleanupOldExports = async () => {
  try {
    const tmpDir = path.join(os.tmpdir(), 'interview-exports');

    if (!fs.existsSync(tmpDir)) {
      return 0;
    }

    const files = fs.readdirSync(tmpDir);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(tmpDir, file);
      const stats = fs.statSync(filePath);

      if (now - stats.mtimeMs > maxAge) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }

    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up exports:', error.message);
    return 0;
  }
};

module.exports = {
  generatePDF,
  generateCSV,
  cleanupOldExports
};
