import { useState, useEffect } from "react";

export const useTheme = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const html = document.documentElement;

    // Initial load from localStorage. Default to light if no saved preference.
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
    const initialDark = savedTheme === "dark";
    html.classList.toggle("dark", initialDark);

    // Sync state after class update (avoids direct setState in effect)
    requestAnimationFrame(() => {
      setIsDark(html.classList.contains("dark"));
    });

    // No system preference listener: user preference (or default light) is used.
    return;
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    const newIsDark = !html.classList.contains("dark");
    // Apply the new theme state to the document and persist it
    html.classList.toggle("dark", newIsDark);
    localStorage.setItem("theme", newIsDark ? "dark" : "light");
    setIsDark(newIsDark);
  };

  return { isDark, toggleTheme };
};
