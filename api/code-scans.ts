const GITHUB_API = "https://api.github.com";
const DEFAULT_OWNER = "newsteps4them-arch";
const DEFAULT_REPO = "team.forge";
const DEFAULT_BRANCH = "main";
const MAX_FILES = 120;
const MAX_FILE_BYTES = 160_000;

type ScanMode = "report" | "fix";
type ArtifactKind = "issue" | "discussion" | "pull_request" | "none";

type GitHubTreeItem = {
  path: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
};

type Finding = {
  scanner: string;
  severity: "low" | "medium" | "high";
  file: string;
  line?: number;
  title: string;
  details: string;
};

type GitHubContext = {
  token: string;
  owner: string;
  repo: string;
  branch: string;
};

type ScanRequest = {
  mode?: ScanMode;
  artifact?: ArtifactKind;
  owner?: string;
  repo?: string;
  branch?: string;
  dryRun?: boolean | string;
  maxFiles?: number | string;
};

function json(res: any, status: number, body: unknown) {
  res.status(status).setHeader("content-type", "application/json");
  res.end(JSON.stringify(body, null, 2));
}

function requireSecret(req: any): boolean {
  const manualSecret = process.env.CODE_SCAN_SECRET;
  const cronSecret = process.env.CRON_SECRET;
  const actual = req.headers["x-code-scan-secret"] || req.query?.secret;
  const cronAuthorized = Boolean(cronSecret) && req.headers.authorization === `Bearer ${cronSecret}`;
  return (Boolean(manualSecret) && actual === manualSecret) || cronAuthorized;
}

function parseBody(req: any): ScanRequest {
  if (req.method !== "POST") return req.query || {};
  if (typeof req.body !== "string") return req.body || {};
  try {
    return JSON.parse(req.body || "{}");
  } catch {
    return {};
  }
}

