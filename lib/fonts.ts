const SYSTEM_FONTS = new Set([
  "arial",
  "helvetica",
  "georgia",
  "times",
  "times new roman",
  "courier",
  "system-ui",
  "ui-sans-serif",
  "ui-serif",
  "sans-serif",
  "serif",
  "monospace",
  "inherit",
]);

export function googleFontStylesheetUrl(families: string[]) {
  const unique = [...new Set(families.map((name) => name.trim()).filter(Boolean))];
  const google = unique.filter(
    (name) => !SYSTEM_FONTS.has(name.toLowerCase()),
  );
  if (!google.length) return "";
  const query = google
    .map(
      (name) =>
        `family=${encodeURIComponent(name).replace(/%20/g, "+")}:ital,wght@0,400;0,500;0,600;0,700;1,400`,
    )
    .join("&");
  return `https://fonts.googleapis.com/css2?${query}&display=swap`;
}
