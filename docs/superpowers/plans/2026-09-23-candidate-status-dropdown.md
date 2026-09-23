# Candidate Status Dropdown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Change candidate status from auto-filled "Đã gửi link" to an editable dropdown with "Chưa gửi" as default, allowing HR to toggle status multiple times with auto-save.

**Architecture:** 
- Backend: Add new endpoint `PUT /candidates/:id/update-status` to handle status changes and timestamp updates
- Frontend: Replace "Đã gửi link" button with a dropdown select, move status field to same row as personal info for cleaner layout, add event listeners for auto-save on dropdown change
- Auto-save pattern: On dropdown selection → fetch API → update UI

**Tech Stack:** Express.js (backend), Vanilla JS (frontend), SQLite (database)

---

## File Structure

- **Backend:** `src/routes/candidateRoutes.js` — Add new endpoint for updating candidate status
- **Frontend:** `public/library.html` — Modify candidate modal layout and add dropdown UI + event handlers

---

## Tasks

### Task 1: Add Update Status Endpoint

**Files:**
- Modify: `src/routes/candidateRoutes.js:81-82` (end of file)

- [ ] **Step 1: Add new PUT endpoint for status updates**

Add this code at the end of `src/routes/candidateRoutes.js` (before `module.exports`):

```javascript
// PUT /candidates/:candidate_id/update-status - Update link_sent status
router.put('/:candidate_id/update-status', (req, res) => {
  try {
    const { candidate_id } = req.params;
    const { link_sent } = req.body;

    if (link_sent === undefined || typeof link_sent !== 'number') {
      return res.status(400).json({ success: false, error: 'Invalid link_sent value' });
    }

    const candidate = sessionManager.getCandidate(candidate_id);
    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    const now = new Date().toISOString();
    const updateData = { link_sent };

    // Only update link_sent_at if marking as sent (link_sent = 1)
    if (link_sent === 1) {
      updateData.link_sent_at = now;
    }

    sessionManager.updateCandidateStatus(candidate_id, updateData);

    res.json({
      success: true,
      message: 'Status updated',
      link_sent,
      link_sent_at: updateData.link_sent_at || candidate.link_sent_at
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

- [ ] **Step 2: Verify the endpoint code matches the pattern**

Check that:
- Endpoint path is `/candidates/:candidate_id/update-status`
- Accepts `link_sent` (0 or 1) in request body
- Updates timestamp only when `link_sent === 1`
- Returns updated status and timestamp in response

---

### Task 2: Modify Frontend Layout - Personal Info Section

**Files:**
- Modify: `public/library.html:209-218` (status details section)

- [ ] **Step 1: Update HTML layout to include status dropdown in personal info row**

Replace the status section (lines 209-218) with this:

```javascript
const statusDetails = `
  <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #eee; font-size: 12px;">
    <div style="margin-bottom: 8px;">
      <strong>Trạng thái gửi link:</strong>
      <select class="link-status-select" data-candidate-id="${c.id}" style="margin-left: 8px; padding: 4px 8px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">
        <option value="0" ${!c.link_sent ? 'selected' : ''}>Chưa gửi</option>
        <option value="1" ${c.link_sent ? 'selected' : ''}>Đã gửi</option>
      </select>
      ${c.link_sent_at ? ` • <span style="color: #666;">${formatDate(c.link_sent_at)}</span>` : ''}
    </div>
    <div style="display: flex; gap: 8px; margin-top: 12px;">
      <button class="btn btn-info btn-small view-results-btn" data-candidate-id="${c.id}" style="${status !== 'completed' ? 'opacity: 0.5; cursor: not-allowed;' : ''}" ${status !== 'completed' ? 'disabled' : ''}>Xem kết quả</button>
    </div>
  </div>
`;
```

- [ ] **Step 2: Verify the new HTML structure**

Check that:
- Dropdown has class `link-status-select`
- Has `data-candidate-id` attribute with candidate ID
- Default value is "Chưa gửi" (0) or "Đã gửi" (1) based on `c.link_sent`
- Timestamp displays next to dropdown
- "Đã gửi link" button is removed (no longer needed)
- "Xem kết quả" button remains

---

### Task 3: Add Event Listeners for Status Dropdown

**Files:**
- Modify: `public/library.html:292-318` (after mark-sent button handlers)

- [ ] **Step 1: Replace mark-sent button handler with status dropdown handler**

Remove the entire `.mark-sent-btn` event listener block (lines 269-292), and add this new handler after the delete button handlers (around line 267, after the closing brace of delete handler):

```javascript
          // Add status dropdown handlers
          document.querySelectorAll('.link-status-select').forEach(select => {
            select.addEventListener('change', async (e) => {
              const candidateId = e.target.dataset.candidateId;
              const linkSent = parseInt(e.target.value);

              try {
                const response = await fetch(`/candidates/${candidateId}/update-status`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ link_sent: linkSent })
                });

                if (!response.ok) throw new Error('Failed to update status');
                const data = await response.json();

                // Visual feedback
                e.target.style.borderColor = '#4caf50';
                setTimeout(() => {
                  e.target.style.borderColor = '#ddd';
                }, 1500);
              } catch (err) {
                // Revert dropdown on error
                e.target.value = linkSent === 1 ? '0' : '1';
                alert('Lỗi: ' + err.message);
              }
            });
          });
