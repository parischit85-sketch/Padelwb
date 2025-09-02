import React from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App.jsx";

const container = document.getElementById("root");
if (!container) {
  throw new Error('Elemento #root non trovato in index.html');
}
createRoot(container).render(<App />);
