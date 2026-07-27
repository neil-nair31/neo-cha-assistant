/**
 * Quick API smoke for Neo Client Portal.
 */
const base = process.env.PORTAL_URL || "http://localhost:8792/api";

async function main() {
  const health = await fetch(`${base}/health`).then((r) => r.json());
  console.log("health", health.ok, "shipments", health.shipments);

  const track = await fetch(`${base}/track?q=MSCU7845123`).then((r) => r.json());
  console.log("track", track.count, track.results?.[0]?.ref, track.results?.[0]?.statusLabel);

  const login = await fetch(`${base}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "import@pearlchem.demo", password: "neo-demo" }),
  }).then((r) => r.json());
  if (!login.token) throw new Error("login failed: " + JSON.stringify(login));
  console.log("login", login.client.company);

  const list = await fetch(`${base}/shipments`, {
    headers: { Authorization: `Bearer ${login.token}` },
  }).then((r) => r.json());
  console.log("shipments", list.count, "alerts", list.alerts?.length, "attention", list.summary?.needsAttention);

  const first = list.shipments?.[0];
  if (first) {
    const detail = await fetch(`${base}/shipments/${first.id}`, {
      headers: { Authorization: `Bearer ${login.token}` },
    }).then((r) => r.json());
    console.log("detail", detail.shipment?.ref, "milestones", detail.shipment?.milestones?.length);
  }

  console.log("SMOKE OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
