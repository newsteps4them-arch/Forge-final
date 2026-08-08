# Local Android Development Setup

This guide will help you set up your local development environment for the **Team Forge** Android app built with Capacitor.

## 1. Install Git
*   **Windows**: Download and install from [git-scm.com](https://git-scm.com/download/win).
*   **Mac**: Usually pre-installed. If not, open Terminal and run `xcode-select --install`.
*   **Linux (Ubuntu/Debian)**: Run `sudo apt install git`.

## 2. Clone the Repository
Open your terminal or command prompt and run:
```bash
git clone https://github.com/newsteps4them-arch/team.forge.git
cd team.forge
```

## 3. Install Node.js & Dependencies
*   Download and install Node.js (v18 or higher) from [nodejs.org](https://nodejs.org/).
*   Install the project dependencies:
```bash
npm install
```

## 4. Install Android Studio
*   Download and install Android Studio from [developer.android.com](https://developer.android.com/studio).
*   During the initial setup wizard, ensure the following are checked/installed:
    *   **Android SDK**
    *   **Android SDK Platform**
    *   **Android Virtual Device (AVD)** (for testing on an emulator)

## 5. Sync Capacitor Android Project
Build the web assets and sync them to the Android project folder:
```bash
npm run build
npx cap sync android
```

## 6. Open in Android Studio
Open the Android project directly in Android Studio:
```bash
npx cap open android
```
*(Alternatively, you can open Android Studio, select "Open", and navigate to the `team.forge/android` folder.)*

## 7. Resolve Initial Build Errors (If Any)
Once Android Studio opens, it will begin syncing Gradle. 
*   **Gradle Sync Issues:** If it asks to upgrade Gradle, you can typically accept. Ensure you have a compatible Java Development Kit (JDK) selected in Android Studio (usually JDK 17 is recommended for newer Capacitor versions). Go to `File > Settings > Build, Execution, Deployment > Build Tools > Gradle` and ensure the Gradle JDK is set correctly.
*   **Missing SDK Platforms:** If an error says a specific Android SDK platform is missing (e.g., SDK 34), click the provided link in the build output to install it, or go to `Tools > SDK Manager` and check the required API level.

## 8. Run the App
*   Create a virtual device (emulator) via the **Device Manager** in Android Studio, or connect a physical Android device with USB Debugging enabled.
*   Click the green **Play** button (Run 'app') in the top toolbar to build and install the app on your device.
