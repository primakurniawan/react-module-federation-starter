import React from "react";

function _ensureRemoteStyles() {
  if (typeof document === 'undefined') return;
  try {
    const href = new URL('./styles.css', import.meta.url).href;
    if (document.querySelector(`link[href="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  } catch (e) {
    // ignore in non-browser environments
  }
}

_ensureRemoteStyles();

export default function Button({ children, onClick }) {
  return (
    <button className="remote-button" onClick={onClick}>
      {children || "Remote Button"}
    </button>
  );
}
