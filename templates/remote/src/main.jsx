import React from "react";
import { createRoot } from "react-dom/client";
import Button from "./Button";
import Modal from "./Modal";
import "./styles.css";

function App() {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="container">
      <h1>Remote App</h1>
      <p>This app exposes components to hosts via Module Federation.</p>
      <Button onClick={() => setOpen(true)}>Open Remote Modal</Button>
      <Modal open={open} onClose={() => setOpen(false)} source="remote" />
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
