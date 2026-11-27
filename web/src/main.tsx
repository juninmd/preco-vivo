import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@juninmd/sonido/styles.css";
import "./index.css";
import "./components.css";
import "./sonido.css";
import App from "./App.tsx";

// O Sonido escolhe a pele por data-theme; o app segue o tema do sistema.
const dark = window.matchMedia("(prefers-color-scheme: dark)");
const applyTheme = () => {
  document.documentElement.dataset.theme = dark.matches ? "dark" : "light";
};
applyTheme();
dark.addEventListener("change", applyTheme);

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
