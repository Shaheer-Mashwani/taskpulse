const DARK = `
  --bg:#0F0F13;--surface:#1A1A24;--surface-sunken:#13131C;
  --border:#2A2A3A;--ink:#E8E8F0;--ink-soft:#8888A8;
  --brand:#818CF8;--brand-dark:#6366F1;--brand-soft:#1E1E35;--brand-mid:#A5B4FC;
  --urgent:#F87171;--urgent-bg:#2A1515;
  --moderate:#FCD34D;--moderate-bg:#2A2210;
  --easy:#34D399;--easy-bg:#0F2A1E;--danger:#F87171;
  --status-pending-bg:#2A2210;--status-pending-text:#FCD34D;--status-pending-dot:#FCD34D;
  --status-working-bg:#1E1E35;--status-working-text:#A5B4FC;--status-working-dot:#818CF8;
  --status-done-bg:#0F2A1E;--status-done-text:#34D399;--status-done-dot:#34D399;
  --shadow-sm:0 1px 3px rgba(0,0,0,0.4);
  --shadow-md:0 4px 16px rgba(0,0,0,0.5);
  --shadow-lg:0 8px 32px rgba(0,0,0,0.6);
`;

export function getSavedTheme() {
  return localStorage.getItem("theme") || "light";
}

export function applyTheme(theme) {
  let tag = document.getElementById("tp-theme");
  if (!tag) {
    tag = document.createElement("style");
    tag.id = "tp-theme";
    document.head.appendChild(tag);
  }
  tag.textContent = theme === "dark" ? `:root{${DARK}}` : "";
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}