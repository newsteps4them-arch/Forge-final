import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyzeImage } from './geminiService';

describe('analyzeImage', () => {
  const mockPrompt = 'What is in this image?';
  const mockBase64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    // Suppress console.error in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws an error with custom message when response is not ok and contains valid JSON error payload', async () => {
    const mockErrorResponse = { error: 'Custom API error' };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve(mockErrorResponse),
    } as any);

    await expect(analyzeImage(mockPrompt, mockBase64Image)).rejects.toThrow('Custom API error');

    // Verify fetch was called correctly
    expect(fetch).toHaveBeenCalledWith('/api/chat', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }));
  });

  it('throws default error message when response is not ok and contains invalid JSON', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.reject(new Error('Invalid JSON')),
    } as any);

    await expect(analyzeImage(mockPrompt, mockBase64Image)).rejects.toThrow('Failed to analyze image.');
  });

  it('rethrows the error when fetch fails (network error)', async () => {
    const networkError = new Error('Network failure');
    vi.mocked(fetch).mockRejectedValueOnce(networkError);

    await expect(analyzeImage(mockPrompt, mockBase64Image)).rejects.toThrow('Network failure');
    expect(console.error).toHaveBeenCalledWith('Gemini Backend Error:', networkError);
  });
});
