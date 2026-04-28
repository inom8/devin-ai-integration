import { Server as SocketIOServer } from "socket.io";

export function setupSocket(io: SocketIOServer): void {
  const towingNamespace = io.of("/towing");

  towingNamespace.on("connection", (socket) => {
    console.log(`Towing client connected: ${socket.id}`);

    socket.on("join-request", (requestId: string) => {
      socket.join(`request-${requestId}`);
      console.log(`Socket ${socket.id} joined request-${requestId}`);
    });

    socket.on("location-update", (data: { requestId: string; lat: number; lng: number }) => {
      towingNamespace
        .to(`request-${data.requestId}`)
        .emit("location-update", {
          lat: data.lat,
          lng: data.lng,
          timestamp: new Date().toISOString(),
        });
    });

    socket.on("request-accepted", (data: { requestId: string; providerId: string; estimatedArrival: string }) => {
      towingNamespace
        .to(`request-${data.requestId}`)
        .emit("request-accepted", data);
    });

    socket.on("driver-en-route", (data: { requestId: string }) => {
      towingNamespace
        .to(`request-${data.requestId}`)
        .emit("driver-en-route", { requestId: data.requestId });
    });

    socket.on("driver-arrived", (data: { requestId: string }) => {
      towingNamespace
        .to(`request-${data.requestId}`)
        .emit("driver-arrived", { requestId: data.requestId });
    });

    socket.on("disconnect", () => {
      console.log(`Towing client disconnected: ${socket.id}`);
    });
  });
}
