import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ChatWidget } from "./ChatWidget";
import "./styles.css";

function DemoPage() {
  return (
    <>
      <main className="demo-shell">
        <div className="badge">Pragma Flow · Feature 1 · Neo Logistics</div>
        <h1>Neo Assist demo</h1>
        <p>
          Native AI Customs & Shipment Assistant for{" "}
          <strong>Neo Logistics</strong> (neologistics.org). Open the chat in the corner —
          answers are grounded in Neo’s knowledge base with guardrails, DPDP consent, and
          sales lead alerts for serious / huge enquiries.
        </p>
        <p>
          Try: “What services does Neo offer at Cochin?”, “Do you have AEO-LO?”, “We need to
          import 40 TEU of steel coils from Mundra to Kochi — quote please.”
        </p>
      </main>
      <ChatWidget />
    </>
  );
}

/** Local demo only — production sites use neo-assist.js (see src/embed.tsx). */
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DemoPage />
  </StrictMode>
);
