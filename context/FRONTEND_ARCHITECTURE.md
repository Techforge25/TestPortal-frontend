# Frontend Architecture

# Target Structure

```txt
src/
├── app/
├── modules/
│   ├── admin/
│   ├── candidate/
│   ├── test-management/
│   ├── assessment-engine/
│   ├── security/
│   ├── realtime/
│   └── auth/
├── components/
│   ├── ui/
│   ├── forms/
│   ├── layouts/
│   ├── navigation/
│   └── feedback/
├── services/
│   ├── api/
│   ├── storage/
│   ├── realtime/
│   └── security/
├── hooks/
├── store/
├── schemas/
├── types/
├── utils/
├── constants/
├── config/
└── styles/
```

---

# Core Principles

## Feature-Based Ownership

Each module must own:

- pages
- components
- hooks
- services
- validation
- types
- constants
- utils

---

## Thin Route Files

app/ should mostly handle routing.

Correct example:

```tsx
import CreateTestPage from "@/modules/test-management/pages/CreateTestPage";

export default CreateTestPage;
```

Route files must NOT contain:

- business logic
- validation
- API handling
- payload mapping

---

## Separation of Concerns

Never mix:

- JSX
- API calls
- validation
- storage
- serialization
- transformations

inside the same file.

---

# Major Modules

## test-management/

Owns:

- create test wizard
- role configs
- validation
- payload builders
- upload handling

---

## assessment-engine/

Owns:

- scoring
- timers
- progression
- persistence
- submission builders

---

## security/

Owns:

- fullscreen monitoring
- warnings
- anti-cheat
- violations
- browser tracking

---

## realtime/

Owns:

- websocket handling
- subscriptions
- realtime refresh systems
