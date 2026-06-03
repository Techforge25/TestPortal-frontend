# Project Context

# Project Type

This project is a professional Test Portal / Assessment Platform.

The system allows:

- admins to create/manage assessments
- candidates to attempt tests
- realtime monitoring
- anti-cheat/security enforcement
- result reviewing

---

# Main Systems

## Admin Portal

Handles:

- dashboard
- candidate management
- create test wizard
- test list
- results review
- notifications
- settings
- violations log

---

## Candidate Portal

Handles:

- registration
- sign in
- pre-test flow
- MCQ tests
- coding tasks
- UI preview tasks
- assessment sections
- submissions

---

## Assessment Engine

Handles:

- timers
- scoring
- answer persistence
- progression
- submission orchestration

---

## Security Engine

Handles:

- fullscreen enforcement
- tab switching
- copy/paste blocking
- warnings
- violations
- browser monitoring

---

## Realtime Engine

Handles:

- websocket subscriptions
- live updates
- realtime synchronization

---

# Current Problems

Current architecture issues:

- app/ contains business logic
- giant components
- backendApi.ts is overloaded
- assessment logic scattered
- security tightly coupled
- shared folder not truly shared
- mixed responsibilities

---

# Final Goal

Transform the project into:

- scalable architecture
- modular frontend system
- maintainable codebase
- reusable engineering system
- enterprise-level structure
