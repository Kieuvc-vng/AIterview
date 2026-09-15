/**
 * Setup Page - 5-Step Form Flow
 * Step 1: Input JD
 * Step 2: Confirm/edit fields
 * Step 3: AI suggests skills
 * Step 4: AI suggests questions (edit interface)
 * Step 5: Review & create session
 */

const SetupPage = {
  currentStep: 1,
  totalSteps: 5,
  isEditMode: false,
  editJobId: null,
  formData: {
    jd_text: '',
    job_title: '',
    level: '',
    company: '',
    hr_email: '',
    skills: [],
    questions_by_skill: {}
  },

  /**
   * Initialize - check for edit mode and load data if needed
   */
  async init(container) {
    // Check URL for edit parameter
    const urlParams = new URLSearchParams(window.location.search);
    const editJobId = urlParams.get('edit');

    if (editJobId) {
      this.isEditMode = true;
      this.editJobId = editJobId;
      await this.loadJobForEdit();
      // Start from Step 1 (JD) in edit mode to review entire flow
      this.currentStep = 1;
    }

    this.render(container);
  },

  /**
   * Load job data for editing
   */
  async loadJobForEdit() {
    try {
      const response = await fetch(`/api/job-library/jobs/${this.editJobId}`);
      if (!response.ok) throw new Error('Failed to load job');

      const { job } = await response.json();

      // Pre-fill form data
      this.formData.jd_text = job.jd_text || '';
      this.formData.job_title = job.job_title || '';
      this.formData.level = job.level || '';
      this.formData.company = job.company || '';
      this.formData.hr_email = job.hr_email || localStorage.getItem('hr_email') || '';
      this.formData.skills = Array.isArray(job.skills) ? job.skills : JSON.parse(job.skills || '[]');
      this.formData.questions_by_skill = typeof job.questions_by_skill === 'string'
        ? JSON.parse(job.questions_by_skill || '{}')
        : job.questions_by_skill;
    } catch (error) {
      console.error('Error loading job:', error);
      App.showError('Lỗi khi load job data');
    }
  },

  /**
   * Render the setup page
   */
  render(container, data = {}) {
    // Merge any passed data
    this.formData = { ...this.formData, ...data };
    if (data.currentStep !== undefined) {
      this.currentStep = data.currentStep;
    }

    const html = this.getPageHTML();
    container.innerHTML = html;

    // Attach event listeners
    this.attachEventListeners();
  },

  /**
   * Get page HTML
   */
  getPageHTML() {
    return `
      <div class="page">
        <div class="steps-container">
          <h1>AI Interview Setup</h1>
          <div class="steps">
            ${this.getStepsHTML()}
          </div>
        </div>

        <div class="step-content active">
          ${this.getStepContent()}
        </div>
      </div>
    `;
  },

  /**
   * Get steps indicator HTML
   */
  getStepsHTML() {
    const steps = [
      { num: 1, label: 'Upload JD' },
      { num: 2, label: 'Confirm Details' },
      { num: 3, label: 'Select Skills' },
      { num: 4, label: 'Review Questions' },
      { num: 5, label: 'Create Session' }
    ];

    return steps.map(step => {
      const isActive = this.currentStep === step.num;
      const isCompleted = this.currentStep > step.num;
      const className = `step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`;

      return `
        <div class="${className}">
          <div class="step-number">${isCompleted ? '✓' : step.num}</div>
          <div class="step-label">${step.label}</div>
        </div>
      `;
    }).join('');
  },

  /**
   * Get current step content
   */
  getStepContent() {
    switch (this.currentStep) {
      case 1:
        return this.getStep1HTML();
      case 2:
        console.log('[DEBUG] Returning Step2HTML');
        return this.getStep2HTML();
      case 3:
        return this.getStep3HTML();
      case 4:
        return this.getStep4HTML();
      case 5:
        return this.getStep5HTML();
      default:
        return '<p>Unknown step</p>';
    }
  },

  /**
   * Step 1: Input JD
   */
  getStep1HTML() {
    return `
      <div class="form-group">
        <h2>Step 1: Paste Job Description</h2>
        <p>Paste the complete job description below. We'll extract key information automatically.</p>
        <label for="jd_text">Job Description *</label>
        <textarea id="jd_text" placeholder="Paste job description here..." required>${this.formData.jd_text}</textarea>
      </div>

      <div class="form-group">
        <label for="hr_email">Your Email *</label>
        <input type="email" id="hr_email" placeholder="your@email.com" value="${this.formData.hr_email}" required>
      </div>

      <div class="button-group">
        <button type="button" class="btn-primary" id="btn-step1-next" disabled>
          <span id="step1-spinner" style="display:none;" class="spinner"></span>
          <span id="step1-text">Parse Job Description</span>
        </button>
      </div>
    `;
  },

  /**
   * Step 2: Confirm/edit fields
   */
  getStep2HTML() {
    return `
      <div class="form-group">
        <h2>Step 2: Confirm Job Details</h2>
        <p>Review and edit the extracted information if needed.</p>

        <label for="job_title">Job Title *</label>
        <input type="text" id="job_title" value="${this.formData.job_title}" required>

        <label for="level">Level *</label>
        <select id="level" required>
          <option value="">-- Select Level --</option>
          <option value="Fresher" ${this.formData.level === 'Fresher' ? 'selected' : ''}>Fresher</option>
          <option value="Junior" ${this.formData.level === 'Junior' ? 'selected' : ''}>Junior</option>
          <option value="Mid" ${this.formData.level === 'Mid' ? 'selected' : ''}>Mid</option>
          <option value="Senior" ${this.formData.level === 'Senior' ? 'selected' : ''}>Senior</option>
          <option value="Lead" ${this.formData.level === 'Lead' ? 'selected' : ''}>Lead</option>
          <option value="Manager" ${this.formData.level === 'Manager' ? 'selected' : ''}>Manager</option>
        </select>

        <label for="company">Company *</label>
        <input type="text" id="company" value="${this.formData.company}" required>
      </div>

      <div class="button-group">
        <button type="button" class="btn-secondary" id="btn-step2-back">Back</button>
        <button type="button" class="btn-primary" id="btn-step2-next" disabled>
          <span id="step2-spinner" style="display:none;" class="spinner"></span>
          <span id="step2-text">Suggest Skills</span>
        </button>
      </div>
    `;
  },

  /**
   * Step 3: AI suggests skills
   */
  getStep3HTML() {
    const skillsHTML = this.formData.skills.map((skill, i) => `
      <div class="skill-tag">
        <span>${skill}</span>
        <button type="button" class="remove-skill" data-index="${i}">×</button>
      </div>
    `).join('');

    return `
      <div class="form-group">
        <h2>Step 3: Select Skills to Evaluate</h2>
        <p>AI has suggested these key skills. You can remove any or add custom ones.</p>

        <div class="skills-container">
          ${skillsHTML}
        </div>

        <div style="margin-top: 16px;">
          <label for="new_skill">Add Custom Skill</label>
          <div style="display: flex; gap: 8px;">
            <input type="text" id="new_skill" placeholder="Enter skill name" style="flex: 1;">
            <button type="button" class="btn-secondary btn-sm" id="btn-add-skill">Add</button>
          </div>
        </div>
      </div>

      <div class="button-group">
        <button type="button" class="btn-secondary" id="btn-step3-back">Back</button>
        <button type="button" class="btn-primary" id="btn-step3-next" disabled>
          <span id="step3-spinner" style="display:none;" class="spinner"></span>
          <span id="step3-text">Generate Questions</span>
        </button>
      </div>
    `;
  },

  /**
   * Step 4: AI suggests questions (edit interface)
   */
  getStep4HTML() {
    if (!this.formData.questions_by_skill || Object.keys(this.formData.questions_by_skill).length === 0) {
      return `
        <div class="form-group">
          <h2>Step 4: Review & Edit Questions</h2>
          <p>No questions were generated. Please go back and try again.</p>
        </div>
        <div class="button-group">
          <button type="button" class="btn-secondary" id="btn-step4-back">Back</button>
        </div>
      `;
    }

    const questionsHTML = Object.entries(this.formData.questions_by_skill).map(([skill, questions]) => {
      const questionsListHTML = questions.map((q, i) => `
        <div class="form-group" style="margin-bottom: 12px;">
          <input type="text" class="question-input" data-skill="${skill}" data-index="${i}" value="${q}">
        </div>
      `).join('');

      return `
        <div class="question-group">
          <h3>${skill}</h3>
          ${questionsListHTML}
        </div>
      `;
    }).join('');

    return `
      <div class="form-group">
        <h2>Step 4: Review & Edit Questions</h2>
        <p>Edit the interview questions below. Each question will be asked once per skill.</p>
        ${questionsHTML}
      </div>

      <div class="button-group">
        <button type="button" class="btn-secondary" id="btn-step4-back">Back</button>
        <button type="button" class="btn-primary" id="btn-step4-next">Review Setup</button>
      </div>
    `;
  },

  /**
   * Step 5: Review & create session
   */
  getStep5HTML() {
    const reviewHTML = `
      <div class="review-item">
        <div class="review-row">
          <span class="review-label">Job Title:</span>
          <span class="review-value">${this.formData.job_title}</span>
        </div>
        <div class="review-row">
          <span class="review-label">Level:</span>
          <span class="review-value">${this.formData.level}</span>
        </div>
        <div class="review-row">
          <span class="review-label">Company:</span>
          <span class="review-value">${this.formData.company}</span>
        </div>
      </div>

      <div class="review-item">
        <div class="review-row">
          <span class="review-label">Skills to Evaluate:</span>
        </div>
        <div class="skills-container" style="margin-top: 8px;">
          ${this.formData.skills.map(s => `<div class="skill-tag" style="cursor: default;"><span>${s}</span></div>`).join('')}
        </div>
      </div>

      <div class="review-item">
        <div class="review-row">
          <span class="review-label">Total Questions:</span>
          <span class="review-value">${Object.values(this.formData.questions_by_skill).flat().length}</span>
        </div>
      </div>
    `;

    return `
      <div class="form-group">
        <h2>Step 5: Review & Create Session</h2>
        <p>Everything looks good? Create the interview session to get started.</p>
        ${reviewHTML}
      </div>

      <div class="button-group">
        <button type="button" class="btn-secondary" id="btn-step5-back">Back</button>
        <button type="button" class="btn-primary" id="btn-step5-create" disabled>
          <span id="step5-spinner" style="display:none;" class="spinner"></span>
          <span id="step5-text">${this.isEditMode ? 'Update Job' : 'Create Session'}</span>
        </button>
      </div>
    `;
  },

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    switch (this.currentStep) {
      case 1:
        this.attachStep1Listeners();
        break;
      case 2:
        this.attachStep2Listeners();
        break;
      case 3:
        this.attachStep3Listeners();
        break;
      case 4:
        this.attachStep4Listeners();
        break;
      case 5:
        this.attachStep5Listeners();
        break;
    }
  },

  /**
   * Step 1 listeners
   */
  attachStep1Listeners() {
    const jdInput = document.getElementById('jd_text');
    const emailInput = document.getElementById('hr_email');
    const nextBtn = document.getElementById('btn-step1-next');

    const updateButton = () => {
      nextBtn.disabled = !jdInput.value.trim() || !emailInput.value.trim();
    };

    jdInput.addEventListener('input', updateButton);
    emailInput.addEventListener('input', updateButton);

    nextBtn.addEventListener('click', async () => {
      this.formData.jd_text = jdInput.value.trim();
      this.formData.hr_email = emailInput.value.trim();

      await this.parseJD();
    });

    updateButton();
  },

  /**
   * Step 2 listeners
   */
  attachStep2Listeners() {
    const jobTitleInput = document.getElementById('job_title');
    const levelSelect = document.getElementById('level');
    const companyInput = document.getElementById('company');
    const nextBtn = document.getElementById('btn-step2-next');
    const backBtn = document.getElementById('btn-step2-back');

    const updateButton = () => {
      nextBtn.disabled = !jobTitleInput.value.trim() || !levelSelect.value || !companyInput.value.trim();
    };

    jobTitleInput.addEventListener('input', updateButton);
    levelSelect.addEventListener('change', updateButton);
    companyInput.addEventListener('input', updateButton);

    nextBtn.addEventListener('click', async () => {
      this.formData.job_title = jobTitleInput.value.trim();
      this.formData.level = levelSelect.value;
      this.formData.company = companyInput.value.trim();

      await this.suggestSkills();
    });

    backBtn.addEventListener('click', () => {
      this.currentStep = 1;
      this.render(document.getElementById('app'));
    });

    updateButton();
  },

  /**
   * Step 3 listeners
   */
  attachStep3Listeners() {
    const nextBtn = document.getElementById('btn-step3-next');
    const backBtn = document.getElementById('btn-step3-back');
    const addBtn = document.getElementById('btn-add-skill');
    const newSkillInput = document.getElementById('new_skill');
    const removeSkillBtns = document.querySelectorAll('.remove-skill');

    removeSkillBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const index = parseInt(btn.dataset.index);
        this.formData.skills.splice(index, 1);
        this.render(document.getElementById('app'));
      });
    });

    addBtn.addEventListener('click', () => {
      const skill = newSkillInput.value.trim();
      if (skill && !this.formData.skills.includes(skill)) {
        this.formData.skills.push(skill);
        newSkillInput.value = '';
        this.render(document.getElementById('app'));
      }
    });

    newSkillInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addBtn.click();
      }
    });

    nextBtn.disabled = this.formData.skills.length === 0;
    nextBtn.addEventListener('click', async () => {
      await this.suggestQuestions();
    });

    backBtn.addEventListener('click', () => {
      this.currentStep = 2;
      this.render(document.getElementById('app'));
    });
  },

  /**
   * Step 4 listeners
   */
  attachStep4Listeners() {
    const nextBtn = document.getElementById('btn-step4-next');
    const backBtn = document.getElementById('btn-step4-back');
    const questionInputs = document.querySelectorAll('.question-input');

    questionInputs.forEach(input => {
      input.addEventListener('change', () => {
        const skill = input.dataset.skill;
        const index = parseInt(input.dataset.index);
        this.formData.questions_by_skill[skill][index] = input.value;
      });
    });

    nextBtn.addEventListener('click', () => {
      this.currentStep = 5;
      this.render(document.getElementById('app'));
    });

    backBtn.addEventListener('click', () => {
      this.currentStep = 3;
      this.render(document.getElementById('app'));
    });
  },

  /**
   * Step 5 listeners
   */
  attachStep5Listeners() {
    const createBtn = document.getElementById('btn-step5-create');
    const backBtn = document.getElementById('btn-step5-back');

    createBtn.disabled = false;

    createBtn.addEventListener('click', async () => {
      await this.createSession();
    });

    backBtn.addEventListener('click', () => {
      this.currentStep = 4;
      this.render(document.getElementById('app'));
    });
  },

  /**
   * API Call: Parse JD
   */
  async parseJD() {
    const spinner = document.getElementById('step1-spinner');
    const text = document.getElementById('step1-text');
    const nextBtn = document.getElementById('btn-step1-next');

    spinner.style.display = 'inline-block';
    nextBtn.disabled = true;

    try {
      const response = await fetch('/api/setup/parse-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd_text: this.formData.jd_text })
      });

      if (!response.ok) {
        throw new Error('Failed to parse job description');
      }

      const data = await response.json();
      console.log('[DEBUG] parseJD response:', data);
      this.formData.job_title = data.job_title;
      this.formData.level = data.level;
      this.formData.company = data.company;

      console.log('[DEBUG] Setting currentStep to 2, was:', this.currentStep);
      this.currentStep = 2;
      console.log('[DEBUG] After setting, currentStep is:', this.currentStep);
      this.render(document.getElementById('app'));
      console.log('[DEBUG] After render, currentStep is:', this.currentStep);
    } catch (error) {
      console.error('[DEBUG] parseJD error:', error);
      App.showError(error.message);
      nextBtn.disabled = false;
      spinner.style.display = 'none';
    }
  },

  /**
   * API Call: Suggest Skills
   */
  async suggestSkills() {
    const spinner = document.getElementById('step2-spinner');
    const text = document.getElementById('step2-text');
    const nextBtn = document.getElementById('btn-step2-next');

    spinner.style.display = 'inline-block';
    nextBtn.disabled = true;

    try {
      const response = await fetch('/api/setup/suggest-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jd_text: this.formData.jd_text,
          job_title: this.formData.job_title,
          level: this.formData.level
        })
      });

      if (!response.ok) {
        throw new Error('Failed to suggest skills');
      }

      const data = await response.json();
      this.formData.skills = data.skills;

      this.currentStep = 3;
      this.render(document.getElementById('app'));
    } catch (error) {
      App.showError(error.message);
      nextBtn.disabled = false;
      spinner.style.display = 'none';
    }
  },

  /**
   * API Call: Suggest Questions
   */
  async suggestQuestions() {
    const spinner = document.getElementById('step3-spinner');
    const nextBtn = document.getElementById('btn-step3-next');

    spinner.style.display = 'inline-block';
    nextBtn.disabled = true;

    try {
      const response = await fetch('/api/setup/suggest-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jd_text: this.formData.jd_text,
          skills: this.formData.skills,
          job_title: this.formData.job_title,
          level: this.formData.level
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate questions');
      }

      const data = await response.json();
      this.formData.questions_by_skill = data.questions_by_skill;

      this.currentStep = 4;
      this.render(document.getElementById('app'));
    } catch (error) {
      App.showError(error.message);
      nextBtn.disabled = false;
      spinner.style.display = 'none';
    }
  },

  /**
   * API Call: Create Session or Update Job
   */
  async createSession() {
    const spinner = document.getElementById('step5-spinner');
    const createBtn = document.getElementById('btn-step5-create');

    spinner.style.display = 'inline-block';
    createBtn.disabled = true;

    try {
      let response;

      if (this.isEditMode) {
        // Update existing job
        response = await fetch(`/api/job-library/jobs/${this.editJobId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            job_title: this.formData.job_title,
            level: this.formData.level,
            company: this.formData.company,
            skills: this.formData.skills,
            questions_by_skill: this.formData.questions_by_skill,
            jd_text: this.formData.jd_text
          })
        });

        if (!response.ok) {
          throw new Error('Failed to update job');
        }

        App.showSuccess('Job updated successfully! Redirecting...');
        setTimeout(() => {
          window.location.href = '/library.html';
        }, 1500);
      } else {
        // Create new job
        response = await fetch('/api/setup/create-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hr_email: this.formData.hr_email,
            job_title: this.formData.job_title,
            level: this.formData.level,
            company: this.formData.company,
            skills: this.formData.skills,
            questions_by_skill: this.formData.questions_by_skill
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create session');
        }

        const data = await response.json();
        const { session_id, redirect } = data;

        // Save SESSION_ID to localStorage for resume capability
        localStorage.setItem('current_interview_session', session_id);

        // Check if backend wants to redirect to job library
        if (redirect === '/job-library') {
          // Store HR email in localStorage if available
          if (this.formData.hr_email) {
            localStorage.setItem('hr_email', this.formData.hr_email);
          }
          // Show success and redirect to job library
          App.showSuccess('Job created successfully! Redirecting to library...');
          setTimeout(() => {
            window.location.href = '/library.html';
          }, 1500);
        } else {
          // Fallback for backward compatibility - redirect to interview
          App.showSuccess('Interview session created successfully!');
          setTimeout(() => {
            // Navigate to interview page with session ID
            App.goToPage('interview', { sessionId: session_id });
          }, 1500);
        }
      }
    } catch (error) {
      App.showError(error.message);
      createBtn.disabled = false;
      spinner.style.display = 'none';
    }
  }
};
