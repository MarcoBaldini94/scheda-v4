import React from "react";
import { createRoot } from "react-dom/client";
import App from "./app.jsx";

createRoot(document.getElementById("root")).render(<App />);

/* Service worker: offline + avviso di aggiornamento */
if ("serviceWorker" in navigator && location.protocol === "https:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then((reg) => {
        const signal = (worker) => {
          window.__schedaUpdateReady = true;
          window.__schedaApplyUpdate = () => worker.postMessage("SKIP_WAITING");
          window.dispatchEvent(new Event("scheda-update-ready"));
        };
        if (reg.waiting && navigator.serviceWorker.controller) signal(reg.waiting);
        reg.addEventListener("updatefound", () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener("statechange", () => {
            if (nw.state === "installed" && navigator.serviceWorker.controller) signal(nw);
          });
        });
      })
      .catch(() => {});
    let reloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloading) return;
      reloading = true;
      location.reload();
    });
  });
}
