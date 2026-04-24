0.3.---
version: alpha
name: Alkhaf Money Management
description: A budgeting dashboard design system that combines a calm desktop workspace with a softer, rounded mobile banking presentation. It uses clean slate neutrals, deep green financial surfaces, and a bright lime accent to signal action.
colors:
  canvas: "#F8FAFC"
  canvas-mobile: "#F5F6F1"
  surface: "#FFFFFF"
  surface-dark: "#1E293B"
  surface-muted: "#F1F5F9"
  surface-hover: "#F8FAFC"
  overlay: "#000000"
  text-primary: "#1E293B"
  text-primary-dark: "#F8FAFC"
  text-secondary: "#64748B"
  text-secondary-dark: "#94A3B8"
  border: "#E2E8F0"
  border-dark: "#334155"
  primary: "#213F31"
  primary-mobile: "#1A3628"
  primary-dark-theme: "#3A7587"
  on-primary: "#FFFFFF"
  accent: "#D2F411"
  accent-mobile: "#C7E436"
  on-accent: "#0F172A"
  secondary: "#2D5866"
  secondary-mobile: "#334155"
  success: "#10B981"
  success-dark: "#34D399"
  danger: "#EF4444"
  danger-dark: "#F87171"
  danger-soft: "#FEE2E2"
  warning: "#EAB308"
  chart-1: "#D2F411"
  chart-2: "#213F31"
  chart-3: "#2D5866"
  chart-4: "#F59E0B"
  chart-5: "#EC4899"
  chart-6: "#8B5CF6"
  chart-7: "#34D399"
  chart-8: "#F87171"
typography:
  display-lg:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 40px
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: -0.02em
  heading-xl:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -0.02em
  heading-lg:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 28px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.02em
  heading-md:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.01em
  title-md:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.35
  body-lg:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.5
  body-md:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.45
  label-lg:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.25
  label-md:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.2
  label-sm:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.2
  label-xs:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 10px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: 0.04em
rounded:
  sm: 8px
  md: 12px
  lg: 16px
  xl: 20px
  xxl: 24px
  card-mobile: 28px
  sheet: 30px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 20px
  xxl: 24px
  section: 32px
  page: 48px
  nav-height: 80px
  fab-size: 64px
elevation:
  flat: "none"
  subtle: "0 2px 10px rgba(0, 0, 0, 0.02)"
  soft: "0 4px 15px rgba(0, 0, 0, 0.02)"
  raised: "0 10px 20px rgba(0, 0, 0, 0.05)"
  floating: "0 -10px 25px rgba(0, 0, 0, 0.05)"
  focus-lime: "0 10px 20px rgba(199, 228, 54, 0.4)"
  modal: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
shadows:
  sidebar: "2px 0 10px rgba(0, 0, 0, 0.02)"
  bell: "0 4px 10px rgba(0, 0, 0, 0.03)"
  card: "0 10px 20px rgba(0, 0, 0, 0.05)"
  sheet: "0 -10px 25px rgba(0, 0, 0, 0.05)"
  promo: "0 4px 15px rgba(0, 0, 0, 0.02)"
  login: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
motion:
  duration-fast: "200ms"
  duration-medium: "300ms"
  easing-standard: "ease"
  easing-emphasized: "ease-out"
  hover-lift: "translateY(-2px)"
  sheet-enter: "slide-up"
  overlay-blur: "4px"
