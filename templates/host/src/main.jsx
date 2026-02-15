import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
// Load remote styles
(async function() {
  try {
    const response = await fetch('http://localhost:3001/src/styles.css');
    const css = await response.text();
    // Extract the actual CSS from the JS module
    const cssMatch = css.match(/const __vite__css = "([^"]*)"/);  
    if (cssMatch) {
      const style = document.createElement('style');
      style.textContent = JSON.parse('"' + cssMatch[1].replace(/\\"/g, '\\"') + '"');
      document.head.appendChild(style);
    }
  } catch (e) {
    console.warn('Failed to load remote styles:', e);
  }
})()
createRoot(document.getElementById("root")).render(<App />);
