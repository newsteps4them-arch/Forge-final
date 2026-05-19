#!/usr/bin/env python3
"""
Forge Brain v3 - Self-Healing, Self-Learning, Self-Correcting AI Engine
========================================================================
Uses Gemini AI to autonomously diagnose, fix, and prevent build failures.
Learns from past failures to improve future healing attempts.
"""

import os
import sys
import json
import re
import subprocess
from pathlib import Path
from datetime import datetime, timezone

# Configuration
MAX_HEAL_LOOPS = 3
LOG_FILE = "FORGE_HEALING_LOG.md"
KNOWLEDGE_FILE = ".gemini-sync/healing_knowledge.json"
MODEL_ID = "gemini-2.5-flash"


def setup_gemini():
    """Initialize Gemini client"""
    try:
        from google import genai
        from google.genai import types
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            print("❌ GEMINI_API_KEY not set")
            sys.exit(1)
        client = genai.Client(api_key=api_key)
        return client, types
    except ImportError:
        print("Installing google-genai...")
        subprocess.run([sys.executable, "-m", "pip", "install", "google-genai", "--quiet"])
        from google import genai
        from google.genai import types
        api_key = os.environ.get("GEMINI_API_KEY")
        client = genai.Client(api_key=api_key)
        return client, types


def detect_project_type():
    """Detect project type and build system"""
    info = {
        "type": "unknown",
        "has_android": Path("android").exists(),
        "has_capacitor": Path("capacitor.config.ts").exists(),
        "has_package_json": Path("package.json").exists(),
        "has_gradle": Path("android/gradlew").exists(),
        "frameworks": []
    }

    if info["has_package_json"]:
        pkg = json.loads(Path("package.json").read_text())
        deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
        if "react" in deps:
            info["frameworks"].append("react")
        if "vite" in deps:
            info["frameworks"].append("vite")
        if "@capacitor/core" in deps:
            info["frameworks"].append("capacitor")
            info["type"] = "capacitor-android"
        if "firebase" in str(deps) or "@firebase" in str(deps):
            info["frameworks"].append("firebase")

    if info["has_android"]:
        info["type"] = "capacitor-android"

    return info


def load_knowledge():
    """Load past healing knowledge for self-learning"""
    kb_path = Path(KNOWLEDGE_FILE)
    if kb_path.exists():
        return json.loads(kb_path.read_text())
    return {"fixes": [], "patterns": [], "success_rate": 0}


def save_knowledge(knowledge):
    """Save healing knowledge for future reference"""
    kb_path = Path(KNOWLEDGE_FILE)
    kb_path.parent.mkdir(parents=True, exist_ok=True)
    kb_path.write_text(json.dumps(knowledge, indent=2))


def run_build():
    """Attempt to build the project and capture errors"""
    project = detect_project_type()
    errors = []

    # Step 1: npm install
    print("  📦 Running npm install...")
    result = subprocess.run(
        ["npm", "install"],
        capture_output=True, text=True, timeout=120
    )
    if result.returncode != 0:
        errors.append({"stage": "npm_install", "error": result.stderr[-2000:]})
        return errors

    # Step 2: Build web app
    print("  🏗️  Building web app...")
    result = subprocess.run(
        ["npm", "run", "build"],
        capture_output=True, text=True, timeout=120,
        env={**os.environ}
    )
    if result.returncode != 0:
        errors.append({"stage": "web_build", "error": result.stderr[-2000:]})
        return errors

    # Step 3: Capacitor sync (if applicable)
    if project["has_capacitor"]:
        print("  📱 Syncing Capacitor...")
        result = subprocess.run(
            ["npx", "cap", "sync", "android"],
            capture_output=True, text=True, timeout=120
        )
        if result.returncode != 0:
            errors.append({"stage": "cap_sync", "error": result.stderr[-2000:]})
            return errors

    # Step 4: Gradle build (if applicable)
    if project["has_gradle"]:
        print("  🤖 Building APK...")
        gradlew = Path("android/gradlew")
        gradlew.chmod(0o755)
        result = subprocess.run(
            ["./gradlew", "assembleRelease"],
            capture_output=True, text=True, timeout=300,
            cwd="android"
        )
        if result.returncode != 0:
            errors.append({"stage": "gradle_build", "error": result.stderr[-3000:]})
            return errors

    return errors  # Empty = success


