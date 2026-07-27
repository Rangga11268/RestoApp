# Design — RestoApp

A locked design system for the RestoApp internal dashboard. Every page redesign reads this file before emitting code. Do not regenerate per page — extend or amend this file when the system needs to grow.

## Genre

modern-minimal

## Macrostructure family

- App pages: Workbench — all pages share a consistent header + content + action rhythm. Variation knobs: card density, filter position, table vs grid layout.

## Theme

- `--color-paper`     oklch(0.96 0.01 70)
- `--color-paper-2`   oklch(0.94 0.01 70)
- `--color-surface`   oklch(0.985 0.008 70)
- `--color-sidebar`   oklch(0.22 0.015 65)
- `--color-sidebar-hover` oklch(0.28 0.018 65)
- `--color-sidebar-active` oklch(0.35 0.06 35)
- `--color-ink`       oklch(0.15 0.01 70)
- `--color-ink-2`     oklch(0.35 0.01 70)
- `--color-ink-sidebar` oklch(0.7 0.015 65)
- `--color-rule`      oklch(0.88 0.01 70)
- `--color-accent`    oklch(0.55 0.09 35)
- `--color-accent-hover` oklch(0.48 0.09 35)
- `--color-accent-light` oklch(0.93 0.03 35)
- `--color-success`   oklch(0.55 0.07 150)
- `--color-danger`    oklch(0.55 0.12 25)
- `--color-warning`   oklch(0.65 0.1 75)
- `--color-focus`     oklch(0.55 0.09 35)

## Typography

- Display: Inter, weight 600/700, style normal
- Body:    Inter, weight 400/500
- Mono:    ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace
- Type scale:

```
--text-xs:   0.6875rem   (11px)
--text-sm:   0.75rem     (12px)
--text-base: 0.8125rem   (13px)
--text-md:   0.875rem    (14px)
--text-lg:   1rem        (16px)
--text-xl:   1.125rem    (18px)
--text-2xl:  1.375rem    (22px)
--text-3xl:  1.75rem     (28px)
```

## Spacing

4-point named scale. Page components must use named tokens (`var(--space-md)`), never raw values.

```
--space-3xs: 0.25rem
--space-2xs: 0.5rem
--space-xs:  0.75rem
--space-sm:  1rem
--space-md:  1.5rem
--space-lg:  2rem
--space-xl:  3rem
--space-2xl: 4rem
```

## Motion

- Easings: `--ease-out` cubic-bezier(0.16, 1, 0.3, 1), `--ease-in` cubic-bezier(0.4, 0, 1, 1)
- Reveal pattern: none — data pages don't animate in
- Reduced-motion: opacity-only ≤ 150ms

## Microinteractions stance

- Silent success: no toasts for saves, only inline feedback
- Hover delay 0ms — this is a tool, not a browsable site
- Loading: skeleton only, no spinners

## CTA voice

- Primary: solid accent bg, white text, rounded-8, px-4 py-2, text-sm medium
- Secondary: outline with rule border, ink text, same shape
- Danger: solid danger bg, white text, same shape

## Per-page allowances

- App pages MUST NOT use enrichment — function carries the page.

## What pages MUST share

- The accent colour and its placement (buttons, active nav, badges)
- The display + body fonts (Inter throughout, one weight for hierarchy)
- The CTA voice (same button shape, radius, padding across all pages)
- Section heading rhythm (page title + optional description)
- Card treatment (subtle surface bg, rule border, compact padding)

## What pages MAY differ on

- Card density (data-heavy pages use tighter cards)
- Filter/search bar position (inline vs stacked)
- Table vs grid layout for list views

## Hallmark · genre: modern-minimal · design-system: design.md

## Exports

### tokens.css