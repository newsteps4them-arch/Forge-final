import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateChatResponse, analyzeImage } from '../geminiService';

describe('geminiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    // Suppress console.error during tests to keep output clean
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('generateChatResponse', () => {
    it('should successfully generate a chat response', async () => {
      const mockResponse = { text: 'mock response text' };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const messages = [
        { role: 'user' as const, text: 'Hello' },
      ];

      const result = await generateChatResponse(messages);

      expect(result).toBe('mock response text');
      expect(global.fetch).toHaveBeenCalledWith('/api/chat', expect.any(Object));
    });

    it('should throw an error when response is not ok', async () => {
      const mockErrorResponse = { error: 'API Error Message' };
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => mockErrorResponse,
      });

      const messages = [
        { role: 'user' as const, text: 'Hello' },
      ];

      await expect(generateChatResponse(messages)).rejects.toThrow('API Error Message');
    });

    it('should throw a default error message if json parsing fails on error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => Promise.reject(new Error('Failed to parse')),
      });

      const messages = [
        { role: 'user' as const, text: 'Hello' },
      ];

      await expect(generateChatResponse(messages)).rejects.toThrow('Failed to generate chat response.');
    });

    it('should catch and rethrow network errors from fetch', async () => {
      const networkError = new Error('Network failure');
      (global.fetch as any).mockRejectedValueOnce(networkError);

      const messages = [
        { role: 'user' as const, text: 'Hello' },
      ];

      await expect(generateChatResponse(messages)).rejects.toThrow('Network failure');
      expect(console.error).toHaveBeenCalledWith('Gemini Backend Error:', networkError);
    });
  });

  describe('analyzeImage', () => {
    it('should successfully analyze an image', async () => {
      const mockResponse = { text: 'mock image analysis' };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await analyzeImage('describe this', 'base64data');

      expect(result).toBe('mock image analysis');
      expect(global.fetch).toHaveBeenCalledWith('/api/chat', expect.any(Object));
    });

    it('should throw an error when response is not ok', async () => {
      const mockErrorResponse = { error: 'Image Analysis Failed' };
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => mockErrorResponse,
      });

      await expect(analyzeImage('describe this', 'base64data')).rejects.toThrow('Image Analysis Failed');
    });

    it('should throw a default error message if json parsing fails on error', async () => {
       (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => Promise.reject(new Error('Failed to parse')),
      });

      await expect(analyzeImage('describe this', 'base64data')).rejects.toThrow('Failed to analyze image.');
    });

    it('should catch and rethrow network errors from fetch', async () => {
      const networkError = new Error('Network failure');
      (global.fetch as any).mockRejectedValueOnce(networkError);

      await expect(analyzeImage('describe this', 'base64data')).rejects.toThrow('Network failure');
      expect(console.error).toHaveBeenCalledWith('Gemini Backend Error:', networkError);
    });
  });
});
