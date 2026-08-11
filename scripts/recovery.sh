#!/bin/bash
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'
log() { echo -e "${CYAN}[RECOVERY]${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; }
soft_recovery() {
    echo ""
    echo -e "${CYAN}LEVEL 1: SOFT RECOVERY${NC}"
    echo ""
    log "Clearing gradle daemon..."
    rm -rf ~/.gradle/daemon
    success "Gradle daemon cleared"
    log "Clearing npm cache..."
    npm cache clean --force 2>/dev/null || true
    success "npm cache cleared"
    log "Clearing lock files..."
    rm -f ~/forge-final/.sync-lock
    success "Lock files cleared"
    echo ""
    success "Level 1 recovery complete"
    echo ""
}
medium_recovery() {
    echo ""
    echo -e "${CYAN}LEVEL 2: MEDIUM RECOVERY${NC}"
    echo ""
    soft_recovery
    log "Removing gradle cache..."
    rm -rf ~/.gradle/caches
    success "Gradle cache removed"
    log "Cleaning git repository..."
    cd ~/forge-final
    git gc --aggressive --prune 2>/dev/null || true
    success "Git repository optimized"
    echo ""
    success "Level 2 recovery complete"
    echo ""
}
hard_recovery() {
    echo ""
    echo -e "${CYAN}LEVEL 3: HARD RECOVERY${NC}"
    echo ""
    medium_recovery
    cd ~/forge-final
    log "Removing node_modules..."
    rm -rf node_modules
    success "node_modules removed"
    log "Removing package-lock.json..."
    rm -f package-lock.json
    success "package-lock.json removed"
    log "Installing fresh npm dependencies..."
    npm install --prefer-offline || {
        error "npm install failed"
        return 1
    }
    success "Fresh dependencies installed"
    echo ""
    success "Level 3 recovery complete"
    echo ""
}
nuclear_recovery() {
    echo ""
    echo -e "${RED}LEVEL 4: NUCLEAR RECOVERY (DESTRUCTIVE)${NC}"
    echo ""
    error "NUCLEAR RECOVERY WILL DELETE ALL LOCAL CHANGES"
    read -p "Continue? Type 'YES': " confirm
    if [ "$confirm" != "YES" ]; then
        log "Nuclear recovery cancelled"
        return 0
    fi
    cd ~/forge-final
    log "Fetching latest from GitHub..."
    git fetch origin
    success "Fetched"
    log "Resetting to origin/main..."
    git reset --hard origin/main
    success "Reset complete"
    log "Cleaning artifacts..."
    rm -rf node_modules package-lock.json ~/.gradle/caches ~/.npm
    success "Artifacts cleaned"
    log "Reinstalling..."
    npm install || error "npm install failed"
    success "Complete"
    echo ""
}
show_menu() {
    echo ""
    echo -e "${CYAN}FORGE-FINAL EMERGENCY RECOVERY${NC}"
    echo ""
    echo "1) SOFT    - Clear caches (safe)"
    echo "2) MEDIUM  - Remove build artifacts"
    echo "3) HARD    - Rebuild npm"
    echo "4) NUCLEAR - Reset to GitHub (⚠ destructive)"
    echo "Q) QUIT"
    echo ""
}
if [ $# -eq 0 ]; then
    show_menu
    read -p "Choose (1-4, Q): " choice
    case "$choice" in
        1) soft_recovery ;;
        2) medium_recovery ;;
        3) hard_recovery ;;
        4) nuclear_recovery ;;
        Q|q) log "Exiting"; exit 0 ;;
        *) error "Invalid option" ;;
    esac
else
    case "$1" in
        --soft) soft_recovery ;;
        --medium) medium_recovery ;;
        --hard) hard_recovery ;;
        --nuclear) nuclear_recovery ;;
        *) echo "Usage: recovery.sh [--soft|--medium|--hard|--nuclear]" ;;
    esac
fi
