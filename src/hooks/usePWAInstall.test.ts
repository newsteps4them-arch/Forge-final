import { renderHook, act } from '@testing-library/react'
import { usePWAInstall } from './usePWAInstall'
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('usePWAInstall', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should initialize with isInstallable as false', () => {
    const { result } = renderHook(() => usePWAInstall())
    expect(result.current.isInstallable).toBe(false)
  })

  it('should handle beforeinstallprompt event', () => {
    const { result } = renderHook(() => usePWAInstall())

    act(() => {
      const event = new Event('beforeinstallprompt')
      window.dispatchEvent(event)
    })

    expect(result.current.isInstallable).toBe(true)
  })

  it('should call prompt and update state on installPWA (accepted)', async () => {
    const { result } = renderHook(() => usePWAInstall())

    let promptCalled = false;

    act(() => {
      const event = new Event('beforeinstallprompt') as any;
      event.prompt = vi.fn().mockImplementation(async () => {
        promptCalled = true;
      });
      event.userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' });
      window.dispatchEvent(event)
    })

    expect(result.current.isInstallable).toBe(true)

    await act(async () => {
      await result.current.installPWA()
    })

    expect(promptCalled).toBe(true)
    expect(result.current.isInstallable).toBe(false)
  })

  it('should handle installPWA when user dismisses', async () => {
    const { result } = renderHook(() => usePWAInstall())

    let promptCalled = false;

    act(() => {
      const event = new Event('beforeinstallprompt') as any;
      event.prompt = vi.fn().mockImplementation(async () => {
        promptCalled = true;
      });
      event.userChoice = Promise.resolve({ outcome: 'dismissed', platform: 'web' });
      window.dispatchEvent(event)
    })

    expect(result.current.isInstallable).toBe(true)

    await act(async () => {
      await result.current.installPWA()
    })

    expect(promptCalled).toBe(true)
    expect(result.current.isInstallable).toBe(false)
  })

  it('should handle installPWA when no deferredPrompt is available', async () => {
    const { result } = renderHook(() => usePWAInstall())

    // Attempt to install without triggering beforeinstallprompt
    await act(async () => {
      await result.current.installPWA()
    })

    expect(result.current.isInstallable).toBe(false)
  })
})
