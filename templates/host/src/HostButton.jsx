import React from "react";

export default function HostButton({ children, onClick }) {
  return (
    <button className="host-button" onClick={onClick}>
      {children || "Host Button"}
    </button>
  );
}
