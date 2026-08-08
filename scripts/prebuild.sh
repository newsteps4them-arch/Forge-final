#!/bin/bash
set -e
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
log() { echo -e "${BLUE}[BUILD]${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
heal() { echo -e "${CYAN}🔧${NC} $1"; }
cd ~/forge-final
check_git_repo() {
    log "Checking git repository..."
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        error "Not a git repository"
        return 1
    fi
    success "Git repository valid"
}
check_package_json() {
    log "Checking package.json..."
    if [ ! -f package.json ]; then
        error "package.json not found"
        return 1
    fi
    if ! node -e "JSON.parse(require('fs').readFileSync('package.json'))" 2>/dev/null; then
        error "package.json is invalid"
        return 1
    fi
    success "package.json valid"
}
check_node_version() {
    log "Checking Node.js version..."
    if ! command -v node &> /dev/null; then
        error "Node.js not installed"
        return 1
    fi
    local node_ver=$(node -v)
    success "Node.js $node_ver installed"
}
check_npm_packages() {
    log "Checking npm packages..."
    if [ ! -d node_modules ]; then
        warn "node_modules missing"
        return 1
    fi
    success "npm packages installed"
}
check_gradle() {
    log "Checking gradle..."
    if [ ! -f android/build.gradle ]; then
        error "gradle files not found"
        return 1
    fi
    if [ ! -f android/gradlew ]; then
        error "gradlew not found"
        return 1
    fi
    success "Gradle files present"
}
check_storage() {
    log "Checking available storage..."
    local available=$(df ~/forge-final | tail -1 | awk '{print $4}')
    local available_mb=$((available / 1024))
    if [ "$available_mb" -lt 500 ]; then
        error "Insufficient storage: ${available_mb}MB (need 500MB)"
        return 1
    fi
    success "Storage OK: ${available_mb}MB available"
}
heal_node_modules() {
    heal "Reinstalling node_modules..."
    rm -rf node_modules package-lock.json
    npm install || {
        error "npm install failed"
        return 1
    }
    success "node_modules reinstalled"
}
heal_gradle_cache() {
    heal "Cleaning gradle cache..."
    rm -rf ~/.gradle/caches ~/.gradle/daemon
    success "Gradle cache cleaned"
}
run_validation() {
    echo ""
    echo -e "${BLUE}=========================================${NC}"
    echo -e "${BLUE}PRE-BUILD VALIDATION${NC}"
    echo -e "${BLUE}=========================================${NC}"
    echo ""
    local failures=0
    check_git_repo || failures=$((failures + 1))
    check_package_json || failures=$((failures + 1))
    check_node_version || failures=$((failures + 1))
    check_gradle || failures=$((failures + 1))
    check_storage || failures=$((failures + 1))
    echo ""
    check_npm_packages || warn "npm packages missing"
    echo ""
    if [ "$failures" -gt 0 ]; then
        echo -e "${RED}=========================================${NC}"
        echo -e "${RED}VALIDATION FAILED ($failures issues)${NC}"
        echo -e "${RED}=========================================${NC}"
        return 1
    fi
    echo -e "${GREEN}=========================================${NC}"
    echo -e "${GREEN}✓ PRE-BUILD VALIDATION PASSED${NC}"
    echo -e "${GREEN}=========================================${NC}"
    return 0
}
auto_heal_issues() {
    echo ""
    echo -e "${CYAN}=========================================${NC}"
    echo -e "${CYAN}AUTO-HEALING BUILD ISSUES${NC}"
    echo -e "${CYAN}=========================================${NC}"
    echo ""
    if [ ! -d node_modules ]; then
        heal_node_modules
    fi
    heal_gradle_cache
    echo ""
    success "Auto-healing complete"
    echo ""
}
case "${1:-validate}" in
    validate)
        if ! run_validation; then
            echo ""
            read -p "Auto-heal issues? (y/n): " confirm
            if [ "$confirm" = "y" ]; then
                auto_heal_issues
                exit 0
            else
                exit 1
            fi
        fi
        ;;
    --heal)
        auto_heal_issues
        ;;
    *)
        echo "Usage: prebuild.sh [validate|--heal]"
        exit 1
        ;;
esac
