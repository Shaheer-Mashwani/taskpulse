function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}

// Initialize on module load
const savedTheme = localStorage.getItem("theme") || "light";
applyTheme(savedTheme);

export function useTheme() {
  const getTheme = () => localStorage.getItem("theme") || "light";

  const toggleTheme = () => {
    const current = getTheme();
    const next = current === "light" ? "dark" : "light";
    applyTheme(next);
    // Force re-render across all components listening
    window.dispatchEvent(new CustomEvent("themechange", { detail: next }));
  };

  return {
    theme: getTheme(),
    toggleTheme,
  };
}