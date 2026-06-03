# Flow Architecture

# Admin Flow

```txt
Admin Login
→ Dashboard
→ Create Test
→ Configure Assessment
→ Publish Test
→ Review Results
→ Review Violations
```

---

# Candidate Flow

```txt
Registration
→ Sign In
→ Pre-Test
→ MCQ
→ UI Preview
→ Assessment Sections
→ Coding Task
→ Submit
→ Success Screen
```

---

# Assessment Flow

Assessment engine handles:

- timers
- scoring
- progression
- persistence
- submissions

Candidate pages should only render UI.

---

# Security Flow

Security engine handles:

- fullscreen enforcement
- tab switching
- warnings
- violation logging
- browser monitoring
- auto-submit

Security must stay independent from candidate UI.

---

# Realtime Flow

Realtime system handles:

- subscriptions
- websocket events
- live refresh
- synchronization

---

# Create-Test Flow

```txt
Basic Info
→ MCQ Setup
→ Assessment Config
→ Security Config
→ Review & Publish
```

This module must become isolated inside:

```txt
src/modules/test-management/
```
