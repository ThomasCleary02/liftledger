# LiftLedger

A comprehensive fitness tracking app built with React Native and Expo. Track your workouts across strength training, cardio, and calisthenics with detailed analytics and progress monitoring.

## Features

- **Modality-Aware Tracking**: Track strength (weight/reps), cardio (distance/duration), and calisthenics exercises
- **Workout Management**: Create, edit, and delete workouts with detailed exercise logging
- **Analytics Dashboard**: Comprehensive analytics with volume trends, PR tracking, and muscle group distribution
- **Personal Records**: Automatic PR detection across all exercise types
- **Unit Preferences**: Switch between metric and imperial units
- **Progress Tracking**: Streak tracking, favorite exercises, and volume trends

## Tech Stack

- **Framework**: React Native with Expo (~54.0.20)
- **Navigation**: Expo Router
- **Styling**: NativeWind (Tailwind CSS)
- **Backend**: Firebase (Firestore, Authentication)
- **State Management**: React Context API
- **Storage**: AsyncStorage for preferences

## Prerequisites

- Node.js 18+ and npm/yarn
- Expo CLI (`npm install -g eas-cli`)
- Expo account (for EAS builds)
- Firebase project setup

## Installation

1. Clone the repository:
git clone <repository-url>
cd liftledger2. Install dependencies:h
npm install3. Set up Firebase:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Copy your Firebase config to `lib/firebase.ts`
   - Enable Authentication (Email/Password)
   - Set up Firestore database

4. Configure environment variables (optional):h
# Create .env file
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain## Development

### Start development server:
npm start### Run on iOS simulator:
npm run ios
### Run on Android emulator:
npm run android## Building for Production

### Using EAS Build:

1. **Login to EAS:**
eas login2. **Build for preview (internal testing):**sh
eas build --platform ios --profile preview
eas build --platform android --profile preview3. **Build for production:**
eas build --platform ios --profile production
eas build --platform android --profile production### Install on device:

After build completes, you'll receive a download link. For iOS, install via TestFlight or direct download. For Android, download and install the APK.

## Project Structure

```
liftledger/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main app tabs (Workouts, Analytics, Settings)
│   └── workout/           # Workout creation/editing
├── components/            # Reusable components
│   ├── analytics/         # Analytics view components
│   └── settings/          # Settings modals
├── lib/                   # Core libraries
│   ├── analytics/         # Analytics calculations
│   ├── firestore/         # Firestore operations
│   ├── hooks/             # Custom React hooks
│   └── utils/             # Utility functions
├── assets/                # Images, fonts, etc.
└── providers/             # Context providers
```

## Key Features Implementation

### Modality-Aware Exercise Tracking
- Strength: Weight × Reps sets
- Cardio: Duration and distance
- Calisthenics: Reps with optional duration (for holds)

### Analytics
- Volume trends over time
- Personal records tracking
- Muscle group distribution
- Exercise frequency analysis
- Streak calculations

### Preferences
- Unit system (Metric/Imperial)
- Default chart view
- PR notifications (future)

## Environment Variables

For production builds, set these in EAS secrets:
```bash
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value "your-key"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "your-domain"
```

Or add fallbacks in `lib/firebase.ts` for development builds.

## Firebase Setup

1. Create a Firebase project
2. Enable Authentication → Email/Password
3. Create Firestore database
4. Set up security rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /workouts/{workoutId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.ownerId;
    }
    match /exercises/{exerciseId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Building for Testing

### Quick Test Build (Preview):
```bash
npm run build:preview
```

### Production Build:
```bash
npm run build:ios
npm run build:android
```

### Submit to App Stores:
```bash
npm run submit:ios
npm run submit:android
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Private - All rights reserved

## Support

For support, email support@liftledger.com or open an issue in the repository.

## Version History

- **1.0.0** (Current)
  - Initial release
  - Modality-aware workout tracking
  - Comprehensive analytics
  - Unit preferences
  - PR tracking
```
