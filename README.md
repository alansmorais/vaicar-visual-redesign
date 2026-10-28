# VaiCar — Visual Redesign (Preview)

This repository is the isolated workspace for the VaiCar visual refresh.

## Safety boundaries

- This repository is separate from `alansmorais/-vaicar-app`.
- Do not deploy this repository to the production domain.
- Do not modify backend/API routes, authentication behavior, database configuration, ride rules, or payment logic.
- Do not modify Android/Kotlin/Gradle projects or APKs.
- Preserve the existing VaiCar logo artwork. If recoloring is feasible, change colors only and keep the original asset unchanged as a backup.
- Use real existing application data and existing API contracts; do not introduce mock data.
- Keep the current production website unchanged.

## Visual direction

A clean, modern visual identity inspired by São Sebastião and the North Coast of São Paulo:

- Deep coastal navy: `#102A36`
- Ocean teal: `#087F8C`
- Sea green: `#42BFA5`
- Sand: `#F4F0E7`
- White: `#FFFFFF`

Priorities:
1. Improve visual hierarchy, spacing, typography, and responsive layouts.
2. Simplify homepage and passenger/driver login screens.
3. Improve passenger and driver dashboard clarity without changing behavior.
4. Keep accessibility and contrast in mind.
5. Test the frontend build and existing visual flows before considering any deployment.

## Source project

The current source reference is [alansmorais/-vaicar-app](https://github.com/alansmorais/-vaicar-app). Before implementation, import/copy the source into this repository and verify that all required frontend assets are present. Do not edit the source repository directly.
