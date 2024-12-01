import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export default function ChatApp() {
  const [roomId, setRoomId] = useState("");
  const [joinedRoom, setJoinedRoom] = useState(false);
  const [messages, setMessages] = useState<{ text: string; isSent: boolean }[]>(
    []
  );
  const [inputValue, setInputValue] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);

  // WebSocket setup
  useEffect(() => {
    if (!joinedRoom || !roomId) return;

    const ws: WebSocket = new WebSocket("ws://localhost:8080");
    ws.onmessage = (event) => {
      setMessages((m) => [...m, { text: event.data, isSent: false }]);
    };

    wsRef.current = ws;
    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "join",
          payload: { roomId },
        })
      );
    };

    return () => {
      ws.close();
    };
  }, [joinedRoom, roomId]);

  // Event handlers
  const handleRoomInputChange = (e: ChangeEvent<HTMLInputElement>) =>
    setRoomId(e.target.value);

  const joinRoom = () => {
    if (roomId.trim() !== "") {
      setJoinedRoom(true);
    }
  };

  const handleInputValue = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    adjustTextareaHeight();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const sendMessage = () => {
    if (inputValue.trim() !== "") {
      wsRef.current?.send(
        JSON.stringify({
          type: "chat",
          payload: { message: inputValue },
        })
      );
      setMessages((m) => [...m, { text: inputValue, isSent: true }]);
      setInputValue("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTo({
        top: messageListRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  // Render
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100">
      {!joinedRoom ? (
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-2xl font-bold mb-4">Join a Chat Room</h1>
          <Input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={handleRoomInputChange}
            onKeyDown={(e) => e.key === "Enter" && joinRoom()}
            className="mb-4 w-1/2"
          />
          <Button
            onClick={joinRoom}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            Join Room
          </Button>
        </div>
      ) : (
        <>
          <header className="bg-gray-800 shadow-md p-4">
            <h1 className="text-xl font-bold text-gray-100">
              Chat Room: {roomId}
            </h1>
          </header>
          <main className="flex-1 flex flex-col overflow-auto">
            <div
              ref={messageListRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.isSent ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[75%] p-3 rounded-lg break-words whitespace-pre-wrap ${
                      msg.isSent
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-100"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-gray-800 p-4 flex items-end space-x-2">
              <Textarea
                ref={textareaRef}
                placeholder="Type a message..."
                className="flex-1 bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 resize-none min-h-[40px] max-h-[200px] overflow-y-auto"
                value={inputValue}
                onChange={handleInputValue}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <Button
                onClick={sendMessage}
                className="bg-blue-600 text-white hover:bg-blue-700 h-[100%]"
              >
                <Send size={20} />
                <span>Send</span>
              </Button>
            </div>
          </main>
        </>
      )}
    </div>
  );
}
