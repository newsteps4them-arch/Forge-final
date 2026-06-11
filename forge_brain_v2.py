#!/usr/bin/env python3
import os, sys, subprocess, json, re
from pathlib import Path
from datetime import datetime
import google.generativeai as genai

MAX_LOOPS = 3
LOG_FILE = "FORGE_HEALING_LOG.md"

def setup_gemini():
    # Load from .env if present
    if os.path.exists(".env"):
        with open(".env", "r") as f:
            for line in f:
                line = line.strip()
                if "=" in line and not line.startswith("#"):
                    k, v = line.split("=", 1)
                    k = k.strip()
                    v = v.strip().strip('"').strip("'")
                    os.environ[k] = v

    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("VITE_GEMINI_API_KEY")
    if not api_key:
        print("❌ GEMINI_API_KEY or VITE_GEMINI_API_KEY not set in environment or .env file")
        sys.exit(1)

    try:
        genai.configure(api_key=api_key)
        return genai.GenerativeModel("gemini-1.5-pro")
    except Exception as e:
        print(f"❌ Failed to configure Gemini: {e}")
        sys.exit(1)

def detect_project():
    root = Path(".")
    # Prioritize Node.js for this repository
    if (root / "package.json").exists():
        print("✓ Detected: Node.js")
        return "node"
    if (root / "pyproject.toml").exists() or (root / "requirements.txt").exists():
        print("✓ Detected: Python")
        return "python"
    return "python"

def heal_workflows():
    """Auto-fix deprecated GitHub Actions"""
    workflow_dir = Path(".github/workflows")
    if not workflow_dir.exists():
        return False
    
    fixes = [
        ("upload-artifact@v3", "upload-artifact@v4"),
        ("download-artifact@v3", "download-artifact@v4"),
        ("checkout@v3", "checkout@v4"),
        ("setup-python@v3", "setup-python@v4"),
        ("cache@v3", "cache@v4"),
        ("setup-node@v3", "setup-node@v4"),
        ("actions/setup-java@v3", "actions/setup-java@v4"),
    ]
    
    changed = False
    for workflow_file in workflow_dir.glob("*.yml"):
        content = workflow_file.read_text()
        original = content
        
        for old, new in fixes:
            if old in content:
                content = content.replace(old, new)
                print(f"  🔧 Fixed: {old} → {new} in {workflow_file.name}")
                changed = True
        
        if content != original:
            workflow_file.write_text(content)
    
    return changed

def run_tests(ptype):
    try:
        if ptype == "python":
            res = subprocess.run(["python", "-m", "py_compile", "."], capture_output=True, text=True, timeout=60)
            if res.returncode != 0:
                return res.stderr or res.stdout or "Compilation failed"
        elif ptype == "node":
            npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
            # Try lint first, fallback to build if lint fails or doesn't exist
            res = subprocess.run([npm_cmd, "run", "lint"], capture_output=True, text=True, timeout=60)
            if res.returncode != 0:
                # If lint failed, we return the output as the error to fix
                return (res.stdout or "") + "\n" + (res.stderr or "")
        return None
    except Exception as e:
        return f"Test Execution Error: {str(e)}"

def clean_json_response(text):
    if not text:
        return None
    # Remove markdown code blocks if present
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()

def get_fix(error, ptype, model):
    prompt = (
        f"You are the Forge Guardian, an autonomous AI maintenance agent. Fix this {ptype} error:\n\n"
        f"ERROR_LOG:\n{error[:2000]}\n\n"
        f"INSTRUCTION:\n"
        f"Identify the file causing the issue. Provide the relative path and the complete fixed code.\n"
        f"Return a JSON object with exactly two keys: 'file' and 'code'.\n"
        f"Do NOT include any commentary outside the JSON."
    )
    try:
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        return clean_json_response(response.text)
    except Exception as e:
        print(f"   ⚠ Gemini API Error: {e}")
        # Fallback without JSON mode
        try:
            response = model.generate_content(prompt)
            return clean_json_response(response.text)
        except:
            return None

def log_healing(loop, error, file_path, success):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    status = "SUCCESS" if success else "FAILED"
    with open(LOG_FILE, "a") as f:
        f.write(f"\n### [{timestamp}] Loop {loop} — {status}\n")
        f.write(f"**Target File:** `{file_path}`\n")
        f.write(f"**Error Summary:**\n```\n{error[:500]}\n```\n")

def main():
    print("\n🔥 Forge Guardian v2.1 Activated\n")
    
    print("🔍 Inspecting CI/CD Workflows...")
    if heal_workflows():
        print("✅ Workflow optimizations applied.\n")
    
    model = setup_gemini()
    ptype = detect_project()
    print()
    
    for loop in range(1, MAX_LOOPS + 1):
        print(f"📋 Loop {loop}/{MAX_LOOPS}: Running system diagnostics...")
        error = run_tests(ptype)

        if not error:
            print("✨ All systems operational. No issues detected.\n")
            return
        
        print(f"🔎 Issue identified. Consulting Gemini for remediation...")
        fix_json = get_fix(error, ptype, model)

        if fix_json:
            try:
                data = json.loads(fix_json)
                file_path = data.get("file")
                code_content = data.get("code")

                if file_path and code_content:
                    print(f"🛠  Applying fix to: {file_path}")
                    # Ensure directory exists
                    Path(file_path).parent.mkdir(parents=True, exist_ok=True)
                    Path(file_path).write_text(code_content, encoding="utf-8")

                    # Verify fix
                    print("🔄 Verifying remediation...")
                    new_error = run_tests(ptype)
                    success = (new_error is None)
                    log_healing(loop, error, file_path, success)

                    if success:
                        print(f"✅ Issue resolved in {file_path}!\n")
                        return
                    else:
                        print(f"⚠ Fix applied to {file_path} but diagnostics still failing.")
                else:
                    print("❌ Received invalid remediation data (missing 'file' or 'code')")
            except Exception as ex:
                print(f"❌ Failed to parse or apply remediation: {ex}")
        else:
            print("❌ Failure: Could not generate remediation plan.")
    
    print(f"\n📝 Healing sequence completed. View `{LOG_FILE}` for details.\n")

if __name__ == "__main__":
    main()
