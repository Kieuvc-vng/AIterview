# AI Interview App - Public Frontend

This directory contains all client-side code for the AI Interview application.

## Directory Structure

```
public/
├── index.html          # Main HTML entry point
├── css/
│   └── style.css       # All styling for pages and components
├── js/
│   ├── app.js          # Main app router and controller
│   ├── setupPage.js    # Setup wizard (5 steps)
│   ├── interviewPage.js # Interview chat interface
│   └── reviewPage.js   # Results and rubric display
└── README.md           # This file
```

## Page Flows

### 1. Setup Page (`setupPage.js`)
A 5-step wizard to prepare an interview session:

- **Step 1 - Upload JD:** Paste job description + enter HR email
- **Step 2 - Confirm Details:** Review job title, level, company
- **Step 3 - Select Skills:** Pick skills to evaluate (AI-suggested or custom)
- **Step 4 - Review Questions:** Edit interview questions for each skill
- **Step 5 - Review & Create:** Final review before creating session

### 2. Interview Page (`interviewPage.js`)
Two-screen interview flow:

- **Name Input Screen:** Candidate enters their name to start
- **Chat Interface:** 
  - Shows current question being asked
  - Displays message history (AI and candidate turns)
  - Input box for candidate to type answers
  - Auto-scrolls to latest message

### 3. Review Page (`reviewPage.js`)
Results display after interview:

- **Session Info:** Candidate name, job title, level, company
- **Rubric Table:** Score (0-10) and evidence for each skill
- **Interview Transcript:** Full chat history
- **Export Options:** Download PDF or CSV report

## CSS Organization

`style.css` contains:

- **Base styles:** Reset, typography, page wrapper
- **Form elements:** Inputs, buttons, labels
- **Message system:** Error, success, info toasts
- **Steps indicator:** Progress display
- **Interview styles:** Chat layout, message bubbles
- **Review styles:** Rubric table, transcript display
- **Responsive design:** Mobile and tablet breakpoints

### Key CSS Classes

- `.page` - Main page container (white card on gradient)
- `.interview-page` - Interview/review page wrapper
- `.chat-container` - Scrollable message area
- `.message-item` - Single chat message (AI or candidate)
- `.ai-message`, `.candidate-message` - Message variants
- `.rubric-table` - Score table for results
- `.button-group` - Button layout helper

## API Integration Points

Frontend calls these backend endpoints:

**Setup Phase:**
- `POST /api/setup/parse-jd` - Parse job description
- `POST /api/setup/suggest-skills` - Get AI-suggested skills
- `POST /api/setup/suggest-questions` - Generate interview questions
- `POST /api/setup/create-session` - Create interview session

**Interview Phase:**
- `GET /api/interview/:sessionId` - Get session data
- `POST /api/interview/:sessionId/start` - Start interview with candidate name
- `POST /api/interview/:sessionId/message` - Send candidate answer

**Review Phase:**
- `GET /api/review/:sessionId` - Get interview results + rubric
- `POST /api/review/:sessionId/export` - Export PDF or CSV

## Loading States

All API calls show loading spinners:
- `.spinner` class animates continuously
- Button text switches between action and spinner display
- Buttons disabled while loading

## Error Handling

- Invalid inputs show validation errors before API calls
- API errors display as toast messages (red background)
- Success messages shown after actions complete
- Errors auto-dismiss after 5 seconds

## Responsive Design

Breakpoint: `@media (max-width: 600px)`

- Page padding reduced
- Button groups stack vertically
- Chat input area adjusts for touch
- Export buttons stack
- Table scrolls horizontally
- Messages take full width

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Requires ES6+ JavaScript
- No jQuery or other dependencies

## Development Notes

- Pages render into single `#app` div
- App.js controls page navigation
- All pages follow same pattern: `render()` and `attachEventListeners()`
- Messages auto-escape HTML to prevent XSS
- Session ID passed through page data
- Messages stored in page state, synced with API
