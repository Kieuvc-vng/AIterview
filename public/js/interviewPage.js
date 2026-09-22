/**
 * Interview Page - Interactive Chat with AI
 * Screen 1: Name input + start interview
 * Screen 2: Chat interface for interview questions/answers
 */

const InterviewPage = {
  jobId: null,
  interviewId: null,
  candidateName: null,
  currentQuestion: null,
  messages: [],
  interviewStarted: false,
  interviewComplete: false,
  questionsBySkill: {},
  skills: [],
  currentSkillIndex: 0,
  currentQuestionIndex: 0,

  /**
   * Initialize interview page - accept job_id
   */
  async init(jobId) {
    this.jobId = jobId;
    this.interviewId = null;
    const container = document.getElementById('app');

    // Check if we have INTERVIEW_ID in localStorage (resume case)
    const storedInterviewId = localStorage.getItem('current_interview_id');
    const storedQuestionsBySkill = localStorage.getItem('current_questions_by_skill');
    const storedSkills = localStorage.getItem('current_skills');

    if (storedInterviewId) {
      // Try to resume existing interview
      try {
        const response = await fetch(`/api/interview/${storedInterviewId}`);
        if (response.ok) {
          const data = await response.json();
          this.interviewId = storedInterviewId;
          this.messages = data.messages || [];
          this.interviewStarted = data.interview && data.interview.status === 'active' || this.messages.length > 0;

          // Restore questions from localStorage
          if (storedQuestionsBySkill) {
            this.questionsBySkill = JSON.parse(storedQuestionsBySkill);
          }
          if (storedSkills) {
            this.skills = JSON.parse(storedSkills);
          }

          if (this.interviewStarted) {
            // Get current question based on skill/question index
            if (this.skills.length > 0 && this.questionsBySkill[this.skills[this.currentSkillIndex]]) {
              const question = this.questionsBySkill[this.skills[this.currentSkillIndex]][this.currentQuestionIndex];
              if (question) {
                this.currentQuestion = {
                  skill: this.skills[this.currentSkillIndex],
                  question_text: question
                };
              }
            }

            // Render with loaded data
            this.render(container, {
              interviewId: storedInterviewId,
              messages: this.messages,
              interviewStarted: true
            });
            return;
          }
        }
      } catch (error) {
        console.error('Error resuming interview:', error);
      }
    }

    // Show name input form
    this.render(container, { jobId });
  },

  /**
   * Render the interview page
   */
  render(container, data = {}) {
    this.jobId = data.jobId || this.jobId;
    this.interviewId = data.interviewId || this.interviewId;
    this.messages = data.messages || [];
    this.interviewStarted = data.interviewStarted || false;

    const html = this.interviewStarted
      ? this.getChatInterfaceHTML()
      : this.getNameInputHTML();

    container.innerHTML = html;
    this.attachEventListeners();
  },

  /**
   * Get name input screen HTML
   */
  getNameInputHTML() {
    return `
      <div class="page interview-page">
        <div class="interview-header">
          <h1>Welcome to AI Interview</h1>
          <p>Please enter your name to begin the interview.</p>
        </div>

        <div class="form-group">
          <label for="candidate_name">Your Name *</label>
          <input
            type="text"
            id="candidate_name"
            placeholder="Enter your full name"
            required
          >
        </div>

        <div class="button-group">
          <button type="button" class="btn-primary" id="btn-start-interview" disabled>
            <span id="start-spinner" style="display:none;" class="spinner"></span>
            <span id="start-text">Start Interview</span>
          </button>
        </div>
      </div>
    `;
  },

  /**
   * Get chat interface HTML
   */
  getChatInterfaceHTML() {
    const messagesHTML = this.messages.map((msg, i) => {
      const isAI = msg.sender === 'ai';
      return `
        <div class="message-item ${isAI ? 'ai-message' : 'candidate-message'}">
          <div class="message-sender">${isAI ? 'AI Interviewer' : this.candidateName}</div>
          <div class="message-content">${this.escapeHtml(msg.content)}</div>
        </div>
      `;
    }).join('');

    const currentQuestionHTML = this.currentQuestion ? `
      <div class="current-question-box">
        <div class="question-label">Current Question:</div>
        <div class="question-text">${this.escapeHtml(this.currentQuestion.question_text)}</div>
      </div>
    ` : '';

    const endButtonHTML = this.interviewComplete ? `
      <button type="button" class="btn-secondary" id="btn-end-interview">
        Go to Review
      </button>
    ` : '';

    return `
      <div class="page interview-page">
        <div class="interview-header">
          <h1>Interview in Progress</h1>
          <p>Candidate: ${this.escapeHtml(this.candidateName)}</p>
        </div>

        ${currentQuestionHTML}

        <div class="chat-container">
          <div class="messages-list" id="messages-list">
            ${messagesHTML}
          </div>
        </div>

        <div class="interview-input-area">
          ${this.interviewComplete ? `
            <div class="interview-complete-message">
              <p>✓ Interview completed! All questions have been asked.</p>
            </div>
          ` : `
            <div class="message-input-group">
              <textarea
                id="candidate_message"
                class="message-input"
                placeholder="Type your answer here and press Send..."
                required
              ></textarea>
              <button type="button" class="btn-primary btn-send" id="btn-send-message">
                <span id="send-spinner" style="display:none;" class="spinner"></span>
                <span id="send-text">Send</span>
              </button>
            </div>
          `}
        </div>

        ${endButtonHTML}
      </div>
    `;
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
    if (!this.interviewStarted) {
      this.attachNameInputListeners();
    } else {
      this.attachChatListeners();
    }
  },

  /**
   * Attach listeners for name input screen
   */
  attachNameInputListeners() {
    const nameInput = document.getElementById('candidate_name');
    const startBtn = document.getElementById('btn-start-interview');

    const updateButton = () => {
      startBtn.disabled = !nameInput.value.trim();
    };

    nameInput.addEventListener('input', updateButton);
    nameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !startBtn.disabled) {
        startBtn.click();
      }
    });

    startBtn.addEventListener('click', async () => {
      this.candidateName = nameInput.value.trim();
      await this.startInterview();
    });

    updateButton();
  },

  /**
   * Attach listeners for chat interface
   */
  attachChatListeners() {
    if (!this.interviewComplete) {
      const messageInput = document.getElementById('candidate_message');
      const sendBtn = document.getElementById('btn-send-message');

      const updateButton = () => {
        sendBtn.disabled = !messageInput.value.trim();
      };

      messageInput.addEventListener('input', updateButton);
      messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.ctrlKey && !sendBtn.disabled) {
          sendBtn.click();
        }
      });

      sendBtn.addEventListener('click', async () => {
        await this.sendMessage(messageInput.value.trim());
        messageInput.value = '';
        updateButton();
      });

      updateButton();
    } else {
      const endBtn = document.getElementById('btn-end-interview');
      if (endBtn) {
        endBtn.addEventListener('click', () => {
          App.goToPage('review', { interviewId: this.interviewId });
        });
      }
    }

    // Auto-scroll to bottom
    setTimeout(() => {
      const messagesList = document.getElementById('messages-list');
      if (messagesList) {
        messagesList.scrollTop = messagesList.scrollHeight;
      }
    }, 100);
  },

  /**
   * Start interview - call API with job_id, get interview_id
   */
  async startInterview() {
    const spinner = document.getElementById('start-spinner');
    const startBtn = document.getElementById('btn-start-interview');

    spinner.style.display = 'inline-block';
    startBtn.disabled = true;

    try {
      const response = await fetch(`/api/interview/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: this.jobId,
          candidate_name: this.candidateName
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start interview');
      }

      const data = await response.json();
      this.interviewId = data.interview_id;
      this.questionsBySkill = data.questions_by_skill || {};
      this.skills = data.skills || [];

      // Get first question from questions_by_skill
      if (this.skills.length > 0 && this.questionsBySkill[this.skills[0]]) {
        const firstQuestion = this.questionsBySkill[this.skills[0]][0];
        this.currentQuestion = {
          skill: this.skills[0],
          question_text: firstQuestion
        };
      }

      // Store interview_id in localStorage for resume
      localStorage.setItem('current_interview_id', this.interviewId);
      localStorage.setItem('current_questions_by_skill', JSON.stringify(this.questionsBySkill));
      localStorage.setItem('current_skills', JSON.stringify(this.skills));

      // Add opening message to messages
      this.messages = [{
        sender: 'ai',
        content: data.opening_message
      }];

      this.interviewStarted = true;
      this.render(document.getElementById('app'), {
        interviewId: this.interviewId,
        interviewStarted: true,
        messages: this.messages
      });
    } catch (error) {
      App.showError(error.message);
      startBtn.disabled = false;
      spinner.style.display = 'none';
    }
  },

  /**
   * Send message - candidate answer
   */
  async sendMessage(message) {
    const spinner = document.getElementById('send-spinner');
    const sendBtn = document.getElementById('btn-send-message');

    spinner.style.display = 'inline-block';
    sendBtn.disabled = true;

    try {
      // Add candidate message to messages immediately
      this.messages.push({
        sender: 'candidate',
        content: message
      });

      // Send to API using interview_id
      const response = await fetch(`/api/interview/${this.interviewId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate_message: message })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      // Add AI response to messages
      this.messages.push({
        sender: 'ai',
        content: data.ai_response
      });

      // Update state
      if (data.interview_complete) {
        this.interviewComplete = true;
      } else {
        // Move to next question
        this.currentQuestionIndex++;

        // Check if need to move to next skill
        const currentSkillQuestions = this.questionsBySkill[this.skills[this.currentSkillIndex]] || [];
        if (this.currentQuestionIndex >= currentSkillQuestions.length) {
          this.currentSkillIndex++;
          this.currentQuestionIndex = 0;

          // Check if all skills done
          if (this.currentSkillIndex >= this.skills.length) {
            this.interviewComplete = true;
          }
        }

        // Update current question
        if (!this.interviewComplete && this.skills.length > 0) {
          const nextQuestion = this.questionsBySkill[this.skills[this.currentSkillIndex]][this.currentQuestionIndex];
          if (nextQuestion) {
            this.currentQuestion = {
              skill: this.skills[this.currentSkillIndex],
              question_text: nextQuestion
            };
          }
        }
      }

      // Re-render
      this.render(document.getElementById('app'), {
        interviewId: this.interviewId,
        interviewStarted: true,
        messages: this.messages
      });
    } catch (error) {
      App.showError(error.message);
      // Remove the candidate message we added
      this.messages.pop();
      sendBtn.disabled = false;
      spinner.style.display = 'none';
    }
  }
};
