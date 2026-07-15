#!/usr/bin/env python3
"""
Forge Auto-Audit
-----------------
Deterministic, non-AI pattern scanner for team.forge. Runs on a schedule via
GitHub Actions (no chat / no Claude session required). Scans a fixed set of
risk patterns discovered during manual review, and keeps ONE tracking issue
up to date (opens it if missing, updates the body if it already exists) so
re-runs don't spam new issues.

Deliberately does NOT auto-commit fixes to main. Findings go into an issue
for human (or a separate, PR-based) review — direct-to-main auto-commits are
what Forge Guardian already does, and that's part of why the two open
"APK Build Failed - Self-Healing Exhausted" issues exist. This script only
reports.

Requires: GITHUB_TOKEN env var (GitHub Actions provides this automatically
via secrets.GITHUB_TOKEN — no extra secret needed).
"""

import os
import re
import sys
import json
import base64
import urllib.request
import urllib.error

REPO = os.environ.get("GITHUB_REPOSITORY", "newsteps4them-arch/team.forge")
TOKEN = os.environ["GITHUB_TOKEN"]
API = "https://api.github.com"
TRACKING_TITLE = "\U0001f50e Forge Auto-Audit — Open Findings"
LABEL = "auto-audit"

HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/vnd.github+json",
    "User-Agent": "forge-auto-audit",
}


def api(method, path, body=None):
    url = f"{API}{path}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        print(f"API error {method} {path}: {e.code} {e.read().decode()}", file=sys.stderr)
        raise


def get_file(path, ref="main"):
    try:
        data = api("GET", f"/repos/{REPO}/contents/{path}?ref={ref}")
        if isinstance(data, list):
            return None  # directory
        return base64.b64decode(data["content"]).decode("utf-8", errors="replace")
    except urllib.error.HTTPError:
        return None


def list_tree(ref="main"):
    """Get the full recursive file tree."""
    branch = api("GET", f"/repos/{REPO}/branches/{ref}")
    sha = branch["commit"]["sha"]
    tree = api("GET", f"/repos/{REPO}/git/trees/{sha}?recursive=1")
    return [t["path"] for t in tree.get("tree", []) if t["type"] == "blob"]


# --- Rules --------------------------------------------------------------

def rule_hardcoded_keystore_creds(files):
    content = files.get("android/app/build.gradle", "")
    findings = []
    for m in re.finditer(r'(storePassword|keyPassword|keyAlias)\s+"([^"]+)"', content):
        findings.append(f"`{m.group(1)} \"{m.group(2)}\"` hardcoded in android/app/build.gradle")
    return findings


def rule_committed_keystore(files, tree):
    return (
        ["`android/app/release.keystore` is committed to the repo"]
        if "android/app/release.keystore" in tree
        else []
    )


def rule_malformed_data_uri(files):
    content = files.get("src/services/geminiService.ts", "")
    findings = []
    if re.search(r'`image/jpeg;base64,\$\{', content) and "data:image" not in content:
        findings.append(
            "src/services/geminiService.ts builds an image payload as "
            "`image/jpeg;base64,${...}` — missing the `data:` prefix, "
            "breaks mime-type detection in server.ts for non-JPEG images"
        )
    return findings


def rule_menu_groups_as_const(files):
    content = files.get("src/components/NavigationDrawer.tsx", "")
    findings = []
    if "const MENU_GROUPS = [" in content and "as const" not in content:
        findings.append(
            "src/components/NavigationDrawer.tsx: MENU_GROUPS is not typed `as const`, "
            "widening item.id to `string` instead of `Screen`"
        )
    return findings


def rule_firestore_leads_open_list(files):
    content = files.get("firestore.rules", "")
    findings = []
    m = re.search(r"match /leads/\{leadId\}\s*\{([^}]*)\}", content, re.S)
    if m and re.search(r"allow list:\s*if isSignedIn\(\);", m.group(1)):
        findings.append(
            "firestore.rules: `leads` collection allows `list` for any signed-in "
            "user, including anonymous sessions — exposes all lead PII to anyone"
        )
    return findings


