// Placeholder bootstrap — replaced by the real app shell in a later step.
const app = document.querySelector<HTMLDivElement>("#app");
if (app) {
  app.textContent = "QR Code Online — scaffolding…";
  fetch("/api/ping")
    .then((r) => r.json())
    .then((d) => {
      app.textContent = `QR Code Online — API says: ${JSON.stringify(d)}`;
    })
    .catch(() => {
      app.textContent = "QR Code Online — (API not reachable in this context)";
    });
}
