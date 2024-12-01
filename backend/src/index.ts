import { WebSocketServer, WebSocket, RawData } from "ws";

// Define the structure of the nested map
type RoomMap = Map<string, WebSocket>; // Maps clientId to WebSocket
const allSocket: Map<string, RoomMap> = new Map(); // Maps roomId to RoomMap
const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (socket) => {
  console.log("Client connected");
  let roomId: string | null = null;
  const clientId = Math.random().toString(36).substring(2, 9);

  socket.on("message", (msg: RawData) => {
    try {
      const parsedMsg = JSON.parse(msg.toString());
      console.log("parsedMsg: ", parsedMsg);
      if (parsedMsg.type === "join") {
        roomId = parsedMsg.payload.roomId || null;
        if (!roomId) {
          console.error("Room ID is missing in join message");
          return;
        }
        console.log("user joining room: " + roomId);
        if (!allSocket.has(roomId)) {
          allSocket.set(roomId, new Map());
        }
        allSocket.get(roomId)!.set(clientId, socket);
      } else if (parsedMsg.type === "chat") {
        if (!roomId) {
          console.error("Room ID is missing in chat message");
          return;
        }
        console.log("user sending message: " + parsedMsg.payload.message);
        const roomClients = allSocket.get(roomId);
        if (!roomClients) {
          console.error("Room does not exist");
          return;
        }
        roomClients.forEach((clientSocket, id) => {
          if (clientSocket !== socket) {
            clientSocket.send(parsedMsg.payload.message || "");
          }
        });
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  socket.on("close", () => {
    console.log(`Client disconnected: ${clientId}`);
    // Remove the client from the room
    if (roomId && allSocket.has(roomId)) {
      const roomClients = allSocket.get(roomId);
      roomClients?.delete(clientId);

      // If the room is empty, delete the room
      if (roomClients && roomClients.size === 0) {
        allSocket.delete(roomId);
      }
    }
  });
});
