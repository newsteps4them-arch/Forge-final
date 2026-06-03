import { useState, useCallback, useEffect } from "react";

export type Screen = 
  | "Welcome"
  | "NameAssistant"
  | "WakeWord"
  | "VoiceClone"
  | "AboutYou"
  | "Inventory"
  | "Vehicles"
  | "Garage"
  | "KnowledgeBase"
  | "Ready"
  | "Settings"
  | "Main"
  | "Chat"
  | "Diagnostics"
  | "LiveData"
  | "Coding"
  | "Terminal"
  | "Integrations"
  | "Estimator"
  | "Topology"
  | "Analytics"
  | "VisualInspector"
  | "GuidedDiagnostics"
  | "Oscilloscope"
  | "WiringDiagrams"
  | "Index"
  | "PartsCatalog"
  | "CrmDashboard"
  | "DviModule"
  | "TimeClock"
  | "GoToMarket"
  | "AdasCalibration";

export function useNavigation(initialScreen: Screen = "Welcome") {
  const [stack, setStack] = useState<Screen[]>([initialScreen]);

  const currentScreen = stack[stack.length - 1];

  const navigate = useCallback((screen: Screen) => {
    setStack((prev) => {
      if (prev[prev.length - 1] === screen) return prev;
      
      const newStack: Screen[] = screen === "Main" ? ["Main"] : [...prev, screen];
      
      // Push history state to enable hardware back button
      if (typeof window !== "undefined") {
         window.history.pushState({ screen }, "", `#${screen}`);
      }
      
      return newStack;
    });
  }, []);

  const goBack = useCallback(() => {
    setStack((prev) => {
      // Avoid popping history if we're programmatically going back here, 
      // but popstate already handles the window portion. 
      // This function might be called by a UI button.
      if (typeof window !== "undefined") {
         // Instead of modifying state directly, we just tell the browser to go back,
         // triggering the popstate event, which will handle the stack pop.
         // However, if we don't have history length, we fallback.
         window.history.back();
         return prev; // Let the event listener handle the state pop
      }
      return prev;
    });
  }, []);

  const resetTo = useCallback((screen: Screen) => {
    setStack([screen]);
    if (typeof window !== "undefined") {
       window.history.replaceState({ screen }, "", `#${screen}`);
    }
  }, []);

  useEffect(() => {
    // Android hardware back button / Browser back button
    const handlePopState = () => {
       setStack(prev => {
         if (prev.length <= 1) {
           return ["Main"] as Screen[];
         }
         return prev.slice(0, -1);
       });
    };
    
    // Initialize initial state
    if (typeof window !== "undefined") {
       window.history.replaceState({ screen: initialScreen }, "", `#${initialScreen}`);
       window.addEventListener("popstate", handlePopState);
    }
    
    return () => {
       if (typeof window !== "undefined") {
          window.removeEventListener("popstate", handlePopState);
       }
    };
  }, [initialScreen]);

  return {
    currentScreen,
    stack,
    navigate,
    goBack,
    resetTo
  };
}
