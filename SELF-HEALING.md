# Autonomous Self-Healing & Sync System

## Overview

Team Forge is equipped with an AI-powered autonomous system that ensures all builds, workflows, and code continuously self-heal, self-learn, and self-correct without human intervention. The system uses Google's Gemini AI to diagnose failures, apply fixes, and learn from past issues to prevent future ones.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  GitHub Repository                    │
│                  (team.forge)                         │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ Self-Healing │  │   Guardian   │  │  Gemini   │ │
│  │  APK Build   │  │     v3       │  │   Sync    │ │
│  └──────┬───────┘  └──────┬───────┘  └─────┬─────┘ │
│         │                  │                │        │
│         ▼                  ▼                ▼        │
│  ┌─────────────────────────────────────────────────┐│
│  │            Forge Brain v3 (AI Engine)            ││
│  │  • Diagnose errors via Gemini AI                ││
│  │  • Apply fixes automatically                    ││
│  │  • Learn from past failures                     ││
│  │  • Prevent future issues                        ││
│  └─────────────────────────────────────────────────┘│
│         │                  │                │        │
│         ▼                  ▼                ▼        │
│  ┌─────────────────────────────────────────────────┐│
│  │         Knowledge Base (.gemini-sync/)           ││
│  │  • healing_knowledge.json (past fixes)          ││
│  │  • manifest.json (sync state)                   ││
│  │  • last_analysis.json (AI insights)             ││
│  └─────────────────────────────────────────────────┘│
│                          │                           │
└──────────────────────────┼───────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   Gemini AI Studio     │
              │   (Team Forge App)     │
              │   Continuous Sync      │
              └────────────────────────┘
```

## Workflows

### 1. Self-Healing APK Build (`self-healing-build.yml`)

**Trigger:** Every push to main/develop, PRs, or manual dispatch.

**Self-Healing Process:**
1. **Attempt 1:** Standard build (npm install → vite build → cap sync → gradle assembleRelease)
2. **Attempt 2:** If failed, clears all caches (Gradle, npm), cleans build dirs, retries
3. **Attempt 3:** If still failing, invokes Gemini AI to:
   - Analyze build logs
   - Read project config files
   - Diagnose root cause
   - Apply targeted code fixes
   - Retry the build

**On Success:** Commits any AI-applied fixes automatically.
**On Failure:** Creates a detailed GitHub Issue with AI diagnosis and recovery attempts.

### 2. Forge Guardian v3 (`forge_guardian_v3.yml`)

**Trigger:** Every push, daily schedule (6 AM UTC), or when any build workflow fails.

**Capabilities:**
- Runs `forge_brain_v3.py` which is the full self-healing AI engine
- Scans and fixes deprecated GitHub Actions versions automatically
- Detects project type and adapts healing strategy
- Uses Gemini AI with full project context for intelligent fixes
- Maintains a knowledge base of past fixes for self-learning
- Commits all fixes automatically

### 3. Gemini AI Studio Sync (`gemini-studio-sync.yml`)

**Trigger:** Every push to main/develop or manual dispatch.

**Sync Process:**
- Detects which files changed since last sync
- Sends changed code/config to Gemini AI for analysis
- Maintains a sync manifest tracking all synced files
- Gemini AI provides insights on code quality, build impact, and suggestions
- Results stored in `.gemini-sync/` for reference

## Self-Learning System

The system learns from every failure through the knowledge base:

```json
{
  "fixes": [
    {
      "timestamp": "2026-05-19T...",
      "stage": "gradle_build",
      "diagnosis": "SDK version mismatch",
      "fixes_applied": ["android/variables.gradle"],
      "commands": ["./gradlew clean"],
      "attempt": 1
    }
  ]
}
```

Each time a similar error pattern is encountered, the AI references past successful fixes to improve its diagnosis accuracy and fix speed.

## Required Secrets

Add these to your GitHub repository Settings → Secrets and Variables → Actions:

| Secret | Purpose |
|--------|---------|
| `GEMINI_API_KEY` | Powers all AI analysis and self-healing |
| `VITE_FIREBASE_API_KEY` | Firebase config for web build |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase config |
| `VITE_FIREBASE_PROJECT_ID` | Firebase config |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase config |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase config |
| `VITE_FIREBASE_FIRESTORE_DATABASE_ID` | Firebase config |

## How It Works in Practice

1. **You push code** → All workflows trigger
2. **Build succeeds** → Sync updates Gemini AI Studio with latest code
3. **Build fails** → Self-healing kicks in:
   - Cache clearing (fast fix for transient issues)
   - AI diagnosis (for code/config problems)
   - Automatic fix + commit (no human needed)
4. **All attempts fail** → Issue created with full diagnosis
5. **Guardian runs daily** → Proactively catches issues before they break builds

## AI Studio Integration

Your Team Forge app on Gemini AI Studio stays in sync through:
- Automatic code export on every push
- AI analysis of changes for potential issues
- Shared knowledge base between GitHub and AI Studio
- Bidirectional awareness: AI Studio knows your latest code, GitHub uses AI Studio for healing

**AI Studio App:** https://ai.studio/apps/d176f2ad-cc8f-47d3-8f8a-bc017f7ae1f9
