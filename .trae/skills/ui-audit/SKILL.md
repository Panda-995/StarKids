---
name: ui-audit
description: "AI skill for automated UI audits. Evaluate interfaces against proven UX principles for visual hierarchy, accessibility, cognitive load, navigation, and more. Based on Making UX Decisions by Tommy Geoco."
---

# UI Audit Skill

Evaluate interfaces against proven UX principles. Based on Making UX Decisions by Tommy Geoco.

## When to Use This Skill

- Making UI/UX design decisions under time pressure
- Evaluating design trade-offs with business context
- Choosing appropriate UI patterns for specific problems
- Reviewing designs for completeness and quality
- Structuring design thinking for new interfaces

## Core Philosophy

**Speed ≠ Recklessness.** Designing quickly is not automatically reckless. Recklessly designing quickly is reckless. The difference is intentionality.

## The 3 Pillars of Warp-Speed Decisioning

1. **Scaffolding** — Rules you use to automate recurring decisions
2. **Decisioning** — Process you use for making new decisions
3. **Crafting** — Checklists you use for executing decisions

## Decision Workflow Summary

When facing a UI decision:

```
1. WEIGH INFORMATION
   ├─ What does institutional knowledge say? (existing patterns, brand, tech constraints)
   ├─ What are users familiar with? (conventions, competitor patterns)
   └─ What does research say? (user testing, analytics, studies)

2. NARROW OPTIONS
   ├─ Eliminate what conflicts with constraints
   ├─ Prioritize what aligns with macro bets
   └─ Choose based on JTBD support

3. EXECUTE
   └─ Apply relevant checklist + patterns
```

## Macro Bet Categories

| Bet | Description | Design Implication |
|-----|-------------|-------------------|
| **Velocity** | Features to market faster | Reuse patterns, find metaphors in other markets |
| **Efficiency** | Manage waste better | Design systems, reduce WIP |
| **Accuracy** | Be right more often | Stronger research, instrumentation |
| **Innovation** | Discover untapped potential | Novel patterns, cross-domain inspiration |

## Key Principle: Good Design Decisions Are Relative

A design decision is "good" when it:
- Supports the product's jobs-to-be-done
- Aligns with company macro bets
- Respects constraints (time, tech, team)
- Balances user familiarity with differentiation needs

## Generating Audit Reports

### Required Sections (always include)
1. **Visual Hierarchy** — Headings, CTAs, grouping, reading flow, type scale, color hierarchy, whitespace
2. **Visual Style** — Spacing consistency, color usage, elevation/depth, typography, motion/animation
3. **Accessibility** — Keyboard navigation, focus states, contrast ratios, screen reader support, touch targets

### Contextual Sections (include when relevant)
4. **Navigation** — For multi-page apps: wayfinding, breadcrumbs, menu structure, information architecture
5. **Usability** — For interactive flows: discoverability, feedback, error handling, cognitive load
6. **Onboarding** — For new user experiences: first-run, tutorials, progressive disclosure
7. **Social Proof** — For landing/marketing pages: testimonials, trust signals, social integration
8. **Forms** — For data entry: labels, validation, error messages, field types

### Checks Per Section (aim for 6-10 each)

**Visual Hierarchy**: heading distinction, primary action clarity, grouping/proximity, reading flow, type scale, color hierarchy, whitespace usage, visual weight balance

**Visual Style**: spacing consistency, color palette adherence, elevation/shadows, typography system, border/radius consistency, icon style, motion principles

**Accessibility**: keyboard operability, visible focus, color contrast (4.5:1), touch targets (44px), alt text, semantic markup, reduced motion support

**Navigation**: clear current location, predictable menu behavior, breadcrumb presence, search accessibility, mobile navigation pattern

**Usability**: feature discoverability, feedback on actions, error prevention, recovery options, cognitive load management, loading states