def rule_stale_draft_rules(tree):
    return (
        ["DRAFT_firestore.rules is a stale/superseded file next to the live firestore.rules — confusing to keep"]
        if "DRAFT_firestore.rules" in tree
        else []
    )


def rule_shell_injection(files):
    content = files.get("server.ts", "")
    findings = []
    if "repoUrl" in content and 'sync.sh --link "${repoUrl}"' in content:
        findings.append(
            "server.ts /api/git/link interpolates `repoUrl` into a shell command "
            "without sanitization (unlike commitMessage, which is sanitized) — "
            "command injection risk, and the server binds 0.0.0.0"
        )
    return findings


def rule_package_json_dupes(files):
    content = files.get("package.json", "")
    findings = []
    if not content:
        return findings
    try:
        pkg = json.loads(content)
    except json.JSONDecodeError:
        return findings
    deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
    if "framer-motion" in deps and "motion" in deps:
        findings.append("package.json has both `framer-motion` and `motion` (same library, old+new package name)")
    if "@google/genai" in deps and "@google/generative-ai" in deps:
        findings.append("package.json has both `@google/genai` and `@google/generative-ai` (new+deprecated SDK)")
    react_ver = deps.get("react", "")
    react_is_ver = deps.get("react-is", "")
    react_major = re.search(r"(\d+)", react_ver)
    react_is_major = re.search(r"(\d+)", react_is_ver)
    if react_major and react_is_major and react_major.group(1) != react_is_major.group(1):
        findings.append(f"package.json: react@{react_ver} but react-is@{react_is_ver} — major version mismatch")
    return findings


def rule_stale_version(files):
    content = files.get("android/app/build.gradle", "")
    findings = []
    if re.search(r'versionCode\s+1\b', content) and re.search(r'versionName\s+"1\.0\.0"', content):
        findings.append("android/app/build.gradle: versionCode/versionName still at initial 1 / 1.0.0")
    return findings


RULES_NEEDING_FILES = [
    rule_hardcoded_keystore_creds,
    rule_malformed_data_uri,
    rule_menu_groups_as_const,
    rule_firestore_leads_open_list,
    rule_shell_injection,
    rule_package_json_dupes,
    rule_stale_version,
]

FILES_TO_LOAD = [
    "android/app/build.gradle",
    "src/services/geminiService.ts",
    "src/components/NavigationDrawer.tsx",
    "firestore.rules",
    "server.ts",
    "package.json",
]


def run():
    tree = list_tree()
    files = {p: (get_file(p) or "") for p in FILES_TO_LOAD}

    findings = []
    for rule in RULES_NEEDING_FILES:
        findings.extend(rule(files))
    findings.extend(rule_committed_keystore(files, tree))
    findings.extend(rule_stale_draft_rules(tree))

    if not findings:
        body = "No known-pattern findings on this run. ✅"
    else:
        lines = [f"- {f}" for f in findings]
        body = (
            f"Automated scan found **{len(findings)}** open pattern-based finding(s):\n\n"
            + "\n".join(lines)
            + "\n\n_This issue is maintained automatically by `scripts/auto_audit.py` "
              "on a schedule. It reports only — no auto-commits to main. "
              "Close individual findings by fixing them; this issue's body "
              "will reflect what's still outstanding on the next run._"
        )

    existing = api(
        "GET",
        f"/repos/{REPO}/issues?state=open&labels={LABEL}&per_page=50",
    )
    match = next((i for i in existing if i["title"] == TRACKING_TITLE), None)

    if match:
        api("PATCH", f"/repos/{REPO}/issues/{match['number']}", {"body": body})
        print(f"Updated tracking issue #{match['number']}")
    elif findings:
        created = api(
            "POST",
            f"/repos/{REPO}/issues",
            {"title": TRACKING_TITLE, "body": body, "labels": [LABEL]},
        )
        print(f"Created tracking issue #{created['number']}")
    else:
        print("No findings, no existing issue — nothing to do.")


if __name__ == "__main__":
    run()
