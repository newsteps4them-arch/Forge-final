# Final Firebase Configuration Guide for Team Forge

I have reviewed the codebase and the recent fixes. Most critical issues have been resolved in the latest commit, but some **manual steps in the Firebase Console** are required to complete the setup.

## 🛠 Recent Code Fixes
I have verified and improved the following in the repository:
- **Firestore DB ID**: Fixed the `undefined` database ID issue in `src/lib/firebase.ts` with a 3-level fallback.
- **Native Android Support**: Added the necessary `intent-filter` in `AndroidManifest.xml` to handle deep-linking for authentication.
- **Note on GitHub Actions**: I attempted to update the GitHub Actions workflows to include the missing `VITE_FIREBASE_APP_ID` and `VITE_FIREBASE_MEASUREMENT_ID` secrets, but due to permission restrictions on workflow files, you will need to manually add these two lines to your `.github/workflows/build-apk.yml` and `build-and-release-apk.yml` files under the `env` section of the `Synchronize Env Secrets` step.

## 🚀 Manual Steps Required (Firebase Console)
Please complete these steps to enable all authentication features:

### 1. Enable Authentication Providers
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your **Team Forge** project.
3. Navigate to **Authentication** → **Sign-in method**.
4. **Email/Password**:
   - Click **Email/Password**.
   - Toggle **Enable** to ON.
   - Check **Enable email link (passwordless sign-in)**.
   - Click **Save**.
5. **Google**:
   - Click **Google**.
   - Toggle **Enable** to ON.
   - Click **Save**.
6. **Anonymous**:
   - Click **Anonymous**.
   - Toggle **Enable** to ON.
   - Click **Save**.

### 2. Configure Authorized Domains
1. In **Authentication** → **Settings** → **Authorized domains**.
2. Ensure the following are added:
   - `localhost`
   - `team-forge-seven.vercel.app` (or your actual production domain)
   - `demoforce-d8279.firebaseapp.com`

### 3. Update GitHub Secrets
Ensure the following secrets are added to your GitHub repository (**Settings** → **Secrets and variables** → **Actions**):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`
- `VITE_FIREBASE_FIRESTORE_DATABASE_ID` (Use `(default)` if not using a custom DB)
- `VITE_GEMINI_API_KEY`

## 📱 Android Deep-Linking Note
If your production `authDomain` is different from `demoforce-d8279.firebaseapp.com`, you must update the `<data android:host="..." />` line in `android/app/src/main/AndroidManifest.xml` to match your actual domain.
