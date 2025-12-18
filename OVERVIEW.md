# LiftLedger - Application Overview

## 🎯 Project Status

**Current State:** Production-ready day-based fitness tracking application with social features (v2)

LiftLedger has been successfully migrated from a workout-centric MVP to a production-ready day-based fitness platform with rest day support, improved analytics, friends system, leaderboards, and a complete marketing presence.

---

## 📐 Architecture

### Monorepo Structure

```
liftledger/
├── packages/
│   └── shared/              # Shared business logic (platform-agnostic)
│       ├── analytics/       # Analytics calculations (streaks, PRs, summaries)
│       ├── firestore/      # Firestore services (days, workouts, exercises, templates)
│       ├── insights/        # Progress insights (API client, utilities, cache)
│       ├── preferences/     # User preferences service
│       └── hooks/            # Shared React hooks
├── expo-app/                # React Native (Expo) mobile app
│   ├── app/                # Expo Router pages
│   ├── components/         # React Native components
│   └── lib/                # Platform-specific implementations
├── web/                     # Next.js web application
│   ├── app/                # Next.js App Router pages
│   ├── components/         # Web components
│   └── lib/                # Platform-specific implementations
└── scripts/
    └── migrations/         # Data migration scripts
```

### Key Design Principles

1. **Shared Package is Platform-Agnostic**
   - No direct imports from `expo` or `next` in `packages/shared`
   - Platform-specific implementations injected via interfaces (e.g., `PreferencesStorage`)
   - All business logic lives in `packages/shared`

2. **Day-Based Data Model**
   - Primary data unit: `Day` (not `Workout`)
   - Each day can have multiple exercises
   - Supports rest days for healthier streak tracking

3. **Type Safety**
   - Full TypeScript across all packages
   - Shared types exported from `packages/shared`

---

## 🗄️ Data Models

### Days Collection

**Collection:** `days/{dayId}`  
**Day ID Format:** `${userId}_${YYYY-MM-DD}` (local timezone)

