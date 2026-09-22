/**
 * Review Page - Display Interview Results
 * Shows chat history, rubric scores, and export options
 */

const ReviewPage = {
  interviewId: null,
  interviewData: null,
  messages: [],
  rubric: [],
  rubricSummary: null,

  /**
   * Initialize review page with interview ID
   */
  init(interviewId) {
    this.interviewId = interviewId;
    this.render(document.getElementById('app'));
  },

  /**
   * Render the review page
   */
  render(container, data = {}) {
    this.interviewId = data.interviewId || this.interviewId;
    this.interviewData = data.interviewData || this.interviewData;
    this.messages = data.messages || [];
    this.rubric = data.rubric || [];
    this.rubricSummary = data.rubricSummary || {};

    const html = this.getPageHTML();
    container.innerHTML = html;

    this.attachEventListeners();
    this.loadReviewData();
  },

  /**
   * Get page HTML
   */
  getPageHTML() {
    return `
      <div class="page review-page">
        <div class="review-header">
          <h1>Interview Review</h1>
          <p>Interview completed. Below are the results and evaluation.</p>
        </div>

        <div id="review-loading" class="loading">
          <span class="spinner"></span>
          <span class="loading-text">Loading interview results...</span>
        </div>

        <div id="review-content" style="display:none;">
          <div class="review-section">
            <h2>Interview Information</h2>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Candidate:</span>
                <span class="info-value" id="review-candidate"></span>
              </div>
              <div class="info-item">
                <span class="info-label">Job Title:</span>
                <span class="info-value" id="review-job-title"></span>
              </div>
              <div class="info-item">
                <span class="info-label">Level:</span>
                <span class="info-value" id="review-level"></span>
              </div>
              <div class="info-item">
                <span class="info-label">Company:</span>
                <span class="info-value" id="review-company"></span>
              </div>
            </div>
          </div>

          <div class="review-section">
            <h2>Evaluation Rubric</h2>
            <div id="rubric-container" class="rubric-container">
              <!-- Rubric table will be inserted here -->
            </div>
          </div>

          <div class="review-section">
            <h2>Interview Transcript</h2>
            <div id="transcript-container" class="transcript-container">
              <!-- Chat history will be inserted here -->
            </div>
          </div>

          <div class="review-section">
            <h2>Export Results</h2>
            <p>Download a summary of this interview as PDF or CSV.</p>
            <div class="export-buttons">
              <button type="button" class="btn-primary" id="btn-export-pdf">
                <span id="pdf-spinner" style="display:none;" class="spinner"></span>
                <span id="pdf-text">Export as PDF</span>
              </button>
              <button type="button" class="btn-primary" id="btn-export-csv">
                <span id="csv-spinner" style="display:none;" class="spinner"></span>
                <span id="csv-text">Export as CSV</span>
              </button>
            </div>
          </div>

          <div class="button-group" style="margin-top: 32px;">
            <button type="button" class="btn-secondary" id="btn-back-to-setup">
              Back to Setup
            </button>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Load review data from API
   */
  async loadReviewData() {
    try {
      const response = await fetch(`/api/review/${this.interviewId}`);

      if (!response.ok) {
        throw new Error('Failed to load review data');
      }

      const data = await response.json();
      this.interviewData = data.interview;
      this.messages = data.messages;
      this.rubric = data.rubric;
      this.rubricSummary = data.rubric_summary;

      this.displayReviewData();
    } catch (error) {
      App.showError(error.message);
    }
  },

  /**
   * Display review data in the page
   */
  displayReviewData() {
    // Hide loading, show content
    document.getElementById('review-loading').style.display = 'none';
    document.getElementById('review-content').style.display = 'block';

    // Fill interview info
    document.getElementById('review-candidate').textContent = this.escapeHtml(
      this.interviewData?.candidate_name || 'N/A'
    );
    document.getElementById('review-job-title').textContent = this.escapeHtml(
      this.interviewData?.job_title || 'N/A'
    );
    document.getElementById('review-level').textContent = this.escapeHtml(
      this.interviewData?.level || 'N/A'
    );
    document.getElementById('review-company').textContent = this.escapeHtml(
      this.interviewData?.company || 'N/A'
    );

    // Display rubric
    this.displayRubric();

    // Display transcript
    this.displayTranscript();
  },

  /**
   * Display rubric table
   */
  displayRubric() {
    const rubricContainer = document.getElementById('rubric-container');

    if (!this.rubric || this.rubric.length === 0) {
      rubricContainer.innerHTML = '<p>No rubric data available.</p>';
      return;
    }

    const tableHTML = `
      <table class="rubric-table">
        <thead>
          <tr>
            <th>Skill</th>
            <th>Score (0-10)</th>
            <th>Evidence</th>
          </tr>
        </thead>
        <tbody>
          ${this.rubric.map(item => `
            <tr>
              <td><strong>${this.escapeHtml(item.skill_name || item.skill || 'N/A')}</strong></td>
              <td class="score-cell">${item.score || '—'}</td>
              <td class="evidence-cell">${Array.isArray(item.evidence) ? item.evidence.join('; ') : this.escapeHtml(item.evidence || '—')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    rubricContainer.innerHTML = tableHTML;
  },

  /**
   * Display chat transcript
   */
  displayTranscript() {
    const transcriptContainer = document.getElementById('transcript-container');

    if (!this.messages || this.messages.length === 0) {
      transcriptContainer.innerHTML = '<p>No chat messages recorded.</p>';
      return;
    }

    const messagesHTML = this.messages.map(msg => {
      const isAI = msg.sender === 'ai';
      return `
        <div class="transcript-message ${isAI ? 'ai-message' : 'candidate-message'}">
          <div class="transcript-sender">
            ${isAI ? 'AI Interviewer' : this.escapeHtml(this.sessionData?.candidate_name || 'Candidate')}
          </div>
          <div class="transcript-content">${this.escapeHtml(msg.content)}</div>
        </div>
      `;
    }).join('');

    transcriptContainer.innerHTML = `<div class="transcript-list">${messagesHTML}</div>`;
  },

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    const exportPdfBtn = document.getElementById('btn-export-pdf');
    const exportCsvBtn = document.getElementById('btn-export-csv');
    const backBtn = document.getElementById('btn-back-to-setup');

    if (exportPdfBtn) {
      exportPdfBtn.addEventListener('click', async () => {
        await this.exportFile('pdf');
      });
    }

    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', async () => {
        await this.exportFile('csv');
      });
    }

    if (backBtn) {
      backBtn.addEventListener('click', () => {
        App.goToPage('setup');
      });
    }
  },

  /**
   * Export file (PDF or CSV)
   */
  async exportFile(format) {
    const spinner = document.getElementById(`${format}-spinner`);
    const btn = document.getElementById(`btn-export-${format}`);
    const text = document.getElementById(`${format}-text`);

    spinner.style.display = 'inline-block';
    btn.disabled = true;

    try {
      const response = await fetch(`/api/review/${this.interviewId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: format })
      });

      if (!response.ok) {
        throw new Error(`Failed to export ${format.toUpperCase()}`);
      }

      // Get filename from response header
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `interview-results.${format}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) {
          filename = match[1];
        }
      }

      // Convert response to blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      App.showSuccess(`${format.toUpperCase()} exported successfully!`);
    } catch (error) {
      App.showError(error.message);
    } finally {
      spinner.style.display = 'none';
      btn.disabled = false;
    }
  }
};
