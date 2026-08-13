#!/usr/bin/env bash
# Minimal gradlew replacement for CI: download Gradle distribution and run the wrapper tasks without committing the jar
# This script is added as a safe fallback and is executable.
set -euo pipefail

GRADLE_VERSION="8.7"
GRADLE_BASE_URL="https://services.gradle.org/distributions"
DIST_ZIP="gradle-${GRADLE_VERSION}-all.zip"
DIST_URL="${GRADLE_BASE_URL}/${DIST_ZIP}"

# Ensure we're in android directory
cd "$(dirname "$0")/.." || exit 1
mkdir -p .gradle/wrapper/dists
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

echo "Downloading Gradle ${GRADLE_VERSION}..."
curl -sSLo "$TMPDIR/$DIST_ZIP" "$DIST_URL"

echo "Extracting..."
unzip -q "$TMPDIR/$DIST_ZIP" -d "$TMPDIR"

# Place a minimal gradle wrapper jar extracted from distribution
WRAPPER_DIR="gradle/wrapper"
mkdir -p "$WRAPPER_DIR"
# Extract wrapper jar from distribution
DIST_WRAPPER_JAR="$TMPDIR/gradle-${GRADLE_VERSION}/lib/gradle-wrapper.jar"
if [ -f "$DIST_WRAPPER_JAR" ]; then
  cp "$DIST_WRAPPER_JAR" "$WRAPPER_DIR/gradle-wrapper.jar"
  echo "Gradle wrapper jar placed at $WRAPPER_DIR/gradle-wrapper.jar"
else
  echo "Could not find gradle-wrapper.jar inside distribution" >&2
  exit 1
fi

# Make gradlew execute the wrapper jar
cat > gradlew <<'GRADLEW'
#!/usr/bin/env bash
DIR="$(cd "$(dirname "$0")" && pwd)"
java -jar "$DIR/gradle/wrapper/gradle-wrapper.jar" "$@"
GRADLEW
chmod +x gradlew

echo "Created fallback gradlew script. Run './gradlew assembleDebug' from project root." 
