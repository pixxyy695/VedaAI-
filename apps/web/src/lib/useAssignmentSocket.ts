"use client";

import { useEffect, useRef, useState } from "react";
import { websocketEventSchema, type AssignmentRecord } from "@vedai/shared";
import { WS_URL } from "./config";

type SocketState = "idle" | "connecting" | "connected" | "reconnecting" | "closed";

export function useAssignmentSocket(
  assignmentId: string,
  token: string | null,
  onAssignment: (assignment: AssignmentRecord) => void
) {
  const [state, setState] = useState<SocketState>("idle");
  const retryRef = useRef(0);
  const callbackRef = useRef(onAssignment);

  callbackRef.current = onAssignment;

  useEffect(() => {
    let socket: WebSocket | null = null;
    let closedByEffect = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (!token) {
        setState("closed");
        return;
      }

      setState(retryRef.current > 0 ? "reconnecting" : "connecting");
      socket = new WebSocket(`${WS_URL}?assignmentId=${assignmentId}&token=${encodeURIComponent(token)}`);

      socket.addEventListener("open", () => {
        retryRef.current = 0;
        setState("connected");
        socket?.send(JSON.stringify({ type: "subscribe", assignmentId }));
      });

      socket.addEventListener("message", (event) => {
        const parsed = websocketEventSchema.safeParse(JSON.parse(event.data));
        if (parsed.success && parsed.data.assignment) {
          callbackRef.current(parsed.data.assignment);
        }
      });

      socket.addEventListener("close", () => {
        if (closedByEffect) return;
        retryRef.current += 1;
        const timeout = Math.min(5000, 500 * retryRef.current);
        retryTimer = setTimeout(connect, timeout);
      });

      socket.addEventListener("error", () => {
        setState("reconnecting");
        socket?.close();
      });
    };

    connect();

    return () => {
      closedByEffect = true;
      if (retryTimer) clearTimeout(retryTimer);
      socket?.close();
      setState("closed");
    };
  }, [assignmentId, token]);

  return state;
}
