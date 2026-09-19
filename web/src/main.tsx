import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./components.css";
import App from "./App.tsx";

const root = document.getElementById("root");
if (!root) throw new Error("#root element missing from index.html");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .catch((e: Error) => console.error("service worker registration failed", e));
}
