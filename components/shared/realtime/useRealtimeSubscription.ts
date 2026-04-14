"use client";

import { useEffect, useRef } from "react";
import { getRealtimeSocket } from "@/components/shared/realtime/realtimeClient";

type UseRealtimeSubscriptionArgs = {
  token: string | null;
  events: string[];
  onEvent: () => void | Promise<void>;
  enabled?: boolean;
};

export function useRealtimeSubscription({
  token,
  events,
  onEvent,
  enabled = true,
}: UseRealtimeSubscriptionArgs) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled || !token || events.length === 0) return;
    const socket = getRealtimeSocket(token);
    if (!socket) return;

    const handler = () => {
      void onEventRef.current();
    };

    events.forEach((eventName) => socket.on(eventName, handler));
    return () => {
      events.forEach((eventName) => socket.off(eventName, handler));
    };
  }, [enabled, events, token]);
}

