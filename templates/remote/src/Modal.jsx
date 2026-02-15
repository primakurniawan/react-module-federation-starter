import React from "react";

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
