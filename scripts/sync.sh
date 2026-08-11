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

check_storage() {
    local available=$(df . | tail -1 | awk '{print $4}')
    local available_mb=$((available / 1024))
    if [ "$available_mb" -lt 200 ]; then
        warning "Low storage: ${available_mb}MB"
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
    if [ "$size_mb" -gt 500 ]; then
        warning "Gradle cache: ${size_mb}MB"
        return 1
    fi
    return 0
}

acquire_lock() {
    if [ -f "$LOCK_FILE" ]; then
        error "Sync in progress"
        return 1
    fi
    touch "$LOCK_FILE"
}

release_lock() {
    rm -f "$LOCK_FILE"
}

health_check() {
    log "Health check..."
    local issues=0
    check_storage || issues=$((issues + 1))
    check_gradle_cache || issues=$((issues + 1))
    if [ "$issues" -gt 0 ]; then
        warning "Found issues, auto-healing..."
        return 1
    fi
    success "Health OK"
    return 0
}

heal_gradle_cache() {
    heal "Cleaning gradle..."
    rm -rf ~/.gradle/caches ~/.gradle/daemon
    success "Gradle cleaned"
}

ensure_git_init() {
    if [ ! -d ".git" ]; then
        warning "Git repository not initialized in this directory."
        return 1
    fi
    return 0
}

link_repository() {
    local url="$1"
    if [ -z "$url" ]; then
        error "Usage: ./scripts/sync.sh --link <repo_url>"
        return 1
    fi

    log "Initializing local Git repository..."
    git init
    git config --global user.name "Forge Guardian"
    git config --global user.email "guardian@forge.local"
    
    # Securely mask credentials in log outputs
    local masked_url=$(echo "$url" | sed -E 's/\/\/([^:]*):?([^@]*)@/\/\/****@/')

    # Check if origin already exists
    if git remote | grep -q "^$REMOTE$"; then
        log "Updating remote origin URL..."
        git remote set-url "$REMOTE" "$url"
    else
        log "Adding remote origin URL..."
        git remote add "$REMOTE" "$url"
    fi
    success "Repository linked with origin remote: $masked_url"
}

check_changes() {
    ensure_git_init || return 1
    log "Checking remote and local changes..."
    
    # Fetch details from upstream origin
    git fetch "$REMOTE" --quiet || { error "Failed to fetch from remote '$REMOTE'. Check your connection or remote URL."; return 1; }
    
    # 1. Local changes check
    local local_changes=$(git status --porcelain)
    if [ -n "$local_changes" ]; then
        warning "Local changes detected (uncommmited):"
        echo "$local_changes"
    else
        success "No local uncommitted changes."
    fi

    # 2. Remote tracking differences
    local local_commit=$(git rev-parse HEAD 2>/dev/null || echo "")
    local remote_commit=$(git rev-parse "$REMOTE/$MAIN_BRANCH" 2>/dev/null || echo "")

    if [ -z "$local_commit" ]; then
        warning "No local commits found (repository is newly initialized)."
        return 0
    fi

    if [ -z "$remote_commit" ]; then
        warning "No remote tracking branch '$REMOTE/$MAIN_BRANCH' found upstream."
        return 0
    fi

    if [ "$local_commit" = "$remote_commit" ]; then
        success "No new changes on GitHub. Workspace is fully synchronized."
        return 0
    fi

    local behind_count=$(git rev-list --count HEAD.."$REMOTE/$MAIN_BRANCH" 2>/dev/null || echo "0")
    local ahead_count=$(git rev-list --count "$REMOTE/$MAIN_BRANCH"..HEAD 2>/dev/null || echo "0")

    if [ "$behind_count" -gt 0 ] && [ "$ahead_count" -gt 0 ]; then
        warning "Branches have diverged! You are behind by $behind_count commit(s) and ahead by $ahead_count commit(s)."
        log "Remote changes list:"
        git log HEAD.."$REMOTE/$MAIN_BRANCH" --oneline
    elif [ "$behind_count" -gt 0 ]; then
        warning "GitHub has new changes! Your local workspace is behind by $behind_count commit(s)."
        log "Remote changes to pull:"
        git log HEAD.."$REMOTE/$MAIN_BRANCH" --oneline
    elif [ "$ahead_count" -gt 0 ]; then
        success "Your local workspace is ahead of GitHub by $ahead_count commit(s) (unsaved pushes)."
    fi

    return 0
}

pull_latest() {
    ensure_git_init || return 1
    log "Pulling from $REMOTE..."
    git fetch $REMOTE || return 1
    # Check if branch exists
    if git rev-parse --verify "origin/$MAIN_BRANCH" >/dev/null 2>&1; then
        git pull --rebase $REMOTE $MAIN_BRANCH || { warning "Pull rebase failed, trying merge..."; git merge $REMOTE/$MAIN_BRANCH --no-edit || true; }
        success "Pull complete"
    else
        warning "Remote branch 'origin/$MAIN_BRANCH' does not exist yet. Please push first."
    fi
    return 0
}

push_to_remote() {
    ensure_git_init || return 1
    log "Pushing to $REMOTE..."
    git push $REMOTE $MAIN_BRANCH || { error "Push failed. Remote may have changes, try pulling first."; return 1; }
    success "Push complete"
    return 0
}

commit_all() {
    ensure_git_init || return 1
    local message="$1"
    if [ -z "$message" ]; then
        message="🔧 [Antigravity] Automations sync: updates and enhancements"
    fi
    log "Committing changes..."
    git add -A
    git commit -m "$message" || log "Nothing to commit on this workspace."
}

full_sync() {
    local commit_msg="$1"
    log "Starting sync lifecycle with GitHub..."
    acquire_lock || return 1
    trap release_lock EXIT
    
    health_check || heal_gradle_cache
    
    if ! ensure_git_init; then
        error "Git is not linked! Run './scripts/sync.sh --link <repo_url>' to initialize and configure origin."
        return 1
    fi

    # 1. Run change check first
    check_changes || return 1

    # 2. Pull remote updates safely
    pull_latest || return 1

    # 3. Commit any local files modified
    commit_all "$commit_msg"

    # 4. Push local changes back up
    push_to_remote || return 1
    
    success "Sync process cycle completed successfully."
}

touch "$LOG_FILE"
case "${1:-sync}" in
    sync|--full)
        full_sync "${2:-}"
        ;;
    --check)
        check_changes
        ;;
    --link)
        link_repository "$2"
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
        heal_gradle_cache
        ;;
    --status)
        ensure_git_init && git status
        ;;
    *)
        error "Unknown command: $1"
        echo "Usage: ./scripts/sync.sh {sync|--check|--link <url>|--pull-only|--push-only|--health|--heal|--status}"
        exit 1
        ;;
esac
