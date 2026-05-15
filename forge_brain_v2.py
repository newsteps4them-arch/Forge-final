#!/usr/bin/env python3
import os, sys, subprocess, json, re
from pathlib import Path
from datetime import datetime
import google.generativeai as genai

MAX_LOOPS = 3
LOG_FILE = "FORGE_HEALING_LOG.md"

def setup_gemini():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("❌ GEMINI_API_KEY not set"); sys.exit(1)
    genai.configure(api_key=api_key)
    return genai.GenerativeModel("gemini-1.5-pro")

def detect_project():
    root = Path(".")
    if (root / "pyproject.toml").exists() or (root / "requirements.txt").exists():
        print("✓ Detected: Python"); return "python"
    if (root / "package.json").exists():
        print("✓ Detected: Node.js"); return "node"
    return "python"

def run_tests(ptype):
    try:
        if ptype == "python":
            res = subprocess.run(["python", "-m", "py_compile", "."], capture_output=True, text=True, timeout=30)
            return res.stderr if res.returncode != 0 else None
        elif ptype == "node":
            res = subprocess.run(["npm", "run", "lint"], capture_output=True, text=True, timeout=30)
            return res.stderr if res.returncode != 0 else None
    except Exception as e:
        return str(e)
    return None

def get_fix(error, ptype, model):
    prompt = f"Fix this {ptype} error:\n{error[:800]}\n\nReturn JSON with 'code' key containing ```{ptype}``` block"
    try:
        return model.generate_content(prompt).text
    except:
        return None

def extract_code(text, ptype):
    match = re.search(rf"```{ptype}(.*?)```", text, re.DOTALL)
    return match.group(1).strip() if match else None

def log_it(loop, error, resp):
    with open(LOG_FILE, "a") as f:
        f.write(f"\n## Loop {loop} — {datetime.now().isoformat()}\n")
        f.write(f"**Error:** {error[:300]}\n**Response:** {resp[:400]}\n")

def main():
    print("\n🔧 Forge Guardian v2 Starting...\n")
    model = setup_gemini()
    ptype = detect_project()
    print()
    
    for loop in range(MAX_LOOPS):
        error = run_tests(ptype)
        if not error:
            print("✅ All checks passed!\n")
            return
        
        print(f"🔍 Loop {loop+1}/{MAX_LOOPS}: Requesting Gemini fix...")
        fix = get_fix(error, ptype, model)
        if fix:
            log_it(loop+1, error, fix)
            print(f"   ✏ Fix received")
        else:
            print(f"   ⚠ Could not get fix")
    
    print(f"\n📋 Log saved to: {LOG_FILE}\n")

if __name__ == "__main__":
    main()
