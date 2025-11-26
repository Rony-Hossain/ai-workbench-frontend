export const LANG_MAP: Record<string, string> = {
  // Scripts
  py: "python", ps1: "powershell", psm1: "powershell",
  sh: "shell", bash: "shell", zsh: "shell", env: "shell",
  
  // Web
  js: "javascript", mjs: "javascript", cjs: "javascript",
  ts: "typescript", tsx: "typescript", jsx: "javascript",
  html: "html", htm: "html",
  css: "css", scss: "scss", sass: "scss", less: "less",
  
  // Data / Config
  json: "json", ipynb: "json",
  yml: "yaml", yaml: "yaml", toml: "toml",
  ini: "ini", cfg: "ini", 
  dockerfile: "dockerfile", 
  gitignore: "gitignore",
  
  // Docs
  md: "markdown", txt: "text"
};

export const DEFAULT_EXTS = new Set([
  "py", "js", "ts", "jsx", "tsx", "cjs", "mjs",
  "json", "yaml", "yml", "toml", "env",
  "html", "htm", "css", "scss", "sass", "less",
  "sh", "bash", "ps1", "psm1", "dockerfile", "gitignore", "md"
]);

export function getLanguageFromFilename(filename: string): string {
  const lower = filename.toLowerCase();
  
  // Handle exact matches
  if (lower === 'dockerfile') return 'dockerfile';
  if (lower === '.gitignore') return 'gitignore';
  if (lower.startsWith('.env')) return 'shell';

  // Handle extensions
  const ext = lower.split('.').pop() || '';
  return LANG_MAP[ext] || 'plaintext';
}