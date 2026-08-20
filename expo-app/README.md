# expo-app (archived)

This is the old React Native / Expo client. **It is not the product.** LiftLedger ships as the web PWA in `../web`.

Keep this folder so the native implementation is not lost. Do not add App Store / Play marketing, EAS submit flows, or new features here unless you are explicitly reviving native.

To run it locally (optional):

```bash
cd expo-app
# EXPO_PUBLIC_FIREBASE_API_KEY and EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN in .env.local
npx expo start
```

It still talks to the same Firebase project and `packages/shared` code. Expect it to lag the web app (rest timer, username lookup, CSV export, PWA chrome, and later bugfixes live on web).
