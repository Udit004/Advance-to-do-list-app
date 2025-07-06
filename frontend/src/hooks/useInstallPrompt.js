import { useEffect, useState } from "react";

export default function useInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState(null);

  useEffect(() => {
    const ready = (e) => {
      e.preventDefault();
      setPromptEvent(e); // Save the event for later
    };

    window.addEventListener("beforeinstallprompt", ready);
    return () => window.removeEventListener("beforeinstallprompt", ready);
  }, []);

  return promptEvent;
}
