# Development Rules

# Core Rules

## NEVER:

- mass move the entire project
- rewrite working UI unnecessarily
- break routes
- introduce unstable architecture
- mix business logic inside JSX

---

## ALWAYS:

- refactor incrementally
- extract logic first
- update imports safely
- preserve compatibility
- run lint/build after major changes

---

# Component Rules

- avoid giant components
- target under ~300 lines
- extract hooks/services/helpers
- keep pages focused on composition

---

# TypeScript Rules

- avoid any
- use strict typing
- centralize shared types
- avoid duplicated interfaces

---

# Validation Rules

- validation belongs near modules
- avoid duplicated validation
- keep schemas reusable

---

# Import Rules

- use aliases
- avoid deep relative imports
- avoid circular dependencies

---

# Shared Folder Rules

Only truly reusable systems belong inside:

```txt
src/components/ui/
```

Do NOT place:

- admin-specific
- candidate-specific
- assessment-specific

logic into shared folders.

---

# Refactor Strategy

Correct approach:

1. extract logic
2. create hooks/services
3. update imports
4. test behavior
5. move safely
6. cleanup

Wrong approach:

- move everything at once
- rewrite entire architecture in one step
