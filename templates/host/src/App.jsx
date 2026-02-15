import React from "react";
import HostButton from "./HostButton";
import HostModal from "./HostModal";
import "./styles.css";

const RemoteButton = React.lazy(() => import("remote/Button"));
const RemoteModal = React.lazy(() => import("remote/Modal"));

export default function App() {
  const [openHost, setOpenHost] = React.useState(false);
  const [openRemote, setOpenRemote] = React.useState(false);
  return (
    <div className="container">
      <h1>Host App</h1>
      <p>This host consumes components from the remote app.</p>

      <div className="row">
        <div>
          <h4>Local (host)</h4>
          <HostButton onClick={() => setOpenHost(true)}>Open Host Modal</HostButton>
          <HostModal open={openHost} onClose={() => setOpenHost(false)} source="host" />
        </div>

        <div>
          <h4>Remote (federated)</h4>
          <React.Suspense fallback={<div>Loading remote button...</div>}>
            <RemoteButton onClick={() => setOpenRemote(true)}>Open Remote Modal</RemoteButton>
          </React.Suspense>
          <React.Suspense fallback={null}>
            <RemoteModal open={openRemote} onClose={() => setOpenRemote(false)} source="remote (federated)" />
          </React.Suspense>
        </div>
      </div>
    </div>
  );
}
