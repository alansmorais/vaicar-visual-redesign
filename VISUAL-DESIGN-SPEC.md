# VaiCar Visual Design System

Status: design specification only. This repository does not yet contain the application source, so these tokens are not wired into the live app.

## Goals

- Minimal, confident, locally recognizable mobility brand for São Sebastião and the Litoral Norte.
- Preserve existing information architecture and behavior.
- Improve hierarchy and legibility on small phones first.
- Reuse the current VaiCar logo artwork; recolor only a copy of the existing asset if its format supports safe color edits.

## Color tokens

| Token | Value | Intended use |
|---|---|---|
| `--vc-color-ink` | `#102A36` | Primary text, deep surfaces |
| `--vc-color-ocean` | `#087F8C` | Primary actions, active navigation |
| `--vc-color-seafoam` | `#42BFA5` | Secondary accent, success highlights |
| `--vc-color-sand` | `#F4F0E7` | Warm page background and subtle panels |
| `--vc-color-white` | `#FFFFFF` | Cards and readable surfaces |
| `--vc-color-muted` | `#5D7078` | Secondary text on light backgrounds |
| `--vc-color-border` | `#D8E1E2` | Dividers and card borders |
| `--vc-color-danger` | `#B42318` | Error states only |

## Suggested CSS variables

These are proposed values, not yet connected to the app:

```css
:root {
  --vc-color-ink: #102A36;
  --vc-color-ocean: #087F8C;
  --vc-color-seafoam: #42BFA5;
  --vc-color-sand: #F4F0E7;
  --vc-color-white: #FFFFFF;
  --vc-color-muted: #5D7078;
  --vc-color-border: #D8E1E2;
  --vc-color-danger: #B42318;
  --vc-radius-card: 1rem;
  --vc-radius-control: 0.75rem;
  --vc-shadow-card: 0 8px 24px rgb(16 42 54 / 8%);
}
```

## Screen guidance

### Homepage
- Keep the existing brand mark and recognizable name.
- One clear primary action per section.
- Use a restrained coastal accent; avoid decorative waves and tourist-poster styling.
- Make passenger and driver entry points distinct and easy to scan.

### Login and registration
- Preserve every existing field, validation, OTP flow, and destination route.
- Use a compact form, clear labels, visible focus states, and readable errors.
- Do not rewrite auth calls or response handling.

### Passenger
- Keep map and pickup/destination controls prominent.
- Use a clear visual hierarchy for trip status, fare, and primary next action.
- Do not change fare calculations, ride states, or map/API behavior.

### Driver
- Make online/offline state unambiguous.
- Emphasize the current actionable task, then trip details and earnings.
- Do not change eligibility, document approval, dispatch, or ride lifecycle behavior.

### Responsive/accessibility
- Mobile-first layouts, visible keyboard focus, sufficient contrast, touch targets around 44px minimum.
- Respect reduced-motion settings and existing light/dark mode behavior.
- Do not rely on color alone for status.

## Logo safety checklist

1. Locate and inspect the original asset in the copied source.
2. Keep an untouched copy of the original.
3. Determine whether the file is SVG or raster.
4. If SVG, change only fill/stroke color attributes that are clearly part of the logo; preserve geometry and text.
5. If raster, do not apply automatic recoloring that damages edges or brand details; leave it unchanged unless a precise recolor can be verified.
6. Compare before/after at small sizes and on light/dark backgrounds.

## Non-negotiable boundaries

- No backend, API, auth, database, payments, or business-rule changes.
- No Android/Kotlin/Gradle/APK changes.
- No production deploy, domain or hosting configuration changes.
- No mock/fake data.
- Do not remove existing features.
- Build and test only after the full source is imported.
