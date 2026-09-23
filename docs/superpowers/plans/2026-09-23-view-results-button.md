# View Results Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement "Xem kết quả" (View Results) button to show notification when candidate hasn't completed interview, with placeholder for completed state.

**Architecture:** Modify existing view-results-btn event handler in library.html to check candidate's interview_status and display appropriate notification or placeholder message.

**Tech Stack:** Vanilla JavaScript, HTML/CSS, browser alert API

---

## File Structure

- **Frontend:** `public/library.html` — Modify view-results-btn event handler (around line 295-317)

---

## Tasks

### Task 1: Implement View Results Button Handler

**Files:**
- Modify: `public/library.html:295-317` (view-results-btn event handler)

- [ ] **Step 1: Read current view-results-btn handler code**

Open `public/library.html` and find the `.view-results-btn` event listener (around line 295-317). Current code shows alert "Tính năng xem kết quả sẽ được cập nhật trong bước tiếp theo".

- [ ] **Step 2: Replace handler with new logic**

Replace the entire `.view-results-btn` event listener block with:

```javascript
          // Add view-results button handlers
          document.querySelectorAll('.view-results-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
              const candidateId = e.target.dataset.candidateId;
              
              try {
                // Get candidate info to check interview status
                const candidateResponse = await fetch(`/api/candidates/${candidateId}`);
                if (!candidateResponse.ok) throw new Error('Candidate not found');
                
                const candidateData = await candidateResponse.json();
                const status = candidateData.candidate?.interview_status || 'not_started';
                
                // Check if interview is completed
                if (status !== 'completed') {
                  alert('Ứng viên chưa hoàn thành phỏng vấn');
                  return;
                }
                
                // Placeholder for completed interview (to do later)
                alert('Tính năng xem kết quả sẽ được cập nhật trong bước tiếp theo');
              } catch (err) {
                alert('Lỗi: ' + err.message);
              }
            });
          });
```

- [ ] **Step 3: Verify the logic**

Check that:
- Handler gets candidateId from `data-candidate-id` attribute
- Fetches candidate data from `/api/candidates/:id` endpoint
- Extracts `interview_status` from response
- Shows notification if status ≠ 'completed': "Ứng viên chưa hoàn thành phỏng vấn"
- Shows placeholder message if status = 'completed'
- Handles errors gracefully

- [ ] **Step 4: Test in browser**

1. Open app at http://localhost:51420
2. Go to Job Library
3. Open candidate list ("Xem Ứng Viên")
4. Click "Xem kết quả" button
5. Should show: "Ứng viên chưa hoàn thành phỏng vấn"
6. Verify no console errors

- [ ] **Step 5: Commit**

```bash
cd "C:\Users\LAP14052\Downloads\AI Project\Vibe-coding for NonIT"
git add public/library.html
git commit -m "feat: implement view results button with interview status check

- Check candidate interview_status before showing results
- Show notification if interview not completed
- Placeholder for completed interview (to implement later)
- Graceful error handling for API failures"
```

Expected: Commit succeeds, shows hash

---

## Self-Review Checklist

✅ **Spec coverage:**
- [x] Implement button functionality → Task 1
- [x] Check interview_status → Step 2 (fetch and extract status)
- [x] Show notification if not completed → Step 2 (alert message)
- [x] Placeholder for completed → Step 2 (alert placeholder)

✅ **No placeholders:**
- [x] Complete JavaScript code provided
- [x] Exact API endpoint specified
- [x] Exact alert messages included
- [x] Exact test steps provided
- [x] Exact git commands provided

✅ **Type consistency:**
- [x] candidateId extracted from `data-candidate-id` (matches HTML)
- [x] interview_status checked against 'completed' string (matches backend)
- [x] Error handling matches pattern from other handlers

---

**Plan complete and saved to `docs/superpowers/plans/2026-09-23-view-results-button.md`.**

**Ready to execute? Two options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task

**2. Inline Execution** - I execute the task in this session

**Which would you prefer?**