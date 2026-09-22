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
      <div class="job-library-container">
        <div class="job-library-header">
          <h1>Job Library</h1>
          <button id="new-job-btn" class="btn btn-primary">New Job</button>
        </div>
        <div id="jobs-list" class="jobs-list">
          <p class="loading">Loading jobs...</p>
        </div>
      </div>
    `;

    document.getElementById('new-job-btn').addEventListener('click', () => {
      window.location.href = '/setup.html';
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
      container.innerHTML = '<p class="empty">No jobs yet. Create one!</p>';
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
