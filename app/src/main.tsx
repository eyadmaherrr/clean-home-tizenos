import "./polyfills";
import "./styles/global.css";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { AudioManager } from "./services/audio/AudioManager";

AudioManager.init();
// Load the last position (paused) so Home shows where you left off and Play continues it.
AudioManager.restore();

createRoot(document.getElementById("root")!).render(<App />);
