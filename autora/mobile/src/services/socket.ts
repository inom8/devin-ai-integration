import { io, Socket } from "socket.io-client";

const SOCKET_URL = "http://localhost:4000/towing";

let socket: Socket | null = null;

export function connectTowingSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, { transports: ["websocket"] });
  }
  return socket;
}

export function disconnectTowingSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinRequest(requestId: string): void {
  socket?.emit("join-request", requestId);
}

export function emitLocationUpdate(requestId: string, lat: number, lng: number): void {
  socket?.emit("location-update", { requestId, lat, lng });
}

export function onLocationUpdate(callback: (data: { lat: number; lng: number; timestamp: string }) => void): void {
  socket?.on("location-update", callback);
}

export function onRequestAccepted(callback: (data: { requestId: string; providerId: string; estimatedArrival: string }) => void): void {
  socket?.on("request-accepted", callback);
}

export function onDriverEnRoute(callback: (data: { requestId: string }) => void): void {
  socket?.on("driver-en-route", callback);
}

export function onDriverArrived(callback: (data: { requestId: string }) => void): void {
  socket?.on("driver-arrived", callback);
}
