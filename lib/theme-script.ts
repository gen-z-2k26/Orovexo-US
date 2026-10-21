/** Runs before paint to avoid light/dark flash. Must stay in sync with ThemeModeProvider STORAGE_KEY. */
export const THEME_STORAGE_KEY = "ej-color-mode";

export const themeInitScript = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var m=localStorage.getItem(k);var d=window.matchMedia("(prefers-color-scheme: dark)").matches;var r=m==="dark"||(m!=="light"&&d)?"dark":"light";var e=document.documentElement;e.classList.toggle("dark",r==="dark");e.dataset.theme=r;e.style.colorScheme=r;}catch(e){}})();`;
