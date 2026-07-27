import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ChatWidget } from "./ChatWidget";
import "./styles.css";
import "./ChatWidget.css";

/**
 * Production drop-in embed.
 * Django / any site:
 *
 *   <link rel="stylesheet" href="https://YOUR-API/widget/neo-assist.css" />
 *   <script
 *     src="https://YOUR-API/widget/neo-assist.js"
 *     data-api-base="https://YOUR-API"
 *     defer
 *   ></script>
 *
 * Optional: <div id="neo-assist-mount"></div> — otherwise a mount node is created.
 */
function resolveScript(): HTMLScriptElement | null {
  const byId = document.getElementById("neo-assist-loader");
  if (byId instanceof HTMLScriptElement) return byId;
  const scripts = Array.from(document.scripts);
  return (
    scripts.find((s) => s.src.includes("neo-assist") || s.hasAttribute("data-api-base")) ?? null
  );
}

function boot() {
  const script = resolveScript();
  const apiBase =
    script?.getAttribute("data-api-base") ||
    script?.dataset.apiBase ||
    (window as unknown as { NEO_ASSIST_API_BASE?: string }).NEO_ASSIST_API_BASE ||
    "";

  let mount = document.getElementById("neo-assist-mount");
  if (!mount) {
    mount = document.createElement("div");
    mount.id = "neo-assist-mount";
    document.body.appendChild(mount);
  }

  createRoot(mount).render(
    <StrictMode>
      <ChatWidget apiBase={apiBase} />
    </StrictMode>
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
