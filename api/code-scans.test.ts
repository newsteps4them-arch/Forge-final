import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import handler from "./code-scans.js";

describe("code-scans API handler", () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    // Reset environment variables
    process.env.CODE_SCAN_SECRET = "test-secret";
    process.env.GITHUB_TOKEN = "test-token";
    process.env.CODE_SCAN_DRY_RUN = "true"; // Run dry by default to avoid actual actions

    // Mock response object
    res = {
      status: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis(),
      end: vi.fn(),
    };

    // Default valid request mock
    req = {
      method: "POST",
      headers: {
        "x-code-scan-secret": "test-secret",
      },
      body: JSON.stringify({ mode: "report", dryRun: true }),
    };

    // Mock global fetch for github API calls
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        tree: [
          { path: "test.ts", type: "blob", url: "https://api.github.com/...", size: 100 }
        ]
      })
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.CODE_SCAN_SECRET;
    delete process.env.GITHUB_TOKEN;
    delete process.env.CODE_SCAN_DRY_RUN;
  });

  it("should return 405 for invalid method", async () => {
    req.method = "PUT";

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    const responseBody = JSON.parse(res.end.mock.calls[0][0]);
    expect(responseBody.error).toBe("Method not allowed");
  });

  it("should return 401 if secret is missing or invalid", async () => {
    req.headers["x-code-scan-secret"] = "wrong-secret";

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    const responseBody = JSON.parse(res.end.mock.calls[0][0]);
    expect(responseBody.error).toContain("Configure CODE_SCAN_SECRET");
  });

  it("should return 500 if GITHUB_TOKEN is not configured", async () => {
    delete process.env.GITHUB_TOKEN;

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    const responseBody = JSON.parse(res.end.mock.calls[0][0]);
    expect(responseBody.error).toBe("GITHUB_TOKEN is not configured");
  });

  it("should return 200 and scan results on valid request", async () => {
    // Mock fetch for the blob content specifically
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/git/trees/")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            tree: [{ path: "test.ts", type: "blob", size: 100 }]
          })
        };
      }
      if (url.includes("/git/blobs/") || url.includes("/contents/")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            content: Buffer.from("console.log('hello');", "utf-8").toString("base64"), encoding: "base64"
          })
        };
      }
      if (url.endsWith("/branches/main")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ commit: { sha: "abc" } })
        }
      }
      // default info repo
      return {
        ok: true,
        status: 200,
        json: async () => ({ default_branch: "main" })
      };
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const responseBody = JSON.parse(res.end.mock.calls[0][0]);
    expect(responseBody.mode).toBe("report");
    expect(responseBody.dryRun).toBe(true);
    expect(responseBody.scannedFiles).toBeDefined();
    expect(responseBody.findingCount).toBeGreaterThanOrEqual(0);
  });
});
