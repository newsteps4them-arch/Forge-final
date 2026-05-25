#!/bin/bash
set -e
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
REPO_DIR="."
MAIN_BRANCH="main"
REMOTE="origin"
LOG_FILE=".sync-log"
LOCK_FILE=".sync-lock"
log() { echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"; echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"; }
success() { echo -e "${GREEN}✓ $1${NC}"; echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $1" >> "$LOG_FILE"; }
error() { echo -e "${RED}✗ $1${NC}"; echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >> "$LOG_FILE"; }
warning() { echo -e "${YELLOW}⚠ $1${NC}"; echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1" >> "$LOG_FILE"; }
heal() { echo -e "${CYAN}🔧 HEALING: $1${NC}"; echo "[$(date '+%Y-%m-%d %H:%M:%S')] HEAL: $1" >> "$LOG_FILE"; }
check_storage() { local available=$(df . | tail -1 | awk '{print $4}'); local available_mb=$((available / 1024)); if [ "$available_mb" -lt 200 ]; then warning "Low storage: ${available_mb}MB"; return 1; fi; return 0; }
check_gradle_cache() { if [ ! -d ~/.gradle/caches ]; then return 0; fi; local size=$(du -s ~/.gradle/caches 2>/dev/null | awk '{print $1}'); local size_mb=$((size / 1024)); if [ "$size_mb" -gt 500 ]; then warning "Gradle cache: ${size_mb}MB"; return 1; fi; return 0; }
acquire_lock() { if [ -f "$LOCK_FILE" ]; then error "Sync in progress"; return 1; fi; touch "$LOCK_FILE"; }
release_lock() { rm -f "$LOCK_FILE"; }
health_check() { log "Health check..."; local issues=0; check_storage || issues=$((issues + 1)); check_gradle_cache || issues=$((issues + 1)); if [ "$issues" -gt 0 ]; then warning "Found issues, auto-healing..."; return 1; fi; success "Health OK"; return 0; }
heal_gradle_cache() { heal "Cleaning gradle..."; rm -rf ~/.gradle/caches ~/.gradle/daemon; success "Gradle cleaned"; }
pull_latest() { log "Pulling from $REMOTE..."; git fetch $REMOTE || return 1; git pull $REMOTE $MAIN_BRANCH || true; success "Pull complete"; return 0; }
push_to_remote() { log "Pushing to $REMOTE..."; git push $REMOTE $MAIN_BRANCH || { error "Push failed"; return 1; }; success "Push complete"; return 0; }
commit_all() { local message="$1"; log "Committing: $message"; git add -A; git commit -m "$message" || log "Nothing to commit"; }
full_sync() { local commit_msg="$1"; log "Starting sync..."; acquire_lock || return 1; trap release_lock EXIT; health_check || heal_gradle_cache; pull_latest || return 1; [ -n "$commit_msg" ] && commit_all "$commit_msg"; push_to_remote || return 1; success "Sync complete"; }
touch "$LOG_FILE"
case "${1:-sync}" in
    sync|--full) full_sync "${2:-}" ;;
    --pull-only) cd . && git fetch origin && git pull origin main ;;
    --push-only) git push origin main ;;
    --health) health_check ;;
    --heal) heal_gradle_cache ;;
    --status) git status ;;
    *) error "Unknown: $1"; exit 1 ;;
esac
