#!/bin/bash
set -e
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'
log() { echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"; }
success() { echo -e "${GREEN}✓ $1${NC}"; }
error() { echo -e "${RED}✗ $1${NC}"; }
cd ~/forge-final
case "$1" in
  --full)
    log "Full sync starting..."
    git fetch origin
    git pull origin main || true
    if [ -n "$2" ]; then
      git add -A
      git commit -m "$2" || true
    fi
    git push origin main
    success "Sync complete"
    ;;
  --pull-only)
    log "Pulling..."
    git fetch origin
    git pull origin main
    success "Pull done"
    ;;
  --push-only)
    log "Pushing..."
    git push origin main
    success "Push done"
    ;;
  --status)
    git status
    ;;
  *)
    log "Full sync starting..."
    git fetch origin
    git pull origin main || true
    if [ -n "$1" ]; then
      git add -A
      git commit -m "$1" || true
    fi
    git push origin main
    success "Sync complete"
    ;;
esac
