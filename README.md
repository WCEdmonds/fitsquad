# FitSquad

FitSquad is a fitness tracking and workout planning platform built for military units. It turns raw soldier fitness data into actionable training — collecting ACFT scores, run times, and health metrics to generate tailored workout programs, track progress across a unit, and group soldiers by performance.

## Features

- **Data-Driven Insights** — Collect soldier AFT/ACFT scores, run times, and health data for a clear picture of unit fitness.
- **Intelligent Workout Plans** — Generate tailored programs for individuals, squads, or the whole company based on actual performance data.
- **Comprehensive Progress Tracking** — Soldiers log progress; commanders monitor improvements across the unit over time.
- **Automatic Tiered Grouping** — Dynamically split soldiers into focus groups to target specific deficiencies and optimize training.

## Platforms

- **Web** — A desktop landing page plus a full dashboard for commanders and soldiers.
- **iOS** — A native mobile app via Capacitor; mobile users are routed straight to login/dashboard.

## Tech Stack

- **Framework:** Next.js (static export) + React + TypeScript
- **UI:** Tailwind CSS with Radix UI / shadcn components
- **Backend:** Firebase (Firestore, Auth, Cloud Functions)
- **Mobile:** Capacitor (iOS)
- **Hosting:** Firebase Hosting

## Getting Started

```bash
npm install
npm run dev        # start the dev server
```

Other scripts:

```bash
npm run build      # produce the static export in /out
npm run lint       # lint
npm run typecheck  # type-check with tsc
```

## Deployment

The app is a Next.js static export deployed to Firebase Hosting:

```bash
npm run build
firebase deploy --only hosting
```

Live site: https://studio-7165447913-7fa8f.web.app
