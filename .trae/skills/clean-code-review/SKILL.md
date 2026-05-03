---
name: clean-code
description: Pragmatic coding standards for writing clean, maintainable code — naming, functions, structure, anti-patterns, and pre-edit safety checks. Use when writing new code, refactoring existing code, reviewing code quality, or establishing coding standards.
---

# Clean Code

> Be **concise, direct, and solution-focused**. Clean code reads like well-written prose — every name reveals intent, every function does one thing, and every abstraction earns its place.

## Core Principles

| Principle | Rule | Practical Test |
|-----------|------|----------------|
| **SRP** | Single Responsibility — each function/class does ONE thing | "Can I describe what this does without using 'and'?" |
| **DRY** | Don't Repeat Yourself — extract duplicates, reuse | "Have I written this logic before?" |
| **KISS** | Keep It Simple — simplest solution that works | "Is there a simpler way to achieve this?" |
| **YAGNI** | You Aren't Gonna Need It — don't build unused features | "Does anyone need this right now?" |
| **Boy Scout** | Leave code cleaner than you found it | "Is this file better after my change?" |

## Naming Rules

Names are the most important documentation. A good name eliminates the need for a comment.

| Element | Convention | Bad | Good |
|---------|------------|-----|------|
| **Variables** | Reveal intent | `n`, `d`, `tmp` | `userCount`, `elapsed`, `activeUsers` |
| **Functions** | Verb + noun | `user()`, `calc()` | `getUserById()`, `calculateTotal()` |
| **Booleans** | Question form | `active`, `flag` | `isActive`, `hasPermission`, `canEdit` |
| **Constants** | SCREAMING_SNAKE | `max`, `timeout` | `MAX_RETRY_COUNT`, `REQUEST_TIMEOUT_MS` |
| **Classes** | Noun, singular | `Manager`, `Data` | `UserRepository`, `OrderService` |
| **Enums** | PascalCase values | `'pending'` string | `Status.Pending` |

> **Rule:** If you need a comment to explain a name, rename it.

### Naming Anti-Patterns

| Anti-Pattern | Problem | Fix |
|--------------|---------|-----|
| Cryptic abbreviations (`usrMgr`, `cfg`) | Unreadable in 6 months | Spell it out — IDE autocomplete makes long names free |
| Generic names (`data`, `info`, `item`, `handler`) | Says nothing about purpose | Use domain-specific names that reveal intent |
| Misleading names (`getUserList` returns one user) | Actively deceives readers | Match name to behavior, or change the behavior |
| Hungarian notation (`strName`, `nCount`, `IUser`) | Redundant with type system | Let TypeScript/IDE show types; names describe purpose |

## Function Rules

| Rule | Guideline | Why |
|------|-----------|-----|
| **Small** | Max 20 lines, ideally 5-10 | Fits in your head |
| **One Thing** | Does one thing, does it well | Testable and nameable |
| **One Level** | One level of abstraction per function | Readable top to bottom |
| **Few Args** | Max 3 arguments, prefer 0-2 | Easy to call correctly |
| **No Side Effects** | Don't mutate inputs unexpectedly | Predictable behavior |

### Guard Clauses

Flatten nested conditionals with early returns. Never nest deeper than 2 levels.

```typescript
// BAD — 5 levels deep
function processOrder(order: Order) {
  if (order) {
    if (order.items.length > 0) {
      if (order.customer) {
        if (order.customer.isVerified) {
          return submitOrder(order);
        }
      }
    }
  }
  throw new Error('Invalid order');
}

// GOOD — guard clauses flatten the structure
function processOrder(order: Order) {
  if (!order) throw new Error('No order');
  if (!order.items.length) throw new Error('No items');
  if (!order.customer) throw new Error('No customer');
  if (!order.customer.isVerified) throw new Error('Customer not verified');
  return submitOrder(order);
}
```

## Anti-Patterns

| Anti-Pattern | Problem | Fix |
|--------------|---------|-----|
| Comment every line | Noise obscures signal | Delete obvious comments; comment *why*, not *what* |
| Helper for one-liner | Unnecessary indirection | Inline the code |
| `utils.ts` with 1 function | Junk drawer file | Put code where it's used |
| Deep nesting | Unreadable flow | Guard clauses and early returns |
| Magic numbers | Unclear intent | Named constants |
| God functions | Untestable, unreadable | Split by responsibility |
| Commented-out code | Dead code confusion | Delete it; git remembers |
| Copy-paste programming | Duplicated bugs | Extract shared logic |
| Stringly-typed code | Typos and missed cases | Use enums or union types |

## Pre-Edit Safety Check

Before changing any file, answer these questions:

| Question | Why |
|----------|-----|
| **What imports this file?** | Dependents might break on interface changes |
| **What does this file import?** | You might need to update the contract |
| **What tests cover this?** | Tests might fail — update them alongside code |
| **Is this a shared component?** | Multiple consumers means wider blast radius |

## NEVER Do

1. **NEVER add comments that restate the code** — rename things until it doesn't need comments
2. **NEVER create abstractions for fewer than 3 use cases** — premature abstraction is worse than duplication
3. **NEVER leave commented-out code in the codebase** — delete it; version control exists for history
4. **NEVER write functions longer than 20 lines** — extract sub-functions
5. **NEVER nest deeper than 2 levels** — use guard clauses, early returns, or extract functions
6. **NEVER use magic numbers or strings** — define named constants with clear semantics
7. **NEVER edit a file without checking what depends on it**
8. **NEVER leave a task with failing lint or type checks** — fix all errors before marking complete
