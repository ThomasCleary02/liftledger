# Deploying Firestore Rules and Indexes

## Prerequisites

1. Install Firebase CLI (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Verify you're using the correct project:
   ```bash
   firebase use lift-ledger-8f627
   ```

## Deploy Firestore Rules

Deploy only the security rules:
```bash
firebase deploy --only firestore:rules --project lift-ledger-8f627
```

Or from the root directory (firebase.json is configured):
```bash
firebase deploy --only firestore:rules
```

## Deploy Firestore Indexes

Deploy only the indexes:
```bash
firebase deploy --only firestore:indexes --project lift-ledger-8f627
```

Or from the root directory:
```bash
firebase deploy --only firestore:indexes
```

## Deploy Both Rules and Indexes

Deploy both at once:
```bash
firebase deploy --only firestore --project lift-ledger-8f627
```

Or from the root directory:
```bash
firebase deploy --only firestore
```

## Verify Deployment

1. **Check Rules in Firebase Console:**
   - Go to https://console.firebase.google.com/project/lift-ledger-8f627/firestore/rules
   - Verify the rules match your local `firestore.rules` file

2. **Check Indexes in Firebase Console:**
   - Go to https://console.firebase.google.com/project/lift-ledger-8f627/firestore/indexes
   - Verify all indexes are created and not in "Building" state
   - Note: Indexes may take a few minutes to build, especially for large collections

3. **Test Rules:**
   - Use the Firestore Rules Playground in the Firebase Console
   - Test read/write operations for friends collection
   - Verify users can only access their own friend relationships

## Important Notes

- **Indexes**: After deploying indexes, they may take time to build. You'll see a "Building" status in the console. Wait for them to complete before testing queries that depend on them.

- **Single-Field Indexes**: Firestore automatically creates single-field indexes, so you don't need to define them in `firestore.indexes.json`. Only composite indexes (multiple fields) need to be explicitly defined.

- **Rules**: Rules are deployed immediately and take effect right away.

- **Project ID**: The project ID is `lift-ledger-8f627` (hardcoded in firebase.json and various config files).

- **Email Lookup**: The friends feature requires that user emails are stored in the `accounts` collection. Ensure your signup/login process saves the email to the accounts document.

## Troubleshooting

### Index Build Errors
If indexes fail to build:
1. Check the Firebase Console for error messages
2. Verify the index definition in `firestore.indexes.json` is correct
3. Ensure the collection and fields exist in your Firestore database

### Rules Deployment Errors
If rules fail to deploy:
1. Check syntax errors in `firestore.rules`
2. Use `firebase deploy --only firestore:rules --debug` for detailed error messages
3. Verify you have the correct permissions for the Firebase project

### Testing Locally
You can test rules locally using the Firebase Emulator Suite:
```bash
firebase emulators:start --only firestore
```
