import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function ChatApp() {
  const [messages, setMessages] = useState<{ text: string; isSent: boolean }[]>(
    []
  );
  const [inputValue, setInputValue] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ws: WebSocket = new WebSocket("ws://localhost:8080");
    ws.onmessage = (event) => {
      setMessages((m) => [...m, { text: event.data, isSent: false }]);
    };

    wsRef.current = ws;
    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "join",
          payload: {
            roomId: "red",
          },
        })
      );
    };
    return () => {
      ws.close();
    };
  }, []);

  const handleInputValue = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    adjustTextareaHeight();
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const sendMessage = () => {
    if (inputValue.trim() !== "") {
      wsRef.current?.send(
        JSON.stringify({
          type: "chat",
          payload: {
            message: inputValue,
          },
        })
      );
      setMessages((m) => [...m, { text: inputValue, isSent: true }]);
      setInputValue("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const messageListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTo({
        top: messageListRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100">
      <header className="bg-gray-800 shadow-md p-4">
        <h1 className="text-xl font-bold text-gray-100">Chat Room</h1>
      </header>
      <main className="flex-1 flex flex-col overflow-auto">
        <div
          ref={messageListRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.isSent ? "justify-end" : "justify-start"}`}
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
            <span >Send message</span>
          </Button>
        </div>
      </main>
    </div>
  );
}
