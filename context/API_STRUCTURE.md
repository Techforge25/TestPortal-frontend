# API Structure

# Current Problem

Current:

```txt
backendApi.ts
```

is overloaded and mixes:

- admin APIs
- candidate APIs
- uploads
- settings
- reviews
- violations
- auth
- submissions

This creates poor scalability.

---

# Target Structure

```txt
src/services/api/
├── httpClient.ts
├── adminTestsApi.ts
├── adminReviewsApi.ts
├── adminSettingsApi.ts
├── candidateApi.ts
├── uploadsApi.ts
├── violationsApi.ts
├── realtimeApi.ts
└── index.ts
```

---

# Rules

## API calls never belong inside JSX

Wrong:

```tsx
await fetch(...)
```

inside components.

Correct:

```tsx
services/api/*
```

---

# API Ownership

## adminTestsApi.ts

Owns:

- create test
- update test
- publish test
- test list

---

## adminReviewsApi.ts

Owns:

- results review
- candidate reviews
- review detail

---

## candidateApi.ts

Owns:

- candidate auth
- submissions
- candidate session
- assessment progress

---

## uploadsApi.ts

Owns:

- image uploads
- PDF uploads
- editor uploads

---

# Important Rules

- split APIs by domain
- avoid giant API files
- centralize request handling
- centralize response mapping
- avoid duplicated request logic
