// public/js/jobDetailPage.js

const JobDetailPage = (() => {
  let currentJobId = null;

  const getFullInterviewLink = (relativeLink) => {
    const baseUrl = window.location.origin;
    return baseUrl + relativeLink;
  };

  const init = async (jobId) => {
    currentJobId = jobId;
    render();
    await loadJobDetails();
  };

  const render = () => {
    const container = document.getElementById('app');
    container.innerHTML = `
      <div class="job-detail-container">
        <div class="job-detail-header">
          <a href="/library.html" class="btn-link">← Back to Library</a>
          <h1 id="job-title">Job Details</h1>
        </div>

        <div id="job-info" class="job-info">
          <p class="loading">Loading...</p>
        </div>

        <div class="candidates-section">
          <div class="candidates-header">
            <h2>Candidates</h2>
            <button id="add-candidate-btn" class="btn btn-primary">Add Candidate</button>
          </div>
          <div id="candidates-list" class="candidates-list">
            <p class="loading">Loading candidates...</p>
          </div>
        </div>
      </div>
    `;

    document.getElementById('add-candidate-btn').addEventListener('click', showAddCandidateModal);
  };

  const loadJobDetails = async () => {
    try {
      const response = await fetch(`/api/job-library/jobs/${currentJobId}`);
      if (!response.ok) throw new Error('Failed to fetch job details');

      const job = await response.json();
      displayJobInfo(job);
      displayCandidates(job.candidates || []);
    } catch (error) {
      console.error('Error loading job:', error);
      document.getElementById('job-info').innerHTML = '<p class="error">Failed to load job</p>';
    }
  };

  const displayJobInfo = (job) => {
    const skillsList = Array.isArray(job.skills) ? job.skills.join(', ') : job.skills;
    document.getElementById('job-title').textContent = job.job_title;
    document.getElementById('job-info').innerHTML = `
      <div class="info-card">
        <div class="info-row">
          <label>Title:</label>
          <span>${job.job_title}</span>
        </div>
        <div class="info-row">
          <label>Company:</label>
          <span>${job.company}</span>
        </div>
        <div class="info-row">
          <label>Level:</label>
          <span>${job.level}</span>
        </div>
        <div class="info-row">
          <label>Skills:</label>
          <span>${skillsList}</span>
        </div>
        ${job.jd_text ? `<div class="info-row"><label>Job Description:</label><p>${job.jd_text}</p></div>` : ''}
      </div>
    `;
  };

  const displayCandidates = (candidates) => {
    const container = document.getElementById('candidates-list');
    if (candidates.length === 0) {
      container.innerHTML = '<p class="empty">No candidates yet</p>';
      return;
    }

    container.innerHTML = candidates.map(candidate => `
      <div class="candidate-card">
        <div class="candidate-info">
          <h4>${candidate.name}</h4>
          <p>${candidate.email} • ${candidate.phone}</p>
          <p class="status">Status: ${candidate.interview_status}</p>
        </div>
        <div class="candidate-actions">
          ${candidate.interview_link ? `
            <div class="link-section">
              <p class="link-info">✓ Link generated</p>
              <div class="link-display">
                <input type="text" class="link-input" value="${getFullInterviewLink(candidate.interview_link)}" readonly />
                <button class="btn btn-secondary btn-small copy-link-btn" data-link="${getFullInterviewLink(candidate.interview_link)}">Copy</button>
              </div>
              <button class="btn btn-secondary send-email-btn" data-candidate-email="${candidate.email}" data-candidate-name="${candidate.name}" data-link="${getFullInterviewLink(candidate.interview_link)}">Send Email</button>
            </div>
          ` : `<button class="btn btn-secondary btn-sm gen-link-btn" data-candidate-id="${candidate.id}">Generate Link</button>`}
          <button class="btn btn-danger btn-sm delete-cand-btn" data-candidate-id="${candidate.id}">Delete</button>
        </div>
      </div>
    `).join('');

    document.querySelectorAll('.gen-link-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const candidateId = e.target.dataset.candidateId;
        generateInterviewLink(candidateId);
      });
    });

    // Copy link button
    document.querySelectorAll('.copy-link-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const link = e.target.dataset.link;
        navigator.clipboard.writeText(link).then(() => {
          alert('Link copied to clipboard!');
        }).catch(() => {
          alert('Failed to copy link');
        });
      });
    });

    // Send email button
    document.querySelectorAll('.send-email-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const email = e.target.dataset.candidateEmail;
        const name = e.target.dataset.candidateName;
        const link = e.target.dataset.link;
        const subject = 'Interview Link';
        const body = `Hi ${name},\n\nPlease use this link to start your interview:\n${link}\n\nThank you!`;
        const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoLink;
      });
    });

    document.querySelectorAll('.delete-cand-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const candidateId = e.target.dataset.candidateId;
        if (confirm('Delete this candidate?')) {
          deleteCandidate(candidateId);
        }
      });
    });
  };

  const showAddCandidateModal = () => {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h3>Add Candidate</h3>
        <form id="add-candidate-form">
          <input type="text" id="candidate-name" placeholder="Name" required />
          <input type="email" id="candidate-email" placeholder="Email" required />
          <input type="tel" id="candidate-phone" placeholder="Phone" required />
          <div class="modal-actions">
            <button type="submit" class="btn btn-primary">Add</button>
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('add-candidate-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('candidate-name').value;
      const email = document.getElementById('candidate-email').value;
      const phone = document.getElementById('candidate-phone').value;

      await addCandidate(name, email, phone);
      modal.remove();
    });
  };

  const addCandidate = async (name, email, phone) => {
    try {
      const response = await fetch(`/api/job-library/jobs/${currentJobId}/candidates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone })
      });

      if (!response.ok) throw new Error('Failed to add candidate');
      await loadJobDetails();
    } catch (error) {
      console.error('Error adding candidate:', error);
      alert('Failed to add candidate');
    }
  };

  const generateInterviewLink = async (candidateId) => {
    try {
      const response = await fetch(`/api/job-library/candidates/${candidateId}/generate-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: currentJobId })
      });

      if (!response.ok) throw new Error('Failed to generate link');
      await loadJobDetails();
    } catch (error) {
      console.error('Error generating link:', error);
      alert('Failed to generate link');
    }
  };

  const deleteCandidate = async (candidateId) => {
    try {
      const response = await fetch(`/api/job-library/candidates/${candidateId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete candidate');
      await loadJobDetails();
    } catch (error) {
      console.error('Error deleting candidate:', error);
      alert('Failed to delete candidate');
    }
  };

  return { init };
})();