```typescript
interface Day {
  id: string;                    // dayId: ${userId}_${YYYY-MM-DD}
  userId: string;
  date: string;                  // YYYY-MM-DD (local timezone, not UTC)
  isRestDay: boolean;
  exercises: Exercise[];
  notes?: string;                // Optional
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Key Features:**
- Date normalization uses local timezone (via `date-fns`) to avoid off-by-one errors
- One day document per user per date
- Exercises can be added/removed from a day
- Rest days count toward streaks

### Exercises

```typescript
interface Exercise {
  exerciseId?: string;
  name: string;
  modality: "strength" | "cardio" | "calisthenics";
  strengthSets?: StrengthSetEntry[];      // reps, weight
  cardioData?: CardioEntry;              // duration, distance, pace
  calisthenicsSets?: CalisthenicsSetEntry[]; // reps, duration
  notes?: string;
}
```

### Workout Templates

**Collection:** `workoutTemplates/{templateId}`

```typescript
interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: Exercise[];
  ownerId: string;
  createdAt: Timestamp;
}
```

**Usage:**
- Templates can be loaded into any day
- Exercises from templates are appended to existing day exercises
- Templates are user-specific (filtered by `ownerId`)

### Accounts Collection

**Collection:** `accounts/{userId}`

```typescript
interface Account {
  userId: string;
  email: string;              // Normalized to lowercase (for friend requests)
  username?: string;          // User-selected username (3-20 chars, alphanumeric + _-)
  favoriteExercises?: string[];
  trackedExercises?: string[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
```

**Key Features:**
- Username required during signup
- Username used for display in friends lists and leaderboards
- Email stored for friend request lookups

### Friends Collection

**Collection:** `friends/{friendId}`  
**Friend ID Format:** `${userId}_${friendUserId}` (sorted alphabetically)

```typescript
interface Friend {
  id: string;                 // friendId: sorted userIds joined by underscore
  userId: string;             // First user (alphabetically)
  friendUserId: string;       // Second user (alphabetically)
  createdAt: Timestamp;
}
```

**Key Features:**
- Bidirectional relationship (sorted IDs ensure uniqueness)
- Friend relationships created via friend request acceptance
- Used for leaderboard access control

### Friend Requests Collection

**Collection:** `friendRequests/{requestId}`  
**Request ID Format:** `${fromUserId}_${toUserId}`

```typescript
interface FriendRequest {
  id: string;
  fromUserId: string;         // Requester
  toUserId: string;           // Recipient
  status: "pending" | "accepted" | "rejected";
  createdAt: Timestamp;
  respondedAt?: Timestamp;
}
```

**Key Features:**
- Email-based friend discovery
- One pending request per direction
- Automatic friend creation on acceptance

### Legacy: Workouts Collection

**Status:** Still exists for backward compatibility  
**Future:** Will be deprecated once all data is migrated to days

---

## 🎨 User Interface

### Day View (Primary Interface)

**Routes:**
- Web: `/day/[date]` or `/day/today`
- Expo: `/day/[date]` or `/day/today`

**Features:**
- **Day Navigation:** Previous/Next day buttons, date picker, "Today" button
- **Rest Day Toggle:** Compact button in header (icon + text when active)
- **Template Button:** Load workout templates to populate day
- **Add Exercise Section:** Always visible at top (no scrolling needed)
- **Exercise List:** Shows all exercises for the day with edit/delete options
- **Sync Status Indicator:** Shows "Syncing...", "Synced", or "Offline" status
- **Progress Insights:** Automatic toast notifications after logging exercises (when criteria met)

**Layout:**
1. Header: Rest Day toggle + Template button
2. Add Exercise section (top)
3. Exercises list (below)
4. Toast notifications (insights appear automatically)

### Analytics

**Routes:**
- Web: `/analytics`
- Expo: `/(tabs)/analytics`

**Tabs:**
- **Overview:** Total workouts, current/longest streaks, favorite exercise, volume stats
- **Strength:** Volume analytics, muscle group distribution, top exercises
- **Cardio:** Distance, duration, pace analytics
- **PRs:** Personal records for tracked exercises

### Progress Insights

**Integration:** LiftLedger Insights Service

**Features:**
- **Automatic Insights:** Fetched automatically when users log exercises
- **Smart Triggering:** Insights shown when:
  - User has 8+ exercise sessions and 14+ days of history, OR
  - Latest log is a new personal record (always triggers)
- **Toast Notifications:** Insights displayed as non-intrusive toast messages
- **Caching:** 5-minute cache to reduce API calls
- **Error Handling:** Silent failures (non-critical feature)

**Implementation:**
- **Shared Package** (platform-agnostic, reusable):
  - API client: `packages/shared/insights/api.ts`
  - Utilities: `packages/shared/insights/utils.ts` (history extraction, PR detection)
  - Cache: `packages/shared/insights/cache.ts` (in-memory with TTL)
- **Web Integration:** `web/app/(app)/day/[date]/page.tsx` (async, non-blocking, uses toast notifications)
- **Expo Integration:** Ready to integrate (uses `Alert.alert()` for notifications)

### Friends & Leaderboards (v2)

**Routes:**
- Web: `/friends`, `/friends/leaderboards`
- Expo: `/(tabs)/friends`, `/friends/leaderboards`

**Features:**
- **Friend Requests:** Send/accept/reject friend requests by email
- **Friends List:** View all friends with usernames
- **Leaderboards:** Compete with friends on:
  - Total volume (strength)
  - Cardio distance
  - Consistency (active days)
- **Time Filters:** 7 days, 30 days, all time
- **Username Display:** Shows usernames instead of emails/user IDs

### Account Settings

**Routes:**
- Web: `/settings/account`
- Expo: `/settings/account`

**Features:**
- **Username Management:** Set/update username (required at signup)
- **Email Display:** View email (read-only)
- **Profile Picture:** Placeholder for future feature

**Data Source:** Uses `days` collection exclusively (workouts collection is legacy/read-only)

### Settings

**Routes:**
- Web: `/settings`
- Expo: `/(tabs)/settings`

**Features:**
- Unit preferences (metric/imperial)
- Default chart view
- Workout template management (create, edit, delete)
- Tracked exercises for PR filtering

### Marketing Pages

**Routes:**
- `/` - Homepage ("Train Smarter. Track Better.")
- `/privacy` - Privacy Policy
- `/terms` - Terms of Service
- `/contact` - Contact page

---

## 🔥 Firebase Integration

### Firestore Collections

1. **`days`** - Primary data collection
   - Indexed on: `userId` + `date` (ascending and descending)
   - Security: Users can only read/write their own days

2. **`workouts`** - Legacy collection (READ-ONLY)
   - **Status:** Deprecated, marked as read-only
   - **Analytics:** No longer used (all analytics use `days`)
   - **PRs:** No longer used (all PRs calculated from `days`)
   - **Writes:** Deprecated with warnings (legacy routes only)
   - **Reads:** Still available for backward compatibility/rollback

3. **`workoutTemplates`** - User-created workout templates
   - Indexed on: `ownerId` + `createdAt`

4. **`exercises`** - Global exercise database
   - Public read, admin write only

5. **`accounts`** - User account data
   - Stores email, username, favorite exercises, tracked exercises
   - Email stored for friend request lookups

6. **`friends`** - Friend relationships (v2)
   - Indexed on: `userId` + `createdAt`, `friendUserId` + `createdAt`, `userId` + `friendUserId`
   - Bidirectional relationships (sorted IDs for uniqueness)
   - Security: Users can read/create/delete their own friend relationships

7. **`friendRequests`** - Friend request system (v2)
   - Indexed on: `toUserId` + `status`, `fromUserId` + `status`, `fromUserId` + `toUserId` + `status`
   - Security: Users can read requests they sent/received, create as sender, update as recipient

### External Services

1. **LiftLedger Insights Service**
   - **Endpoint:** `https://liftledgerservices-e2bcfshcf6frfycb.centralus-01.azurewebsites.net/api/insights/progress`
   - **Purpose:** Provides AI-powered progress insights for exercises
   - **Integration:** Shared package (`packages/shared/insights/`) - reusable across web and mobile
   - **Web:** Integrated with toast notifications
   - **Mobile:** Ready to integrate (uses `Alert.alert()`)
   - **Triggering:** Automatic when logging exercises (8+ sessions or new PRs)
   - **Caching:** 5-minute in-memory cache
   - **Error Handling:** Silent failures (non-critical feature)

### Security Rules

- **Days:** Users can read/write their own days (validated by `dayId` pattern). Friends can read each other's days for leaderboards.
- **Workouts:** Users can read/write their own workouts
- **Templates:** Users can read/write their own templates
- **Exercises:** Public read, admin write only
- **Accounts:** Authenticated users can read (for email lookups), users can write their own account
- **Friends:** Users can read/create/delete their own friend relationships (bidirectional)
- **Friend Requests:** Users can read requests they sent/received, create as sender, update status as recipient

### Services

All Firestore services are created via factory functions in `packages/shared`:
- `createDayService(db, auth)` - **Primary** (use for all new data)
- `createWorkoutService(db, auth)` - **Legacy** (read-only, deprecated)
- `createWorkoutTemplateService(db, auth)`
- `createExerciseService(db)`
- `createAccountService(db, auth)` - Username management, favorites, tracked exercises
- `createFriendsService(db, auth)` - Friend relationships management (v2)
- `createFriendRequestsService(db, auth)` - Friend request system (v2)
- `fetchDaysForLeaderboard(db, auth)` - Fetch days for current user and friends (v2)

---

## 📊 Analytics & Streaks

### Streak Logic

**New Health-Aligned Streaks:**
- A streak continues if a day has:
  - Exercises logged (`day.exercises.length > 0`), OR
  - Explicitly marked as rest day (`day.isRestDay === true`)
- Streaks no longer break on rest days

**Functions:**
- `calculateCurrentStreakFromDays(days: Day[]): number`
- `calculateLongestStreakFromDays(days: Day[]): number`

### Analytics Functions

All analytics functions accept plain `Day[]` arrays (not Firestore snapshots):
- `getAnalyticsSummaryFromDays(days, exercises?)`
- `calculateTotalVolumeFromDays(days)`
- `calculateTotalCardioDistanceFromDays(days)`
- `findFavoriteExerciseFromDays(days, exercises?)`
- `filterDaysByPeriod(days, period)`

**Benefits:**
- Pure functions (easily testable)
- No Firestore dependencies in analytics logic
- Can work with any data source

---

## 🛠️ Key Features

### ✅ Completed Features

1. **Day-Based Workout Tracking**
   - Navigate between days
   - Add/edit/remove exercises per day
   - Rest day support

2. **Workout Templates**
   - Create templates from existing workouts
   - Load templates into any day
   - Manage templates in settings

3. **Rest Days**
   - Toggle rest day status
   - Rest days count toward streaks
   - Visual indicators

4. **Analytics**
   - Day-based analytics (streaks, volume, PRs)
   - Time period filtering (week/month/year/all)
   - Strength, cardio, and calisthenics breakdowns

5. **Cross-Platform**
   - Web (Next.js)
   - Mobile (Expo/React Native)
   - Shared business logic

6. **Production Polish**
   - Loading skeletons
   - Error boundaries
   - Sync status indicators
   - PWA install prompt
   - Service worker update notifications

7. **Marketing Site**
   - Homepage with value props
   - Privacy policy
   - Terms of service
   - Contact page

8. **Social Features (v2)**
   - Friend request system (email-based)
   - Friends list with username display
   - Friends-only leaderboards (volume, cardio, consistency)
   - Username management (required at signup, editable in account settings)
   - Password reset functionality

9. **Progress Insights**
   - Automatic AI-powered insights via LiftLedger Insights Service
   - Triggered when logging exercises (8+ sessions or new PRs)
   - Toast notifications with personalized progress messages
   - Caching layer for performance
   - Silent error handling (non-critical feature)

### 🔄 Migration Status

- **Days Collection:** ✅ Fully implemented and in use
- **Data Migration:** ✅ Script available (`scripts/migrations/002-workouts-to-days.ts`)
- **UI Migration:** ✅ Complete (day-based views)
- **Analytics Migration:** ✅ Complete (uses days exclusively)
- **PR Analytics:** ✅ Complete (uses days exclusively)
- **Workouts Collection:** ✅ Marked as legacy/read-only (deprecated with warnings)

---

## 📦 Dependencies

### Shared Package
- `date-fns` - Date normalization (local timezone)
- `firebase/firestore` - Firestore types only
- React hooks (platform-agnostic)

### Platform-Specific
- **Web:** Next.js, React, Tailwind CSS
- **Expo:** Expo Router, React Native, NativeWind

### Root
- `firebase-admin` - Admin SDK (for migrations)
- `firebase-tools` - Firebase CLI
- `date-fns` - Date utilities

---

## 🔐 Security

### Firestore Rules

- Users can only access their own data
- Day IDs validated via pattern matching (`${userId}_${date}`)
- Collection queries validated by `userId` field
- Exercises are public read, admin write

### Data Validation

- All exercises cleaned before saving (removes `undefined` values)
- Day `notes` field only included if defined
- Date normalization prevents timezone bugs

---

## 🚀 Deployment

### Web App
- **Framework:** Next.js (App Router)
- **Hosting:** Netlify (configured)
- **PWA:** Fully configured with manifest and service worker

### Mobile App
- **Framework:** Expo
- **Status:** Ready for build/deployment

### Firebase
- **Project:** `lift-ledger-8f627`
- **Rules:** Deployed via Firebase CLI
- **Indexes:** Configured in `firestore.indexes.json`

---

## 📝 Code Quality

### Scripts
- `npm run lint` - Lint all packages
- `npm run typecheck` - Type check all packages
- `npm run build:shared` - Build shared package
- `npm run build:web` - Build web app

### Type Safety
- Full TypeScript across all packages
- Shared types exported from `packages/shared`
- Platform-specific types in platform packages

---

## 🎯 Current Capabilities

### Users Can:
1. ✅ Log workouts by day (not by individual workout)
2. ✅ Mark days as rest days
3. ✅ Load workout templates into any day
4. ✅ View streaks that include rest days
5. ✅ See analytics based on days
6. ✅ Navigate between days easily
7. ✅ Access app on web and mobile
8. ✅ Work offline (with sync indicators)

### Data Flow:
1. User navigates to a day
2. Adds exercises or loads template
3. Exercises saved to `days` collection
4. Analytics calculated from days
5. Streaks updated (includes rest days)

---

## 🔮 Future Considerations

### Potential Enhancements (Not Implemented)
- Calendar view with workout/rest/missed indicators
- Weekly/monthly workout summaries
- Exercise history/PR tracking improvements
- Social features (friends, leaderboards)
- Push notifications
- Coach mode

### Technical Debt
- `workouts` collection still exists (read-only, legacy routes only)
- Legacy workout routes (`/workout/new`, `/workout/[id]`) still write to workouts (deprecated)
- Eventually remove legacy workout routes entirely

---

## 📚 Key Files Reference

### Shared Package
- `packages/shared/firestore/days.ts` - Days service
- `packages/shared/analytics/calculations.ts` - Analytics functions
- `packages/shared/insights/` - Progress insights (API client, utilities, cache)
- `packages/shared/preferences.ts` - Preferences service

### Web App
- `web/app/(app)/day/[date]/page.tsx` - Day view (with insights integration)
- `web/app/(app)/analytics/page.tsx` - Analytics
- `web/components/DayNavigation.tsx` - Day navigation component
- `web/lib/insights/*` - Re-exports from shared package (backward compatibility)

### Expo App
- `expo-app/app/day/[date].tsx` - Day view
- `expo-app/app/(tabs)/analytics.tsx` - Analytics
- `expo-app/components/DayNavigation.tsx` - Day navigation component

### Migration
- `scripts/migrations/002-workouts-to-days.ts` - Migration script
- `MIGRATION.md` - Migration documentation

---

## ✨ Summary

LiftLedger is now a **production-ready, day-based fitness tracking application** with:

- ✅ Clean, organized monorepo architecture
- ✅ Day-centric user experience
- ✅ Rest day support with healthy streaks
- ✅ Template functionality
- ✅ Comprehensive analytics
- ✅ Cross-platform support (web + mobile)
- ✅ Production polish (loading states, error handling, PWA)
- ✅ Marketing presence (homepage, legal pages)
- ✅ Progress insights via LiftLedger Insights Service

The app successfully migrated from a workout-centric model to a day-based model while maintaining backward compatibility and ensuring no data loss. The integration with LiftLedger Insights Service provides users with automatic, AI-powered progress insights when they log exercises, enhancing the user experience with personalized feedback.