async function github<T>(ctx: GitHubContext, path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${GITHUB_API}${path}`, {
    ...init,
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${ctx.token}`,
      "content-type": "application/json",
      "x-github-api-version": "2022-11-28",
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`GitHub API ${response.status} for ${path}: ${detail.slice(0, 800)}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

async function githubGraphQL<T>(ctx: GitHubContext, query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      authorization: `Bearer ${ctx.token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  const payload = await response.json();
  if (!response.ok || payload.errors?.length) {
    throw new Error(`GitHub GraphQL failed: ${JSON.stringify(payload.errors || payload).slice(0, 800)}`);
  }
  return payload.data as T;
}

async function getDefaultBranch(ctx: GitHubContext): Promise<string> {
  const repo = await github<{ default_branch: string }>(ctx, `/repos/${ctx.owner}/${ctx.repo}`);
  return ctx.branch || repo.default_branch || DEFAULT_BRANCH;
}

async function getTree(ctx: GitHubContext): Promise<GitHubTreeItem[]> {
  const branch = await github<{ commit: { sha: string } }>(ctx, `/repos/${ctx.owner}/${ctx.repo}/branches/${ctx.branch}`);
  const tree = await github<{ tree: GitHubTreeItem[] }>(ctx, `/repos/${ctx.owner}/${ctx.repo}/git/trees/${branch.commit.sha}?recursive=1`);
  return tree.tree.filter((item) => item.type === "blob");
}

function shouldScan(path: string): boolean {
  if (/^(node_modules|dist|build|coverage|android\/app\/build|android\/app\/src\/main\/assets|\.git)\//.test(path)) return false;
  if (/package-lock\.json$/.test(path)) return false;
  return /\.(ts|tsx|js|jsx|json|md|css|html|yml|yaml)$/.test(path);
}

async function getFileText(ctx: GitHubContext, path: string): Promise<string | null> {
  const file = await github<{ content?: string; encoding?: string }>(ctx, `/repos/${ctx.owner}/${ctx.repo}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}?ref=${encodeURIComponent(ctx.branch)}`);
  if (!file.content || file.encoding !== "base64") return null;
  return Buffer.from(file.content, "base64").toString("utf8");
}

function scanFile(path: string, content: string): Finding[] {
  const findings: Finding[] = [];
  const lines = content.split("\n");

  lines.forEach((line, index) => {
    if (/\b(TODO|FIXME|HACK)\b/i.test(line) && !line.includes("TODO|FIXME|HACK")) {
      findings.push({
        scanner: "maintenance-markers",
        severity: "low",
        file: path,
        line: index + 1,
        title: "Maintenance marker found",
        details: line.trim().slice(0, 220),
      });
    }

    if (/AIza[0-9A-Za-z_-]{20,}/.test(line) || /(api[_-]?key|token|secret|password)\s*[:=]\s*["'][^"']{12,}["']/i.test(line)) {
      findings.push({
        scanner: "secret-patterns",
        severity: "high",
        file: path,
        line: index + 1,
        title: "Possible hard-coded secret",
        details: "A credential-like value is present in source. Move it to a Vercel environment variable and rotate the credential if it was committed.",
      });
    }

    if (/console\.(log|debug)\(/.test(line) && /\.(ts|tsx|js|jsx)$/.test(path)) {
      findings.push({
        scanner: "production-noise",
        severity: "medium",
        file: path,
        line: index + 1,
        title: "Console logging in application code",
        details: line.trim().slice(0, 220),
      });
    }
  });

  if (path === "package.json") {
    try {
      const pkg = JSON.parse(content);
      if (!pkg.scripts?.lint) {
        findings.push({ scanner: "project-hygiene", severity: "medium", file: path, title: "Missing lint script", details: "Add a lint script so automated scans can run consistent local checks." });
      }
      if (!pkg.scripts?.build) {
        findings.push({ scanner: "project-hygiene", severity: "high", file: path, title: "Missing build script", details: "Add a build script so fix pull requests can be validated before review." });
      }
    } catch {
      findings.push({ scanner: "project-hygiene", severity: "high", file: path, title: "Invalid package.json", details: "package.json could not be parsed." });
    }
  }

  return findings;
}

function summarizeFindings(findings: Finding[], ctx?: Pick<GitHubContext, "owner" | "repo">): string {
  const counts = findings.reduce<Record<string, number>>((acc, finding) => {
    acc[finding.severity] = (acc[finding.severity] || 0) + 1;
    return acc;
  }, {});

  const rows = findings.slice(0, 80).map((finding) => {
    const location = finding.line ? `${finding.file}:${finding.line}` : finding.file;
    return `| ${finding.severity} | ${finding.scanner} | \`${location}\` | ${finding.title} |`;
  }).join("\n");

  return [
    "## Automated code scan report",
    "",
    `Scanned at: ${new Date().toISOString()}`,
    `Repository: ${ctx?.owner || DEFAULT_OWNER}/${ctx?.repo || DEFAULT_REPO}`,
    "",
    `Summary: ${findings.length} findings (${counts.high || 0} high, ${counts.medium || 0} medium, ${counts.low || 0} low).`,
    "",
    "| Severity | Scanner | Location | Finding |",
    "| --- | --- | --- | --- |",
    rows || "| low | scan | repository | No findings detected |",
  ].join("\n");
}

async function createIssue(ctx: GitHubContext, findings: Finding[]): Promise<string> {
  const issue = await github<{ html_url: string }>(ctx, `/repos/${ctx.owner}/${ctx.repo}/issues`, {
    method: "POST",
    body: JSON.stringify({
      title: `Automated code scan: ${findings.length} finding${findings.length === 1 ? "" : "s"}`,
      body: summarizeFindings(findings, ctx),
      labels: ["automated-scan"],
    }),
  });
  return issue.html_url;
}

async function createDiscussion(ctx: GitHubContext, findings: Finding[]): Promise<string> {
  const data = await githubGraphQL<{
    repository: {
      id: string;
      discussionCategories: { nodes: { id: string; name: string }[] };
    };
  }>(ctx, `
    query($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        id
        discussionCategories(first: 20) { nodes { id name } }
      }
    }
  `, { owner: ctx.owner, repo: ctx.repo });

  const categoryId = process.env.GITHUB_DISCUSSION_CATEGORY_ID || data.repository.discussionCategories.nodes[0]?.id;
  if (!categoryId) throw new Error("No GitHub Discussion category is available for this repository.");

  const created = await githubGraphQL<{ createDiscussion: { discussion: { url: string } } }>(ctx, `
    mutation($repositoryId: ID!, $categoryId: ID!, $title: String!, $body: String!) {
      createDiscussion(input: {repositoryId: $repositoryId, categoryId: $categoryId, title: $title, body: $body}) {
        discussion { url }
      }
    }
  `, {
    repositoryId: data.repository.id,
    categoryId,
    title: `Automated code scan discussion: ${findings.length} finding${findings.length === 1 ? "" : "s"}`,
    body: summarizeFindings(findings, ctx),
  });

  return created.createDiscussion.discussion.url;
}

function applySafeFixes(path: string, content: string): string | null {
  if (path === "package.json") {
    const pkg = JSON.parse(content);
    pkg.scripts = pkg.scripts || {};
    if (!pkg.scripts["scan:code"]) {
      pkg.scripts["scan:code"] = "node scripts/local-code-scan.mjs";
      return `${JSON.stringify(pkg, null, 2)}\n`;
    }
  }

  if (path === "README.md" && !content.includes("## Automated code scans")) {
    return `${content.trim()}\n\n## Automated code scans\n\nThis repository includes a Vercel-hosted code scan endpoint at \`/api/code-scans\`. Configure \`GITHUB_TOKEN\` plus \`CODE_SCAN_SECRET\` or \`CRON_SECRET\` in Vercel environment variables, then call the endpoint manually or through the configured cron schedule.\n`;
  }

  return null;
}

async function createFixPullRequest(ctx: GitHubContext, files: Map<string, string>, findings: Finding[]): Promise<string> {
  const base = await github<{ commit: { sha: string } }>(ctx, `/repos/${ctx.owner}/${ctx.repo}/branches/${ctx.branch}`);
  const branchName = `vercel-agent/code-scan-fixes-${Date.now()}`;
  await github(ctx, `/repos/${ctx.owner}/${ctx.repo}/git/refs`, {
    method: "POST",
    body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: base.commit.sha }),
  });

  for (const [filePath, content] of files.entries()) {
    const current = await github<{ sha: string }>(ctx, `/repos/${ctx.owner}/${ctx.repo}/contents/${encodeURIComponent(filePath).replace(/%2F/g, "/")}?ref=${encodeURIComponent(branchName)}`);
    await github(ctx, `/repos/${ctx.owner}/${ctx.repo}/contents/${encodeURIComponent(filePath).replace(/%2F/g, "/")}`, {
      method: "PUT",
      body: JSON.stringify({
        branch: branchName,
        message: `chore: apply automated code scan fix for ${filePath}`,
        content: Buffer.from(content, "utf8").toString("base64"),
        sha: current.sha,
      }),
    });
  }

  const pr = await github<{ html_url: string }>(ctx, `/repos/${ctx.owner}/${ctx.repo}/pulls`, {
    method: "POST",
    body: JSON.stringify({
      title: "chore: apply automated code scan fixes",
      head: branchName,
      base: ctx.branch,
      body: `${summarizeFindings(findings, ctx)}\n\nThis pull request was opened by the Vercel code-scan automation and only applies safe deterministic fixes.`,
    }),
  });

  return pr.html_url;
}

async function runScan(ctx: GitHubContext, maxFiles: number) {
  const tree = await getTree(ctx);
  const candidates = tree
    .filter((item) => shouldScan(item.path) && (item.size || 0) <= MAX_FILE_BYTES)
    .slice(0, maxFiles);

  const contents = new Map<string, string>();
  const findings: Finding[] = [];

  for (const item of candidates) {
    const text = await getFileText(ctx, item.path);
    if (text === null) continue;
    contents.set(item.path, text);
    findings.push(...scanFile(item.path, text));
  }

  return { scannedFiles: candidates.length, contents, findings };
}

export default async function handler(req: any, res: any) {
  if (!["GET", "POST"].includes(req.method)) return json(res, 405, { error: "Method not allowed" });
  if (!requireSecret(req)) return json(res, 401, { error: "Configure CODE_SCAN_SECRET or CRON_SECRET, then provide the matching request secret." });

  const body = parseBody(req);
  const token = process.env.GITHUB_TOKEN;
  if (!token) return json(res, 500, { error: "GITHUB_TOKEN is not configured" });

  const ctx: GitHubContext = {
    token,
    owner: body.owner || process.env.GITHUB_OWNER || DEFAULT_OWNER,
    repo: body.repo || process.env.GITHUB_REPO || DEFAULT_REPO,
    branch: body.branch || process.env.GITHUB_BRANCH || DEFAULT_BRANCH,
  };
  ctx.branch = await getDefaultBranch(ctx);

  const mode = body.mode || (req.query?.mode as ScanMode) || "report";
  const artifact = body.artifact || (mode === "fix" ? "pull_request" : "issue");
  const dryRun = body.dryRun === true || body.dryRun === "true" || process.env.CODE_SCAN_DRY_RUN === "true";
  const maxFiles = Math.min(Number(body.maxFiles || process.env.CODE_SCAN_MAX_FILES || MAX_FILES), MAX_FILES);

  try {
    const { scannedFiles, contents, findings } = await runScan(ctx, maxFiles);
    const result: Record<string, unknown> = { mode, artifact, dryRun, scannedFiles, findingCount: findings.length, findings: findings.slice(0, 50) };

    if (dryRun || artifact === "none" || findings.length === 0) return json(res, 200, result);

    if (mode === "fix") {
      const fixes = new Map<string, string>();
      for (const [filePath, content] of contents.entries()) {
        const fixed = applySafeFixes(filePath, content);
        if (fixed && fixed !== content) fixes.set(filePath, fixed);
      }

      if (fixes.size === 0) return json(res, 200, { ...result, message: "Findings detected, but no safe deterministic fixes were available." });
      result.url = await createFixPullRequest(ctx, fixes, findings);
      result.changedFiles = [...fixes.keys()];
      return json(res, 200, result);
    }

    if (artifact === "discussion") {
      result.url = await createDiscussion(ctx, findings);
    } else if (artifact === "issue") {
      result.url = await createIssue(ctx, findings);
    } else if (artifact === "pull_request") {
      return json(res, 400, { ...result, error: "Use mode=fix when artifact=pull_request so the pull request has commits." });
    }

    return json(res, 200, result);
  } catch (error: any) {
    return json(res, 500, { error: error.message || "Code scan failed" });
  }
}