def get_ai_fix(client, types, errors, project_info, knowledge, attempt):
    """Ask Gemini to diagnose and fix the errors"""

    # Build context from past knowledge
    past_fixes = ""
    if knowledge["fixes"]:
        recent = knowledge["fixes"][-5:]
        past_fixes = f"\nPast successful fixes (learn from these):\n{json.dumps(recent, indent=2)}"

    # Read relevant files
    relevant_files = {}
    files_to_check = [
        "package.json", "capacitor.config.ts",
        "android/app/build.gradle", "android/build.gradle",
        "android/variables.gradle", "vite.config.ts", "tsconfig.json"
    ]
    for f in files_to_check:
        if Path(f).exists():
            relevant_files[f] = Path(f).read_text()[:3000]

    prompt = f"""You are Forge Brain, an autonomous self-healing AI for a Capacitor/Android app.
    
BUILD ATTEMPT: {attempt}/{MAX_HEAL_LOOPS}
PROJECT TYPE: {project_info['type']}
FRAMEWORKS: {', '.join(project_info['frameworks'])}

ERRORS:
{json.dumps(errors, indent=2)}

RELEVANT FILES:
{json.dumps(relevant_files, indent=2)}
{past_fixes}

INSTRUCTIONS:
1. Diagnose the root cause of the failure
2. Provide specific file edits to fix it
3. Provide shell commands if needed (safe ones only)
4. Be aggressive - fix the problem completely
5. If you've seen similar patterns in past fixes, apply what worked

Respond with JSON:
{{
  "diagnosis": "clear explanation of root cause",
  "stage": "which build stage failed",
  "fixes": [
    {{"file": "path/to/file", "action": "replace|append|create", "find": "text to find (for replace)", "content": "new content"}}
  ],
  "commands": ["safe shell commands to run"],
  "prevention": "what to do to prevent this in the future",
  "confidence": 0-100
}}

ONLY output valid JSON."""

    try:
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"  ⚠️  AI analysis failed: {e}")
        return None


def apply_fixes(fix_result):
    """Apply the AI-suggested fixes"""
    applied = []

    # Apply file fixes
    for fix in fix_result.get("fixes", []):
        filepath = fix.get("file", "")
        action = fix.get("action", "replace")
        content = fix.get("content", "")

        try:
            if action == "create":
                Path(filepath).parent.mkdir(parents=True, exist_ok=True)
                Path(filepath).write_text(content)
                applied.append(f"Created: {filepath}")

            elif action == "append":
                if Path(filepath).exists():
                    with open(filepath, "a") as f:
                        f.write(content)
                    applied.append(f"Appended to: {filepath}")

            elif action == "replace":
                if Path(filepath).exists():
                    file_content = Path(filepath).read_text()
                    find_str = fix.get("find", "")
                    if find_str and find_str in file_content:
                        file_content = file_content.replace(find_str, content)
                        Path(filepath).write_text(file_content)
                        applied.append(f"Fixed: {filepath}")
                    elif not find_str and content:
                        # Full file replacement
                        Path(filepath).write_text(content)
                        applied.append(f"Replaced: {filepath}")
        except Exception as e:
            print(f"  ⚠️  Could not apply fix to {filepath}: {e}")

    # Run safe commands
    safe_prefixes = ["npm", "npx", "cd", "chmod", "mkdir", "rm -rf node_modules",
                     "rm -rf android/.gradle", "rm -f package-lock.json"]
    for cmd in fix_result.get("commands", [])[:5]:
        is_safe = any(cmd.strip().startswith(prefix) for prefix in safe_prefixes)
        if is_safe:
            print(f"  🔧 Running: {cmd}")
            subprocess.run(cmd, shell=True, capture_output=True, timeout=60)
            applied.append(f"Ran: {cmd}")
        else:
            print(f"  ⏭️  Skipped unsafe command: {cmd}")

    return applied


def log_healing(attempt, errors, fix_result, applied, success):
    """Log the healing attempt"""
    with open(LOG_FILE, "a") as f:
        f.write(f"\n## Healing Attempt {attempt} — {datetime.now(timezone.utc).isoformat()}\n\n")
        f.write(f"**Stage:** {fix_result.get('stage', 'unknown') if fix_result else 'analysis_failed'}\n")
        f.write(f"**Diagnosis:** {fix_result.get('diagnosis', 'N/A') if fix_result else 'N/A'}\n")
        f.write(f"**Confidence:** {fix_result.get('confidence', 0) if fix_result else 0}%\n")
        f.write(f"**Result:** {'✅ Success' if success else '❌ Failed'}\n\n")
        if applied:
            f.write("**Actions taken:**\n")
            for a in applied:
                f.write(f"- {a}\n")
        f.write("\n---\n")


