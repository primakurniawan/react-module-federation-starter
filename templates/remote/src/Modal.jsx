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

export default function Modal({ open, onClose, source = "remote" }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Modal from {source}</h3>
        <p>This modal component is provided by the {source} app.</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
