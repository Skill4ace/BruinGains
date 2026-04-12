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
- Supabase (public dining/gym data only)

## Getting Started

```bash
npm install
npx expo start
```

## Environment

Copy `.env.example` to `.env` and fill in your Supabase credentials.

```bash
cp .env.example .env
```
