// public/js/jobLibraryPage.js

const JobLibraryPage = (() => {
  let currentHrEmail = null;

  const init = async (hrEmail) => {
    currentHrEmail = hrEmail;
    render();
    await loadJobs();
  };

  const render = () => {
    const container = document.getElementById('app');
    container.innerHTML = `
      <div class="job-library-wrapper">
        <div class="job-library-nav">
          <div class="logo-section">
            <div class="logo-icon">AI</div>
            <div class="logo-text">
              <span class="logo-main">AIterview</span>
              <span class="logo-sub">Interview Platform</span>
            </div>
          </div>
        </div>

        <div class="job-library-container">
          <div class="job-library-header">
            <div class="header-content">
              <h1>Thư Viện Job</h1>
              <p class="header-subtitle">Quản lý và tạo phỏng vấn cho các vị trí tuyển dụng</p>
            </div>
            <button id="new-job-btn" class="btn btn-primary btn-large">+ Tạo Job Mới</button>
          </div>
          <div id="jobs-list" class="jobs-list">
            <p class="loading">Loading jobs...</p>
          </div>
        </div>
      </div>
    `;

    document.getElementById('new-job-btn').addEventListener('click', () => {
      window.location.href = '/index.html';
    });
  };

  const loadJobs = async () => {
    try {
      const response = await fetch(`/api/job-library/jobs?hr_email=${encodeURIComponent(currentHrEmail)}`);
      if (!response.ok) throw new Error('Failed to fetch jobs');

      const jobs = await response.json();
      displayJobs(jobs);
    } catch (error) {
      console.error('Error loading jobs:', error);
      document.getElementById('jobs-list').innerHTML = '<p class="error">Failed to load jobs</p>';
    }
  };

  const displayJobs = (jobs) => {
    const container = document.getElementById('jobs-list');
    if (jobs.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <h2>Chưa có job nào</h2>
          <p class="empty-description">Hãy tạo job đầu tiên để bắt đầu phỏng vấn ứng viên</p>
          <div class="empty-features">
            <div class="feature-item">
              <span class="feature-icon">✓</span>
              <span class="feature-text">Tải job description tự động</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">✓</span>
              <span class="feature-text">AI tạo câu hỏi phỏng vấn</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">✓</span>
              <span class="feature-text">Đánh giá kỹ năng tự động</span>
            </div>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = jobs.map(job => `
      <div class="job-card">
        <div class="job-info">
          <h3>${job.job_title}</h3>
          <p class="meta">${job.company} • ${job.level}</p>
          <p class="candidates">${job.candidate_count || 0} candidates</p>
        </div>
        <div class="job-actions">
          <button class="btn btn-secondary view-btn" data-job-id="${job.id}">View</button>
          <button class="btn btn-danger delete-btn" data-job-id="${job.id}">Delete</button>
        </div>
      </div>
    `).join('');

    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const jobId = e.target.dataset.jobId;
        window.location.href = `/job-detail.html?job_id=${jobId}`;
      });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const jobId = e.target.dataset.jobId;
        if (confirm('Delete this job and all its candidates?')) {
          deleteJob(jobId);
        }
      });
    });
  };

  const deleteJob = async (jobId) => {
    try {
      const response = await fetch(`/api/job-library/jobs/${jobId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete job');

      await loadJobs();
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Failed to delete job');
    }
  };

  return { init };
})();
