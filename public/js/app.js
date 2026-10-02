/**
 * Main App Controller
 * Routes between pages: setup, interview, review
 */

const App = {
  currentPage: 'setup',
  appElement: document.getElementById('app'),

  /**
   * Initialize the app
   */
  init() {
    // Load setup page by default
    this.goToPage('setup');
  },

  /**
   * Navigate to a page
   */
  goToPage(pageName, data = {}) {
    this.currentPage = pageName;
    this.appElement.innerHTML = '';

    switch (pageName) {
      case 'setup':
        SetupPage.init(this.appElement);
        break;
      case 'interview':
        if (data.sessionId) {
          InterviewPage.init(data.sessionId);
        } else {
          InterviewPage.render(this.appElement, data);
        }
        break;
      case 'review':
        if (data.sessionId) {
          ReviewPage.init(data.sessionId);
        } else {
          ReviewPage.render(this.appElement, data);
        }
        break;
      case 'job-library':
        const savedEmail = localStorage.getItem('hr_email');
        if (!savedEmail && !data.hrEmail) {
          // No email found - prompt user to enter email
          const email = prompt('Vui lòng nhập email của bạn:', '');
          if (email && email.trim()) {
            localStorage.setItem('hr_email', email.trim());
            JobLibraryPage.init(email.trim());
          } else {
            this.showError('Email là bắt buộc để tiếp tục');
            this.goToPage('job-library'); // Retry
          }
        } else {
          const hrEmail = data.hrEmail || savedEmail;
          JobLibraryPage.init(hrEmail);
        }
        break;
      case 'job-detail':
        if (data.jobId) {
          JobDetailPage.init(data.jobId);
        } else {
          console.error('Missing job_id');
          this.goToPage('job-library', { hrEmail: data.hrEmail || localStorage.getItem('hr_email') });
        }
        break;
      default:
        console.error(`Unknown page: ${pageName}`);
    }
  },

  /**
   * Show error message
   */
  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'message message-error';
    errorDiv.innerHTML = `<span>⚠️</span> ${message}`;
    this.appElement.insertBefore(errorDiv, this.appElement.firstChild);

    setTimeout(() => errorDiv.remove(), 5000);
  },

  /**
   * Show success message
   */
  showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'message message-success';
    successDiv.innerHTML = `<span>✓</span> ${message}`;
    this.appElement.insertBefore(successDiv, this.appElement.firstChild);

    setTimeout(() => successDiv.remove(), 3000);
  }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
