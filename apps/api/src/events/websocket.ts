import type { Server } from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import type { WebsocketEvent } from "@vedai/shared";
import type { User } from "@vedai/shared";
import { getAssignmentForOwner } from "../db/repository.js";
import { extractToken, verifySessionToken } from "../services/authService.js";

type ClientMessage = {
  type?: string;
  assignmentId?: string;
};

const subscriptions = new Map<string, Set<WebSocket>>();

async function subscribe(socket: WebSocket, assignmentId: string, user: User) {
  const assignment = await getAssignmentForOwner(assignmentId, user.id);
  if (!assignment) {
    socket.send(JSON.stringify({
      type: "assignment.failed",
      assignmentId,
      message: "Assignment not found for this user"
    }));
    return;
  }

  const current = subscriptions.get(assignmentId) ?? new Set<WebSocket>();
  current.add(socket);
  subscriptions.set(assignmentId, current);

  const event: WebsocketEvent = {
    type: "subscribed",
    assignmentId,
    message: "Subscribed to assignment updates"
  };
  socket.send(JSON.stringify(event));
}

function cleanup(socket: WebSocket) {
  for (const [assignmentId, sockets] of subscriptions.entries()) {
    sockets.delete(socket);
    if (sockets.size === 0) subscriptions.delete(assignmentId);
  }
}

export function attachWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (socket, request) => {
    const url = new URL(request.url ?? "/ws", "http://localhost");
    const assignmentId = url.searchParams.get("assignmentId");
    let currentUser: User | null = null;

    const authenticate = async () => {
      if (currentUser) return currentUser;
      const token = extractToken({
        authorization: request.headers.authorization,
        cookie: request.headers.cookie,
        queryToken: url.searchParams.get("token") ?? undefined
      });
      currentUser = await verifySessionToken(token);
      return currentUser;
    };

    if (assignmentId) {
      authenticate()
        .then((user) => subscribe(socket, assignmentId, user))
        .catch(() => {
          socket.send(JSON.stringify({ type: "assignment.failed", assignmentId, message: "Authentication required" }));
          socket.close();
        });
    }

    socket.on("message", (payload) => {
      try {
        const message = JSON.parse(payload.toString()) as ClientMessage;
        if (message.type === "subscribe" && message.assignmentId) {
          authenticate()
            .then((user) => subscribe(socket, message.assignmentId!, user))
            .catch(() => {
              socket.send(JSON.stringify({ type: "assignment.failed", assignmentId: message.assignmentId, message: "Authentication required" }));
              socket.close();
            });
        }
      } catch {
        socket.send(JSON.stringify({ type: "error", message: "Invalid websocket payload" }));
      }
    });

    socket.on("close", () => cleanup(socket));
    socket.on("error", () => cleanup(socket));
  });

  return {
    broadcast(event: WebsocketEvent) {
      const sockets = subscriptions.get(event.assignmentId);
      if (!sockets) return;

      const payload = JSON.stringify(event);
      for (const socket of sockets) {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(payload);
        }
      }
    },
    close() {
      wss.close();
    }
  };
}
