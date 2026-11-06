import {
  createToolkitAuthPlugin,
  renderAuthPage,
} from "@agent-native/toolkit/app/auth/server";

// Branding only: the framework's own AuthPage still renders (and hydrates)
// every control and the sign-in logic. We prepend one stylesheet that restyles
// it to the Unrecalled paper/ink look. It carries data-precedence so React's
// hydration skips it as a hoistable style instead of treating it as a mismatch.
const BRAND_MARK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpath d='M16 2.5l3.1 2.6 4-.6 1.5 3.8 3.8 1.5-.6 4 2.6 3.1-2.6 3.1.6 4-3.8 1.5-1.5 3.8-4-.6L16 29.5l-3.1-2.6-4 .6-1.5-3.8-3.8-1.5.6-4L1.6 16l2.6-3.1-.6-4 3.8-1.5 1.5-3.8 4 .6z' fill='%23467BEB'/%3E%3Ccircle cx='12.4' cy='14.6' r='1.7' fill='%23fff'/%3E%3Ccircle cx='19.6' cy='14.6' r='1.7' fill='%23fff'/%3E%3Cpath d='M12.6 19.4c1.9 1.6 4.9 1.6 6.8 0' stroke='%23fff' stroke-width='1.6' stroke-linecap='round' fill='none'/%3E%3C/svg%3E";

