#!/bin/bash
# Description: Synchronizes GitHub secrets and environment variables into .env.production for the Android/Vite build process.
# This script is executed during the GitHub Actions workflow to ensure build-time features have the correct configuration.

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

ENV_FILE=".env.production"

log() { echo -e "${BLUE}[ENV-SYNC]${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }

log "Starting environment synchronization for Android build..."

# Create or truncate the environment file
echo "# Generated automatically by sync-env.sh on $(date)" > "$ENV_FILE"

# Define important variables to sync
VARS=(
  "VITE_FIREBASE_API_KEY"
  "VITE_FIREBASE_AUTH_DOMAIN"
  "VITE_FIREBASE_PROJECT_ID"
  "VITE_GEMINI_API_KEY"
)

for VAR in "${VARS[@]}"; do
  # Get value from environment
  VAL="${!VAR}"
  
  if [ -n "$VAL" ]; then
    echo "$VAR=\"$VAL\"" >> "$ENV_FILE"
    # Print masked or partial value for security validation
    if [ ${#VAL} -gt 8 ]; then
      MASKED="${VAL:0:4}...${VAL: -4}"
    else
      MASKED="********"
    fi
    success "Synchronized $VAR: $MASKED"
  else
    # Check if there is a fallback name (e.g. GEMINI_API_KEY for VITE_GEMINI_API_KEY)
    if [ "$VAR" = "VITE_GEMINI_API_KEY" ] && [ -n "$GEMINI_API_KEY" ]; then
      VAL="$GEMINI_API_KEY"
      echo "VITE_GEMINI_API_KEY=\"$VAL\"" >> "$ENV_FILE"
      if [ ${#VAL} -gt 8 ]; then
        MASKED="${VAL:0:4}...${VAL: -4}"
      else
        MASKED="********"
      fi
      success "Synchronized VITE_GEMINI_API_KEY from GEMINI_API_KEY: $MASKED"
    else
      warn "$VAR is not set in the environment. Skipping."
    fi
  fi
done

# Also handle optional Firebase extra keys if provided in the process
OPTIONAL_VARS=(
  "VITE_FIREBASE_STORAGE_BUCKET"
  "VITE_FIREBASE_MESSAGING_SENDER_ID"
  "VITE_FIREBASE_FIRESTORE_DATABASE_ID"
  "APP_URL"
)

for VAR in "${OPTIONAL_VARS[@]}"; do
  VAL="${!VAR}"
  if [ -n "$VAL" ]; then
    echo "$VAR=\"$VAL\"" >> "$ENV_FILE"
    success "Synchronized optional $VAR"
  fi
done

log "Checking generated $ENV_FILE contents:"
if [ -f "$ENV_FILE" ]; then
  success "Successfully generated $ENV_FILE with $(wc -l < "$ENV_FILE" | tr -d ' ') lines."
else
  echo -e "${RED}✗ Failed to create $ENV_FILE${NC}"
  exit 1
fi
