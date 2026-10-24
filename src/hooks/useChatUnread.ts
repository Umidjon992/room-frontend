"use client";

import { useChat } from "@livekit/components-react";
import { useEffect, useRef, useState } from "react";

/** Number of messages from other participants received while the chat panel was closed. */
export function useChatUnread(chatOpen: boolean): number {
  const { chatMessages } = useChat();
  const seen = useRef(0);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (chatOpen) {
      seen.current = chatMessages.length;
      setUnread(0);
      return;
    }
    setUnread(chatMessages.slice(seen.current).filter((m) => !m.from?.isLocal).length);
  }, [chatMessages, chatOpen]);

  return unread;
}
