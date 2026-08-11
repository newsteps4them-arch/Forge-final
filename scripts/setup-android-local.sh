#!/bin/bash

# setup-android-local.sh
# Automates the initial local setup for Team Forge Android App

echo "🚀 Starting Team Forge Local Setup..."

# 1. Check for Git
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi
echo "✅ Git is installed."

# 2. Check for Node.js
if ! command -v npm &> /dev/null; then
    echo "❌ Node.js and npm are not installed. Please install Node.js."
    exit 1
fi
echo "✅ Node.js is installed."

# 3. Clone Repository
REPO_URL="https://github.com/newsteps4them-arch/team.forge.git"
DIR_NAME="team.forge"

if [ -d "$DIR_NAME" ]; then
    echo "⚠️ Directory $DIR_NAME already exists. Skipping clone."
else
    echo "📥 Cloning repository..."
    git clone "$REPO_URL"
fi

cd "$DIR_NAME" || exit

# 4. Install Dependencies
echo "📦 Installing npm dependencies..."
npm install

# 5. Build and Sync Capacitor
echo "🏗️ Building web assets and syncing with Capacitor Android..."
npm run build
npx cap sync android

echo "✅ Setup Complete!"
echo "Next Steps:"
echo "1. Download and install Android Studio (https://developer.android.com/studio) if you haven't already."
echo "2. Run 'npx cap open android' in the $DIR_NAME directory to open the project in Android Studio."
echo "3. Download google-services.json from your Firebase Console and place it in android/app/"
echo "4. Let Gradle sync complete, select an emulator or device, and click the Play button to run."
