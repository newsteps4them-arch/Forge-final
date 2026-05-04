#!/bin/bash
set -e
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
REPO_DIR="${1:-.}"
MAIN_BRANCH="main"
REMOTE="origin"
LOG_FILE="${REPO_DIR}/.sync-log"
LOCK_FILE="${REPO_DIR}/.sync-lock"
GRADLE_CACHE_SIZE_THRESHOLD=500
NODE_MODULES_SIZE_THRESHOLD=300
STORAGE_WARN_THRESHOLD=200
log() { 
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}
success() { 
    echo -e "${GREEN}✓ $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $1" >> "$LOG_FILE"
}
error() { 
    echo -e "${RED}✗ $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >> "$LOG_FILE"
}
warning() { 
    echo -e "${YELLOW}⚠ $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1" >> "$LOG_FILE"
}
heal() {
    echo -e "${CYAN}🔧 HEALING: $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] HEAL: $1" >> "$LOG_FILE"
}
check_storage() {
    local available=$(df ~/forge-final | tail -1 | awk '{print $4}')
    local available_mb=$((available / 1024))
    if [ "$available_mb" -lt "$STORAGE_WARN_THRESHOLD" ]; then
        warning "Low storage: ${available_mb}MB available"
        return 1
    fi
    return 0
}
check_gradle_cache() {
    if [ ! -d ~/.gradle/caches ]; then
        return 0
    fi
    local size=$(du -s ~/.gradle/caches 2>/dev/null | awk '{print $1}')
    local size_mb=$((size / 1024))
    if [ "$size_mb" -gt "$GRADLE_CACHE_SIZE_THRESHOLD" ]; then
        warning "Gradle cache large: ${size_mb}MB"
        return 1
    fi
    return 0
}
check_node_modules() {
    if [ ! -d ~/forge-final/node_modules ]; then
        return 0
    fi
    local size=$(du -s ~/forge-final/node_modules 2>/dev/null | awk '{print $1}')
    local size_mb=$((size / 1024))
    if [ "$size_mb" -gt "$NODE_MODULES_SIZE_THRESHOLD" ]; then
        warning "node_modules large: ${size_mb}MB"
        return 1
    fi
    return 0
}
check_git_integrity() {
    cd "$REPO_DIR"
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        error "Not a git repository"
        return 1
    fi
    if ! git fsck --quick > /dev/null 2>&1; then
        warning "Git repository has issues"
        return 1
    fi
    return 0
}
check_lock_file() {
    if [ -f "$LOCK_FILE" ]; then
        local age=$(($(date +%s) - $(stat -c %Y "$LOCK_FILE" 2>/dev/null || echo 0)))
        if [ "$age" -gt 1800 ]; then
            warning "Stale lock file detected (age: ${age}s)"
            rm -f "$LOCK_FILE"
            return 1
        fi
        error "Sync already in progress"
        return 1
    fi
    return 0
}
heal_gradle_cache() {
    heal "Cleaning gradle cache..."
    if [ -d ~/.gradle/caches ]; then
        rm -rf ~/.gradle/caches
        success "Gradle cache cleaned"
    fi
    if [ -d ~/.gradle/daemon ]; then
        rm -rf ~/.gradle/daemon
        success "Gradle daemon cleaned"
    fi
}
heal_node_modules() {
    heal "Cleaning node_modules..."
    cd ~/forge-final
    if [ -d node_modules ]; then
        rm -rf node_modules
        success "node_modules removed"
    fi
    if [ -f package-lock.json ]; then
        rm -f package-lock.json
        success "package-lock.json removed"
    fi
    log "Installing fresh dependencies..."
    npm install || {
        error "npm install failed"
        return 1
    }
    success "Fresh npm dependencies installed"
}
heal_storage() {
    heal "Freeing storage space..."
    local freed=0
    if [ -d ~/.gradle/caches ]; then
        freed=$((freed + $(du -s ~/.gradle/caches 2>/dev/null | awk '{print $1}')))
        rm -rf ~/.gradle/caches
        success "Gradle cache removed"
    fi
    if [ -d ~/.npm ]; then
        freed=$((freed + $(du -s ~/.npm 2>/dev/null | awk '{print $1}')))
        rm -rf ~/.npm
        success "npm cache removed"
    fi
    if [ -d ~/forge-final/android/app/build ]; then
        freed=$((freed + $(du -s ~/forge-final/android/app/build 2>/dev/null | awk '{print $1}')))
        rm -rf ~/forge-final/android/app/build
        success "Android build artifacts removed"
    fi
    local freed_mb=$((freed / 1024))
    success "Freed ${freed_mb}MB of storage"
}
heal_git_corruption() {
    heal "Attempting git repair..."
    cd "$REPO_DIR"
    git fsck --full --repair 2>/dev/null || true
    git gc --aggressive --prune 2>/dev/null || true
    success "Git repository repaired"
}
acquire_lock() {
    if ! check_lock_file; then
        return 1
    fi
    touch "$LOCK_FILE"
}
release_lock() {
    rm -f "$LOCK_FILE"
}
health_check() {
    log "========================================="
    log "RUNNING HEALTH CHECK"
    log "========================================="
    local health_issues=0
    if ! check_storage; then
        health_issues=$((health_issues + 1))
    fi
    if ! check_gradle_cache; then
        health_issues=$((health_issues + 1))
    fi
    if ! check_node_modules; then
        health_issues=$((health_issues + 1))
    fi
    if ! check_git_integrity; then
        health_issues=$((health_issues + 1))
    fi
    if [ "$health_issues" -gt 0 ]; then
        warning "Found $health_issues health issues. Auto-healing..."
        return 1
    fi
    success "Repository health check passed"
    return 0
}
auto_heal() {
    log "========================================="
    log "AUTO-HEALING REPOSITORY"
    log "========================================="
    if ! check_storage; then
        heal_storage
    fi
    if ! check_gradle_cache; then
        heal_gradle_cache
    fi
    if ! check_node_modules; then
        heal_node_modules || warning "Node modules healing failed"
    fi
    if ! check_git_integrity; then
        heal_git_corruption
    fi
    success "Auto-healing complete"
}
pull_latest() {
    log "Pulling latest from $REMOTE/$MAIN_BRANCH..."
    cd "$REPO_DIR"
    git fetch $REMOTE || {
        error "Fetch failed"
        return 1
    }
    local local_count=$(git rev-list --count HEAD..${REMOTE}/${MAIN_BRANCH} 2>/dev/null || echo 0)
    if [ "$local_count" -gt 0 ]; then
        log "Pulling $local_count new commits..."
        if ! git pull $REMOTE $MAIN_BRANCH; then
            warning "Pull failed, attempting rebase..."
            git rebase $REMOTE/$MAIN_BRANCH || {
                error "Rebase failed"
                git rebase --abort 2>/dev/null || true
                return 1
            }
        fi
    else
        success "Already up to date"
    fi
    return 0
}
push_to_remote() {
    log "Pushing to $REMOTE/$MAIN_BRANCH..."
    cd "$REPO_DIR"
    local commits_to_push=$(git rev-list --count $REMOTE/$MAIN_BRANCH..HEAD 2>/dev/null || echo 0)
    if [ "$commits_to_push" -eq 0 ]; then
        success "No commits to push"
        return 0
    fi
    if ! git push $REMOTE $MAIN_BRANCH; then
        error "Push failed"
        return 1
    fi
    success "Pushed to remote"
    return 0
}
commit_all() {
    local message="$1"
    cd "$REPO_DIR"
    git add -A
    if git commit -m "$message"; then
        success "Committed: $message"
        return 0
    else
        log "Nothing new to commit"
        return 0
    fi
}
full_sync() {
    local commit_msg="$1"
    log "========================================="
    log "STARTING FULL SYNC (SELF-HEALING)"
    log "========================================="
    if ! acquire_lock; then
        error "Could not acquire lock"
        return 1
    fi
    trap release_lock EXIT
    if ! health_check; then
        auto_heal
    fi
    if ! pull_latest; then
        error "Pull failed"
        return 1
    fi
    if [ -n "$commit_msg" ]; then
        commit_all "$commit_msg"
    fi
    if ! push_to_remote; then
        error "Push failed"
        return 1
    fi
    log "========================================="
    success "FULL SYNC COMPLETE"
    log "========================================="
    return 0
}
mkdir -p "$REPO_DIR"
touch "$LOG_FILE"
case "${1:-sync}" in
    sync|--full)
        full_sync "${2:-}"
        ;;
    --pull-only)
        pull_latest
        ;;
    --push-only)
        push_to_remote
        ;;
    --health)
        health_check
        ;;
    --heal)
        auto_heal
        ;;
    --status)
        cd "$REPO_DIR" && git status
        ;;
    --help|-h)
        echo "Forge-Final Self-Healing Sync"
        echo "Usage: sync.sh [sync|--pull-only|--push-only|--health|--heal|--status|--help]"
        ;;
    *)
        error "Unknown option: $1"
        exit 1
        ;;
esac
exit $?