def heal_workflows():
    """Auto-fix deprecated GitHub Actions versions"""
    workflow_dir = Path(".github/workflows")
    if not workflow_dir.exists():
        return False

    fixes = [
        ("upload-artifact@v3", "upload-artifact@v4"),
        ("download-artifact@v3", "download-artifact@v4"),
        ("checkout@v3", "checkout@v4"),
        ("setup-python@v3", "setup-python@v4"),
        ("setup-python@v4", "setup-python@v5"),
        ("setup-node@v3", "setup-node@v4"),
        ("setup-java@v3", "setup-java@v4"),
        ("cache@v3", "cache@v4"),
        ("github-script@v6", "github-script@v7"),
    ]

    changed = False
    for workflow_file in workflow_dir.glob("*.yml"):
        content = workflow_file.read_text()
        original = content
        for old, new in fixes:
            if old in content:
                content = content.replace(old, new)
                print(f"  🔧 Workflow fix: {old} → {new} in {workflow_file.name}")
                changed = True
        if content != original:
            workflow_file.write_text(content)

    return changed


def main():
    print("\n🧠 Forge Brain v3 — Self-Healing Engine\n")
    print("=" * 50)

    # Initialize
    client, types_module = setup_gemini()
    project_info = detect_project_type()
    knowledge = load_knowledge()

    print(f"📋 Project: {project_info['type']}")
    print(f"🔧 Frameworks: {', '.join(project_info['frameworks'])}")
    print(f"📚 Knowledge base: {len(knowledge['fixes'])} past fixes")
    print()

    # Step 1: Fix deprecated workflow actions
    print("🔍 Scanning workflows for deprecated actions...")
    if heal_workflows():
        print("  ✅ Fixed deprecated GitHub Actions\n")
    else:
        print("  ✅ All workflow actions up to date\n")

    # Step 2: Attempt build with self-healing loop
    for attempt in range(1, MAX_HEAL_LOOPS + 1):
        print(f"🏗️  Build attempt {attempt}/{MAX_HEAL_LOOPS}...")
        errors = run_build()

        if not errors:
            print("\n✅ Build successful! No errors detected.\n")
            log_healing(attempt, [], None, [], True)
            return

        print(f"\n❌ Build failed at stage: {errors[-1]['stage']}")
        print(f"🤖 Requesting AI diagnosis (attempt {attempt})...\n")

        # Get AI fix
        fix_result = get_ai_fix(client, types_module, errors, project_info, knowledge, attempt)

        if fix_result:
            print(f"  📊 Diagnosis: {fix_result.get('diagnosis', 'Unknown')}")
            print(f"  🎯 Confidence: {fix_result.get('confidence', 0)}%")
            print()

            # Apply fixes
            applied = apply_fixes(fix_result)
            if applied:
                print(f"\n  ✅ Applied {len(applied)} fixes")
                for a in applied:
                    print(f"     • {a}")
            print()

            # Log and learn
            log_healing(attempt, errors, fix_result, applied, False)

            # Save to knowledge base for future learning
            knowledge["fixes"].append({
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "stage": fix_result.get("stage"),
                "diagnosis": fix_result.get("diagnosis"),
                "fixes_applied": [f.get("file") for f in fix_result.get("fixes", [])],
                "commands": fix_result.get("commands", []),
                "attempt": attempt
            })
            # Keep only last 50 fixes in knowledge
            knowledge["fixes"] = knowledge["fixes"][-50:]
            save_knowledge(knowledge)
        else:
            print("  ⚠️  Could not get AI diagnosis")
            log_healing(attempt, errors, None, [], False)

    # All attempts exhausted
    print(f"\n{'='*50}")
    print("⚠️  All {MAX_HEAL_LOOPS} healing attempts exhausted.")
    print(f"📋 See {LOG_FILE} for details.")
    print("🔔 A GitHub issue will be created automatically.\n")
    sys.exit(1)


if __name__ == "__main__":
    main()
