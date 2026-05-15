# BruinGains

A fitness and nutrition app built for UCLA students. Track workouts, log meals from campus dining halls, and monitor gym capacity — all on-device with no account required.

## Features

- **Workout Tracking** — Log sets, reps, and weights. Create custom templates or start from pre-built push/pull/legs, upper/lower, and full-body splits.
- **Nutrition Logging** — Browse real-time UCLA dining hall menus and log meals with accurate macros. Set daily calorie and macro targets.
- **Campus Gym** — Live gym capacity for UCLA recreation centers.
- **Local-first** — All personal data stays on your device. No account, no sign-up.

## Stack

- React Native + Expo (expo-router)
- TypeScript
- Appwrite (authenticated public dining/gym data gateway)

## Getting Started

```bash
npm install
npx expo start
```

## Appwrite Backend

The mobile Appwrite project and endpoint are hardcoded in `lib/appwrite/client.ts`.
Backend scripts read `APPWRITE_ENDPOINT`, `APPWRITE_PROJECT_ID`, and
`APPWRITE_API_KEY` from `.env`, `.env.local`, or the local Codex Appwrite MCP
config.
