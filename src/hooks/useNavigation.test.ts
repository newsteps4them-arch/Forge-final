import { renderHook, act, waitFor } from "@testing-library/react";
import { useNavigation } from "./useNavigation";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("useNavigation", () => {
  let addEventListenerSpy: any;
  let removeEventListenerSpy: any;

  beforeEach(() => {
    // Mock window.history
    vi.spyOn(window.history, "pushState").mockImplementation(() => {});
    vi.spyOn(window.history, "replaceState").mockImplementation(() => {});

    vi.spyOn(window.history, "back").mockImplementation(() => {
      // Dispatch asynchronously to avoid React state batching conflicts with the current setStack
      setTimeout(() => {
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, 0);
    });

    addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize with the provided initial screen", () => {
    const { result } = renderHook(() => useNavigation("Welcome"));
    expect(result.current.currentScreen).toBe("Welcome");
    expect(result.current.stack).toEqual(["Welcome"]);
    expect(window.history.replaceState).toHaveBeenCalledWith({ screen: "Welcome" }, "", "#Welcome");
  });

  it("should initialize with 'Welcome' if no initial screen is provided", () => {
    const { result } = renderHook(() => useNavigation());
    expect(result.current.currentScreen).toBe("Welcome");
  });

  it("should navigate to a new screen", () => {
    const { result } = renderHook(() => useNavigation("Welcome"));

    act(() => {
      result.current.navigate("Inventory");
    });

    expect(result.current.currentScreen).toBe("Inventory");
    expect(result.current.stack).toEqual(["Welcome", "Inventory"]);
    expect(window.history.pushState).toHaveBeenCalledWith({ screen: "Inventory" }, "", "#Inventory");
  });

  it("should not push to stack if navigating to the same screen", () => {
    const { result } = renderHook(() => useNavigation("Welcome"));

    act(() => {
      result.current.navigate("Welcome");
    });

    expect(result.current.stack).toEqual(["Welcome"]);
    expect(window.history.pushState).not.toHaveBeenCalled();
  });

  it("should reset to 'Main' if navigating to 'Main'", () => {
    const { result } = renderHook(() => useNavigation("Welcome"));

    act(() => {
      result.current.navigate("Inventory");
      result.current.navigate("Main");
    });

    expect(result.current.currentScreen).toBe("Main");
    expect(result.current.stack).toEqual(["Main"]);
  });

  it("should reset to a specific screen using resetTo", () => {
    const { result } = renderHook(() => useNavigation("Welcome"));

    act(() => {
      result.current.navigate("Inventory");
      result.current.resetTo("Settings");
    });

    expect(result.current.currentScreen).toBe("Settings");
    expect(result.current.stack).toEqual(["Settings"]);
    expect(window.history.replaceState).toHaveBeenCalledWith({ screen: "Settings" }, "", "#Settings");
  });

  it("should handle goBack popping the stack correctly", async () => {
    const { result } = renderHook(() => useNavigation("Welcome"));

    act(() => {
      result.current.navigate("Inventory");
    });

    act(() => {
      result.current.goBack();
    });

    expect(window.history.back).toHaveBeenCalled();

    await waitFor(() => {
      expect(result.current.currentScreen).toBe("Welcome");
      expect(result.current.stack).toEqual(["Welcome"]);
    });
  });

  it("should handle goBack correctly and set to Main when stack is 1", async () => {
    const { result } = renderHook(() => useNavigation("Welcome"));

    act(() => {
      result.current.goBack();
    });

    expect(window.history.back).toHaveBeenCalled();

    await waitFor(() => {
      expect(result.current.currentScreen).toBe("Main");
      expect(result.current.stack).toEqual(["Main"]);
    });
  });

  it("should handle popstate event directly", () => {
    const { result } = renderHook(() => useNavigation("Welcome"));

    act(() => {
      result.current.navigate("Inventory");
    });

    expect(result.current.stack).toEqual(["Welcome", "Inventory"]);

    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(result.current.stack).toEqual(["Welcome"]);

    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(result.current.stack).toEqual(["Main"]);
  });

  it("should clean up event listener on unmount", () => {
    const { unmount } = renderHook(() => useNavigation("Welcome"));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith("popstate", expect.any(Function));
  });

});