const BRAND_CSS = `
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Source+Serif+4:opsz,wght@8..60,500;8..60,600&display=swap");
:root {
  --u-bg: #FDFBF6; --u-ink: #060E1E; --u-card: #FFFFFF; --u-sand: #F4EFE6;
  --u-border: #E9E2D6; --u-muted: #6E6860; --u-blue: #467BEB;
  --u-shadow: 0 1px 2px #5248460d, 0 30px 70px -28px #52484659;
  --u-btn-bg: #060E1E; --u-btn-fg: #FDFBF6;
  --u-glow: radial-gradient(50rem 26rem at 50% 108%, #F4EFE6, transparent 70%);
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  :root {
    --u-bg: #0C1018; --u-ink: #F4EFE6; --u-card: #121722; --u-sand: #1A2030;
    --u-border: #242B3A; --u-muted: #A39E95;
    --u-shadow: 0 0 0 1px #ffffff08, 0 30px 70px -28px #000000e6;
    --u-btn-bg: #F4EFE6; --u-btn-fg: #060E1E;
    --u-glow: radial-gradient(60rem 30rem at 50% -10%, #467BEB1f, transparent 70%);
    color-scheme: dark;
  }
}
html body {
  background: var(--u-glow), var(--u-bg);
  color: var(--u-ink);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
}
html body .auth-wave-background { display: none !important; }
html body .auth-page-content::before {
  content: "Unrecalled";
  position: fixed; top: max(1.25rem, env(safe-area-inset-top)); left: max(1.5rem, env(safe-area-inset-left));
  display: flex; align-items: center; gap: .55rem; height: 2rem; padding-left: 2.35rem;
  background: url("${BRAND_MARK}") left center / 1.85rem no-repeat;
  font-family: "Source Serif 4", Georgia, serif; font-size: 1.3rem; font-weight: 600; letter-spacing: -.02em;
  color: var(--u-ink);
}
html body .locale-trigger { color: var(--u-muted); border-radius: 999px; }
html body .locale-trigger:hover { color: var(--u-ink); background: var(--u-sand); }
html body .locale-menu { background: var(--u-card); border-color: var(--u-border); box-shadow: var(--u-shadow); border-radius: 14px; }
html body .locale-menu-item { color: var(--u-muted); border-radius: 9px; }
html body .locale-menu-item:hover, html body .locale-menu-item:focus,
html body .locale-menu-item[aria-checked="true"] { background: var(--u-sand); color: var(--u-ink); }
html body .locale-menu-check { color: var(--u-blue); }

html body .card {
  width: min(27rem, 100%);
  padding: 2.5rem 2.25rem 2rem;
  background: var(--u-card);
  border: 1px solid var(--u-border);
  border-radius: 1.5rem;
  box-shadow: var(--u-shadow);
  animation: u-rise .7s cubic-bezier(.22,1,.36,1) both;
}
@keyframes u-rise { from { opacity: 0; transform: translateY(10px); } }
@media (prefers-reduced-motion: reduce) { html body .card { animation: none; } }
html body .card::before {
  content: ""; display: block; width: 3rem; height: 3rem; margin: 0 auto 1.25rem;
  border-radius: 1rem; border: 1px solid var(--u-border);
  background: url("${BRAND_MARK}") center / 1.9rem no-repeat, var(--u-bg);
}
html body .card > h1#heading {
  font-size: 0; line-height: 0; margin: 0; text-align: center;
}
html body .card > h1#heading::after {
  content: "Find the car defects nobody is fixing.";
  display: block;
  font-family: "Source Serif 4", Georgia, serif;
  font-size: 2.125rem; line-height: 1.06; font-weight: 560; letter-spacing: -.035em;
  color: var(--u-ink); text-wrap: balance;
}
html body .card > h1#heading + .subtitle,
html body .local-dev-available .card > h1#heading + .subtitle {
  display: block !important;
  font-size: 0; margin: .9rem 0 1.6rem; text-align: center;
}
html body .card > h1#heading + .subtitle::after {
  content: "Owners report problems to NHTSA every day. Unrecalled finds the ones no recall covers, and helps you ask for an investigation.";
  font-size: .95rem; line-height: 1.55; color: var(--u-muted); text-wrap: pretty;
}
html body .card button[type="submit"], html body .card .btn-primary {
  min-height: 2.875rem; border-radius: 999px; border: 0;
  background: var(--u-btn-bg); color: var(--u-btn-fg);
  font-family: inherit; font-size: .95rem; font-weight: 600; letter-spacing: -.01em;
  box-shadow: 0 1px 2px #0000001f, 0 10px 24px -14px #060e1e99;
  transition: transform .18s cubic-bezier(.22,1,.36,1), opacity .18s ease;
}
html body .card button[type="submit"]:hover, html body .card .btn-primary:hover { opacity: .92; transform: translateY(-1px); }
html body .card .btn-local-dev::after { content: "  →"; }
html body .local-dev-description { color: var(--u-muted); justify-content: center; margin-top: .75rem; }
html body .local-dev-help { color: var(--u-muted); border-color: var(--u-border); }
html body .local-dev-full-options, html body .link-button, html body .auth-mode-link {
  color: var(--u-muted); text-decoration-color: var(--u-border); text-underline-offset: 3px;
}
html body .local-dev-full-options { display: block; margin: 1.1rem auto 0; }
html body .local-dev-full-options[hidden] { display: none; }
html body .local-dev-full-options:hover, html body .link-button:hover { color: var(--u-ink); }
html body .tabs { background: var(--u-sand); border: 0; border-radius: 999px; padding: 4px; }
html body .tab { color: var(--u-muted); border-radius: 999px; }
html body .tab.active { background: var(--u-card); color: var(--u-ink); box-shadow: 0 1px 2px #0000001a; }
html body .card label { color: var(--u-muted); }
html body .card input {
  background: var(--u-bg); color: var(--u-ink); border: 1px solid var(--u-border); border-radius: .75rem;
}
html body .card input::placeholder { color: color-mix(in srgb, var(--u-muted) 70%, transparent); }
html body .card input:focus { outline: none; border-color: var(--u-blue); box-shadow: 0 0 0 4px color-mix(in srgb, var(--u-blue) 16%, transparent); }
html body .divider { color: var(--u-muted); }
html body .divider::before, html body .divider::after { background: var(--u-border); }
html body .btn-google, html body .btn-secondary {
  background: var(--u-card); color: var(--u-ink); border: 1px solid var(--u-border); border-radius: 999px;
}
html body .legal-note, html body .legal-note a { color: var(--u-muted); }
html body .environment-badge { background: var(--u-card); color: var(--u-muted); border-color: var(--u-border); }
@media (max-width: 30rem) {
  html body .card { padding: 2rem 1.35rem 1.5rem; border-radius: 1.25rem; }
  html body .card > h1#heading::after { font-size: 1.85rem; }
  html body .auth-page-content::before { font-size: 1.15rem; }
}
`;

export default createToolkitAuthPlugin({
  workspaceAppPublicPaths: ["/"],
  rootAuth: true,
  marketing: false,
  renderSignInPage: (props) =>
    `<style data-href="unrecalled-auth-brand" data-precedence="unrecalled">${BRAND_CSS}</style>` +
    renderAuthPage(props),
});
