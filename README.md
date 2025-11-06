# LiftLedger

A fitness tracking application built as a monorepo. Track workouts across strength training, cardio, and calisthenics with detailed analytics and progress monitoring.

## Structure

- **`expo-app/`** - React Native mobile app (iOS/Android)
- **`web/`** - Next.js web app (PWA)
- **`packages/shared/`** - Shared business logic and services

## Quick Start

# Install dependencies
npm install

# Run mobile app
cd expo-app && npm start

# Run web app
cd web && npm run dev## Setup

1. Create a Firebase project and enable Authentication (Email/Password) and Firestore
2. Add environment variables:
   - `expo-app/.env.local`: `EXPO_PUBLIC_FIREBASE_API_KEY`, `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `web/.env.local`: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_BASE_URL`

## Features

- Multi-platform support (mobile & web)
- Modality-aware tracking (strength, cardio, calisthenics)
- Analytics dashboard with PR tracking
- Unit preferences (metric/imperial)
- Progress tracking and streaks

## Deployment

- **Mobile**: Deploy via EAS Build (`cd expo-app && eas build`)
- **Web**: Deploy to Netlify/Cloudflare Pages/Vercel (set root directory to `web`)

## License

Private - All rights reserved
