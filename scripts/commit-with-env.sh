#!/bin/bash
set -e
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
detect_environment() { if [ -n "$TERMUX_VERSION" ]; then echo "Termux"; else echo "AndroidIDE"; fi; }
REPO_DIR="${1:-.}"
COMMIT_MSG="${2:-}"
cd "$REPO_DIR"
ENV=$(detect_environment)
if [ -z "$COMMIT_MSG" ]; then
  echo -e "${BLUE}[${ENV}] Commit${NC}"
  read -p "Message: " COMMIT_MSG
fi
FINAL_MSG="[${ENV}] ${COMMIT_MSG}"
git add -A
git commit -m "$FINAL_MSG"
echo -e "${GREEN}✓ Committed${NC}"
