# Codebase Issues Log

This log lists the issues found and fixed in the Team Forge engineering suite workspace.

---

### 1. Dependabot Version Conflict (Vite 8 / esbuild 0.28)
* **Status**: `RESOLVED`
* **Description**: Vite and esbuild were recently downgraded to v6/v0.24 to solve severe compile conflicts. However, Dependabot kept raising PRs requesting updates back to v8/v0.28, which would break the builds.
* **Resolution**: Added a [`.github/dependabot.yml`](file:///c:/Users/michael/Desktop/development/team.forge/team.forge/.github/dependabot.yml) configuration file to instruct Dependabot to ignore updates for `vite`, `@vitejs/plugin-react`, and `esbuild`.

---

### 2. Interactive Shell Hang in Prebuild Validation
* **Status**: `RESOLVED`
* **Description**: The [`scripts/prebuild.sh`](file:///c:/Users/michael/Desktop/development/team.forge/team.forge/scripts/prebuild.sh) script prompted for interactive user confirmation (`read -p`) when validation checks failed. In non-interactive environments (CI/CD workflows, background tasks), this causes the runner to hang indefinitely.
* **Resolution**: Modified the prompt block in [`scripts/prebuild.sh`](file:///c:/Users/michael/Desktop/development/team.forge/team.forge/scripts/prebuild.sh) to check if a terminal is attached (`[ -t 0 ]`). If not, it skips the prompt and exits immediately.

---

### 3. Base64 Data URI Scheme Inconsistency
* **Status**: `RESOLVED`
* **Description**: [`src/services/geminiService.ts`](file:///c:/Users/michael/Desktop/development/team.forge/team.forge/src/services/geminiService.ts) sent image data without the standard `data:` prefix, which caused MIME type regex matching in [`server.ts`](file:///c:/Users/michael/Desktop/development/team.forge/team.forge/server.ts) to return `null` and fallback to a hardcoded `image/jpeg` default. This could lead to image format corruption for non-JPEG uploads.
* **Resolution**: 
  1. Updated [`src/services/geminiService.ts`](file:///c:/Users/michael/Desktop/development/team.forge/team.forge/src/services/geminiService.ts) to prepend the RFC 2397 standard `data:` prefix schema.
  2. Enhanced the regex parsing in [`server.ts`](file:///c:/Users/michael/Desktop/development/team.forge/team.forge/server.ts) to robustly support both standard and custom URI schemas (`(?:^data:)?([^;]+)`).