components:
  app-shell:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.text-primary}"
    padding: "{spacing.page}"
  app-shell-mobile:
    backgroundColor: "{colors.canvas-mobile}"
    textColor: "{colors.text-primary}"
    padding: "{spacing.xxl}"
  sidebar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
  card-surface:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
    padding: "{spacing.xxl}"
  hero-panel:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.xl}"
    padding: "{spacing.section}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.md}"
    padding: 16px
  button-accent:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.full}"
    padding: 16px
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.md}"
    padding: 16px
  button-success:
    backgroundColor: "{colors.success}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.md}"
    padding: 16px
  button-danger:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger}"
    typography: "{typography.label-md}"
    rounded: "{rounded.sm}"
    padding: 8px
  input-field:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body-lg}"
    rounded: "{rounded.md}"
    padding: 16px
  search-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body-lg}"
    rounded: "{rounded.full}"
    padding: 12px
  bank-card-accent:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.card-mobile}"
    padding: "{spacing.xxl}"
  bank-card-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.card-mobile}"
    padding: "{spacing.xxl}"
  bank-card-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.card-mobile}"
    padding: "{spacing.xxl}"
  mobile-bottom-nav:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.sheet}"
    height: "{spacing.nav-height}"
  mobile-fab:
    backgroundColor: "{colors.accent-mobile}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.xl}"
    height: "{spacing.fab-size}"
    width: "{spacing.fab-size}"
  modal:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
    padding: "{spacing.section}"
  modal-sheet-mobile:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xxl}"
    padding: "{spacing.xxl}"
  timeline-pill-active:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: 8px
  timeline-pill-idle:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-secondary}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.full}"
    padding: 8px
---

## Overview

This design system expresses personal finance as calm control rather than aggressive productivity. The experience should feel trustworthy, airy, and modern, with just enough personality to avoid looking like generic accounting software.

The identity has two closely related modes. On desktop, it behaves like a clean finance workspace: white cards, pale slate backgrounds, deep green hero surfaces, and restrained structure. On mobile, the same product becomes softer and more tactile: warmer cream backgrounds, chunkier cards, more rounded corners, and obvious floating controls inspired by modern consumer banking apps.

The bright lime accent is the signature. It should be used as a precise signal for action, affirmation, and focus rather than as a general-purpose fill color. The deep green and blue-gray tones carry the serious financial tone, while the lime injects freshness and momentum.

## Colors

The palette is built from cool neutrals plus a small set of finance-oriented brand accents.

- **Canvas:** Use soft near-white slates for the main workspace. Desktop should feel crisp and technical, while mobile can lean slightly warmer and creamier.
- **Primary:** Deep evergreen is the main brand surface color. It anchors hero panels, selected navigation, and moments that need confidence and authority.
- **Accent:** Electric lime is reserved for key actions, floating controls, branded icons, and active progress cues. It is intentionally high-contrast and energetic.
- **Secondary:** Blue-gray is the supporting accent for transfers, secondary financial actions, and cooler supporting cards.
- **Semantic feedback:** Success is a saturated emerald; danger is a vivid red paired with a pale red tint for destructive surfaces or inline warnings.
- **Data visualization:** Charts may extend beyond the core palette with amber, pink, purple, and mint, but these colors should stay inside analytic or categorical contexts rather than becoming general UI chrome.

In dark mode, keep the same hierarchy rather than inventing a new brand. Surfaces become slate, text becomes near-white, borders darken, and the accent colors remain vivid enough to preserve the product’s energetic signature.

## Typography

Typography should feel direct and contemporary. Use Inter or a visually equivalent modern UI sans with a clear hierarchy and relatively few weights.

- **Displays and balance figures:** Large values should be bold, compact, and slightly tightened to feel decisive and numeric.
- **Page titles and section headings:** Use semi-bold or bold weights with minimal decoration. The tone should be competent, not editorial.
- **Body text:** Keep it clean and neutral with comfortable line height. Most interface copy can live in the 14px to 16px range.
- **Labels and controls:** Buttons, tabs, badges, and small metadata should use medium to semi-bold weights so controls stay legible on bright fills and dense dashboards.
- **Microcopy:** Very small labels are acceptable for card metadata, dates, and helper text, but they should remain crisp and never overly stylized.

Avoid expressive display fonts, serif treatments, or ornamental numerals. The product relies on clarity and rhythm more than typographic flair.

## Layout

The layout combines dashboard density with generous breathing room.