```

- [ ] **Step 2: Verify the handler logic**

Check that:
- Selector matches `.link-status-select`
- Gets candidate ID from `data-candidate-id`
- Parses value as integer (0 or 1)
- Calls `/candidates/:id/update-status` endpoint
- Shows visual feedback (border color change)
- Reverts dropdown on error

---

### Task 4: Test Status Dropdown

**Files:**
- Test: `public/library.html` (via browser)

- [ ] **Step 1: Open app and navigate to Job Library**

```bash
# Server should be running on port 63018
# Open browser to http://localhost:63018/library.html
```

- [ ] **Step 2: Create a job and a candidate**

1. Click "+ Tạo Job Mới"
2. Fill in job details and create
3. On Job Library, click "Tạo Ứng Viên"
4. Fill in name, email, phone and click "Tạo Link"
5. Click "Đóng"
6. Click "Xem Ứng Viên" button

- [ ] **Step 3: Test dropdown interaction**

1. Find the new dropdown that shows "Chưa gửi" (should be default)
2. Click dropdown and select "Đã gửi"
3. Verify:
   - Dropdown changes to "Đã gửi"
   - Border shows green feedback briefly
   - Timestamp appears next to dropdown
   - No error in console

- [ ] **Step 4: Test toggling back**

1. Click dropdown again and select "Chưa gửi"
2. Verify:
   - Dropdown changes back to "Chưa gửi"
   - Timestamp disappears (or stays as reference)
   - No error in console

- [ ] **Step 5: Test multiple candidates**

1. Create 2 more candidates for same job
2. Set first to "Đã gửi", second to "Chưa gửi", third to "Đã gửi"
3. Click "Xem Ứng Viên" again to reload modal
4. Verify all three show correct status in dropdown

---

### Task 5: Commit Changes

**Files:**
- `src/routes/candidateRoutes.js`
- `public/library.html`

- [ ] **Step 1: Stage changes**

```bash
cd "C:\Users\LAP14052\Downloads\AI Project\Vibe-coding for NonIT"
git add src/routes/candidateRoutes.js public/library.html
```

- [ ] **Step 2: Create commit**

```bash
git commit -m "feat: add editable status dropdown for candidate link status

- Add PUT /candidates/:id/update-status endpoint
- Replace hardcoded 'Đã gửi link' button with dropdown (Chưa gửi/Đã gửi)
- Default status is now 'Chưa gửi' instead of auto-marked as sent
- Status changes auto-save with timestamp updates
- Dropdown can be changed multiple times
- Move status field inline with personal info for cleaner layout"
```

- [ ] **Step 3: Verify commit**

```bash
git log --oneline -1
```

Expected output: `feat: add editable status dropdown for candidate link status`

---

## Self-Review Checklist

✅ **Spec coverage:**
- [x] Status field is editable dropdown → Task 2-3
- [x] Default is "Chưa gửi" → Task 2 (option value 0 is default)
- [x] Options: "Chưa gửi" / "Đã gửi" → Task 2
- [x] Auto-save on selection → Task 3
- [x] Update link_sent_at when "Đã gửi" → Task 1
- [x] Changeable multiple times → Task 3 (no disabled state)
- [x] Move to same row as personal info → Task 2

✅ **No placeholders:**
- [x] Complete API endpoint code provided
- [x] Complete HTML changes shown
- [x] Complete event handler code shown
- [x] Exact commands with expected output
- [x] No "add validation" or "handle errors" without code

✅ **Type consistency:**
- [x] `link_sent` is integer (0/1) throughout
- [x] Endpoint path: `/candidates/:candidate_id/update-status`
- [x] Selector: `.link-status-select`

---

**Plan complete and saved.** Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach would you prefer?

