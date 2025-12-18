# LiftLedger

**Train Smarter. Track Better.**

A production-ready, day-based fitness tracking application built as a monorepo. Track workouts across strength training, cardio, and calisthenics with detailed analytics, rest day support, and workout templates.

## 🏗️ Architecture

- **`packages/shared/`** - Platform-agnostic business logic (analytics, Firestore services, preferences)
- **`expo-app/`** - React Native mobile app (iOS/Android) using Expo Router
- **`web/`** - Next.js web app (PWA) using App Router
- **`scripts/`** - Data migration scripts

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run mobile app
cd expo-app && npm start

# Run web app
cd web && npm run dev

# Type check all packages
npm run typecheck

# Lint all packages
npm run lint
```

## ⚙️ Setup

1. **Firebase Configuration**
   - Create a Firebase project and enable Authentication (Email/Password) and Firestore
   - Add environment variables:
     - `expo-app/.env.local`: `EXPO_PUBLIC_FIREBASE_API_KEY`, `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
     - `web/.env.local`: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_BASE_URL`

2. **Firestore Setup**
   - Deploy security rules: `npm run deploy:firestore:rules`
   - Deploy indexes: `npm run deploy:firestore:indexes`
   - See `DEPLOY_FIRESTORE.md` for detailed instructions

3. **Data Migration** (if migrating existing data)
   - See `MIGRATION.md` for instructions
   - Run: `npx tsx scripts/migrations/002-workouts-to-days-admin.ts --dry-run`

## ✨ Key Features

### Day-Based Tracking
- Navigate between days with date picker
- Add multiple exercises per day
- Mark days as rest days
- Load workout templates into any day

### Analytics
- **Streaks:** Health-aligned streaks that include rest days
- **PRs:** Personal records for tracked exercises
- **Volume Analytics:** Strength volume, cardio distance, calisthenics reps
- **Time Periods:** Filter by week/month/year/all
- **Progress Insights:** Automatic AI-powered insights when logging exercises (8+ sessions or new PRs)

### Social Features (v2)
- **Friends System:** Send/accept friend requests by email
- **Leaderboards:** Compete with friends on volume, cardio distance, and consistency
- **Usernames:** Set and display usernames instead of emails
- **Account Settings:** Manage username and profile

### Workout Templates
- Create templates from existing workouts
- Load templates into any day
- Manage templates in settings

### Cross-Platform
- **Web:** Full-featured PWA with offline support
- **Mobile:** Native iOS/Android app via Expo
- **Sync:** Real-time sync across devices

### Production Features
- Loading skeletons
- Error boundaries
- Sync status indicators
- PWA install prompts
- Service worker updates
- Progress insights via LiftLedger Insights Service

## 📊 Data Model

### Primary: Days Collection
- **Format:** `days/{userId}_{YYYY-MM-DD}`
- Each day can have multiple exercises
- Supports rest days for streak tracking
- Date normalization uses local timezone (not UTC)

### Legacy: Workouts Collection
- Still exists for backward compatibility
- Used for some PR calculations
- Will be deprecated in future

## 🗂️ Project Structure

```
liftledger/
├── packages/shared/        # Shared business logic
│   ├── analytics/          # Streak & analytics calculations
│   ├── firestore/         # Days, workouts, exercises, templates
│   └── preferences/       # User preferences service
├── expo-app/              # React Native app
├── web/                    # Next.js web app
│   └── lib/insights/      # LiftLedger Insights integration
│       ├── api.ts         # Insights API client
│       ├── utils.ts       # History extraction & PR detection
│       └── cache.ts       # Caching layer
└── scripts/migrations/     # Data migration scripts
```

## 📖 Documentation

- **`OVERVIEW.md`** - Comprehensive codebase and app overview
- **`MIGRATION.md`** - Data migration instructions
- **`.cursor/plans/`** - Development plan and progress

## 🚢 Deployment

### Web App
- **Platform:** Netlify (configured)
- **Build:** `cd web && npm run build`
- **PWA:** Fully configured with manifest

### Mobile App
- **Platform:** Expo EAS
- **Build:** `cd expo-app && eas build`

### Firebase
- **Rules:** Deploy via `npx firebase deploy --only firestore:rules`
- **Indexes:** Auto-created or via Firebase Console

## 🔒 Security

- Firestore security rules enforce user data isolation
- Day IDs validated via pattern matching
- All exercises cleaned before saving (removes undefined values)
- User authentication required for all data access

## 📝 License

Private - All rights reserved

---

For detailed information, see [OVERVIEW.md](./OVERVIEW.md)
