# UX Audit - September 2026

Comprehensive audit of all surfaces for polish and ease of use improvements.

## Critical Issues (Fix in 3.3.3)

1. ✅ **Tab icon fill** - Active tabs unrecognizable (already in 3.3.3)
2. ✅ **Hold timer stop button** - Too small for mid-set tapping (already in 3.3.3)
3. ✅ **Calisthenics visibility** - No reps shown on Overview (already in 3.3.3)

## High Priority (Next Release After 3.3.3)

### Authentication & Account Management
1. **Password reset email** - Currently exists on login page, but needs better visibility
2. **Email change** - Not currently possible, users stuck with signup email
3. **Additional sign-in methods** - Only email/password exists. Add:
   - Google OAuth
   - Apple Sign In (required for iOS app store eventually)
   - GitHub OAuth (fits developer audience)
4. **Account settings page hierarchy** - Settings → Account should be more prominent, currently buried

### Navigation & Information Architecture
1. **Settings structure** - Flat list of 15+ items is overwhelming. Needs grouping:
   - **Account**: Sign-in email, change password, delete account
   - **Preferences**: Units, theme, rest timer, bodyweight tracking, PR notifications
   - **Training**: Favorites, My exercises, Templates, Supersets
   - **Data**: Import, Export
   - **Help**: Tips, Contact
   
2. **First-time user onboarding** - No discovery mechanism for:
   - Rest days (3-dot menu)
   - Hold timer (calisthenics)
   - Supersets (Training extras setting)
   - Templates
   - Import feature
   
3. **Empty states** - Several pages lack helpful empty states:
   - Analytics when no workouts logged
   - Profile friends when no friends added
   - Templates list when empty

## Medium Priority

### Day Log Surface
1. **Exercise search** - Works well but could add:
   - Recently used section at top (before search)
   - Muscle group filters
   - Modality filters (Strength/Cardio/Calisthenics tabs)
   
2. **Bodyweight tracking** - Currently in Settings toggle + day card. Could be more discoverable:
   - Add bodyweight directly from day log without navigating
   - Show bodyweight trend on day page if tracking enabled
   
3. **Progress hints after save** - Good feature, but could be enhanced:
   - Celebrate streaks (not just PRs)
   - Note muscle group balance ("First leg day this week!")
   - Volume milestones

### Analytics Surface
1. **Tab switching** - 4 tabs (Overview/Strength/Cardio/PRs) at top, but:
   - Tab labels could be icons for mobile space
   - Active tab styling could be clearer
   - Consider sticky tabs when scrolling
   
2. **Period chips** - 7d/30d/1y/All work well but:
   - Could add custom date range picker
   - Show date range below period (e.g., "Jan 1 - Dec 31, 2025")
   
3. **Charts** - Volume chart is good, but:
   - Consider adding muscle group breakdown chart
   - Cardio distance/duration over time
   - Bodyweight trend line if tracking enabled

### Profile Surface
1. **Profile editing** - Good Instagram-like layout, but:
   - Avatar upload could show preview before saving
   - Username change not supported (intentional?)
   - Bio field could be added for personality
   
2. **Achievements display** - Medal grid is nice, but:
   - Could group by tier (Bronze section, Silver section, Gold section)
   - Progress bars for un-earned medals (if user opts in)
   - Medal detail modal when tapped (date earned, rarity %, description)
   
3. **Friends list** - Clean layout, but:
   - Search/filter friends
   - Friend request status indicators
   - Suggested friends (mutual connections?)

### Settings Surface
1. **Visual hierarchy** - All items look equal weight:
   - Primary actions (Account, Import/Export) should stand out
   - Dangerous actions (Delete account) should be red/separated
   - Group related items visually
   
2. **Inline previews** - Some settings show current value, others don't:
   - Units: shows "Imperial" ✓
   - Theme: shows "Auto" ✓
   - Rest timer: shows duration ✓
   - But others don't show current state
   
3. **Tips sheet** - Good content, but:
   - Could be searchable
   - Could have categories
   - Could link to relevant settings

## Low Priority / Nice to Have

### Marketing Pages
1. **Landing page** - Beautiful, ledger-like design. Minor improvements:
   - Add social proof (testimonials, user count)
   - Show actual app screenshot carousel
   - Add FAQ section for common questions
   
2. **Login/Signup** - Clean form, but:
   - Could add "Continue with Google/Apple" above email form
   - Password strength indicator for signup
   - "Remember me" checkbox for login
   
3. **Contact page** - Email form, but:
   - Could add response time expectation
   - Link to FAQ/documentation
   - Show status (if support is backlogged)

### Accessibility
1. **Keyboard navigation** - Generally good, but audit:
   - Modal focus trapping
   - Tab order in complex forms (day log with multiple exercises)
   - Skip links on all pages
   
2. **Screen reader** - Test with VoiceOver/JAWS:
   - Chart descriptions
   - Medal unlocks
   - Day navigation
   
3. **Touch targets** - Most buttons are good size, but:
   - Some icon-only buttons could be larger
   - Dense lists (exercises, friends) need more padding

## Inspiration From Similar Apps

### Instagram Profile Model (Already Using)
- ✓ Avatar at top
- ✓ Stats row (workouts/streak/volume like posts/followers/following)
- ✓ Bio area (username)
- ✓ Grid layout (medals)
- Could add: Stories-like highlights for achievements

### Strong/Hevy/FitNotes (Gym Apps)
- Exercise history graphs per movement
- Plate calculator
- Rest timer with audio cues
- Workout duration tracker
- Volume PR tracking

### MyFitnessPal/Cronometer (Tracking Apps)
- Daily streak calendar heat map
- Quick-add from recent items
- Meal/workout duplication
- Notes with hashtags

### Strava (Social Fitness)
- Activity feed for friends
- Kudos/reactions
- Segments/challenges
- Year in review
- Route maps

## Recommended Hierarchy Changes

### Current Tab Structure
```
Log | Analytics | Profile | Settings
```

**Recommendation: Keep it.** The 4-tab structure works well. It's simple and matches user mental models:
- **Log** = Do work (primary action)
- **Analytics** = Review progress
- **Profile** = Identity + social
- **Settings** = Configure

Alternative considered but rejected:
- Moving Friends to a 5th tab → too many tabs
- Combining Profile + Settings → loses Instagram-like profile feel
- Floating FAB for Log → breaks tab bar pattern

### Settings Redesign Mockup
```
Settings
├─ Account
│  ├─ Sign-in email: user@example.com
│  ├─ Change password
│  ├─ Connected accounts (Google, Apple)
│  └─ Delete account
├─ Preferences
│  ├─ Units: Imperial
│  ├─ Theme: Auto
│  └─ Chart view: Volume
├─ Training
│  ├─ Favorites (5)
│  ├─ My exercises (12)
│  ├─ Templates (3)
│  └─ Training extras
│      ├─ Rest timer: 90 seconds
│      ├─ Supersets: On
│      ├─ Bodyweight tracking: On
│      └─ PR notifications: On
├─ Data
│  ├─ Import workout history
│  └─ Export to CSV
└─ Help & Support
   ├─ Tips & tricks
   ├─ Contact us
   └─ About LiftLedger
```

## Next Steps

1. Implement 3.3.3 items (tab icons, stop button, calisthenics reps, catalog, onboarding)
2. Next release focus on **Account & Auth** (password reset, email change, OAuth)
3. After that: **Settings Redesign** with grouped sections
4. Then: **Analytics Polish** (charts, trends, insights)
5. Later: **Social Features** (activity feed, reactions, challenges)