- **Desktop:** Use a left-hand navigation rail, a roomy content panel, and card-based groupings. Spacing should feel structured and predictable, with 16px to 32px increments doing most of the work.
- **Mobile:** Shift to stacked sections with stronger card silhouettes and more rounded shapes. The bottom navigation should feel persistent and touch-friendly, with a central floating action standing above the rest.
- **Containment:** Important information is grouped inside white or dark-surface cards with clear internal padding rather than divider-heavy table styling.
- **Search and filters:** Search bars and selector pills should feel lightweight and pill-shaped, using curvature and spacing to communicate affordance instead of borders alone.
- **Rhythm:** Use 4px and 8px micro-steps only for fine alignment, icon spacing, and progress/detail treatments. Major composition should stay on 16px, 24px, and 32px intervals.

## Elevation & Depth

Depth is subtle almost everywhere except the login state and the mobile floating controls.

- Most desktop surfaces rely on tonal contrast, white cards, and gentle edge separation instead of dramatic drop shadows.
- Mobile controls can float a bit more, especially bells, FABs, bottom navigation, and promotional banners.
- The lime floating action button is the most visually lifted element in the system and should feel physically prominent.
- The login card is the one place where dramatic shadow and dark ambience are appropriate. It should feel isolated, secure, and frontmost.
- Modal overlays should dim the background and add a small backdrop blur so dialogs feel layered without becoming glassmorphic.

## Shapes

Shape language is one of the strongest signals in the product.

- **Desktop:** Use rounded rectangles around 12px to 20px for cards, widgets, and navigation states. The tone is polished and modern without becoming playful.
- **Mobile:** Increase roundness noticeably. Large cards can reach 24px to 28px radii, and the bottom navigation can use a sheet-like curved top edge.
- **Pills and circles:** Search fields, month selectors, icon buttons, avatars, and compact actions should use fully rounded or circular forms.
- **Squircle-like controls:** Mobile action shortcuts and the floating button should feel soft and tactile, closer to rounded consumer-finance hardware than to sharp enterprise UI.

Do not mix sharp-cornered data grids with ultra-soft mobile controls in the same viewport without a clear reason. Each surface should belong to the overall rounded family.

## Components

Buttons come in four clear families. Primary buttons use deep green for core budgeting actions. Accent buttons use lime when the interaction should feel especially branded or high-priority. Secondary buttons use blue-gray for transfer or support actions. Success and danger treatments should stay strictly semantic.

Cards are the primary structural primitive. White cards on pale backgrounds create the everyday dashboard language. Dark green cards are reserved for hero summaries, timeline panels, and promotional emphasis. Financial cards can use lime, deep green, blue-gray, or amber fills with strong contrast and minimal decoration.

Inputs should feel soft, filled, and approachable. Prefer muted background fills with little or no visible border until focus. Search bars should be pill-shaped and lighter than the content around them.

Navigation has two personalities. Desktop nav is a quiet vertical rail with a single dark selected state. Mobile nav is a persistent dock with a raised central action. The selected state should shift text/icon emphasis rather than introducing multiple competing colors.

Charts should be simple and readable. Use donut and progress patterns with bright categorical colors, but keep surrounding chrome minimal so the visualization remains the focus.

Modals should inherit the same card language as the dashboard. Desktop modals can be centered cards; mobile modals should rise as rounded bottom sheets.

## Do's and Don'ts

- Do keep lime as a deliberate highlight color rather than flooding the whole interface with it.
- Do preserve the contrast between calm neutral work surfaces and bold financial action surfaces.
- Do let mobile feel softer and more tactile than desktop.
- Do use dark green for authority, summaries, and selected navigation.
- Do keep most shadows soft and low-contrast.
- Don't replace the pale slate or cream backgrounds with pure white edge-to-edge layouts.
- Don't introduce heavy outlines when spacing, fill, and rounded shape already communicate structure.
- Don't overcomplicate typography with too many weights or type families.
- Don't turn analytics colors into generic button colors.
