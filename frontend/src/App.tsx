import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
function App() {
  const [message, setMessage] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const wsRef = useRef<WebSocket | null>();
  useEffect(() => {
    const ws: WebSocket = new WebSocket("ws://localhost:8080");
    ws.onmessage = (event) => {
      setMessage((m) => [...m, event.data]);
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
  const handleInputValue = (e: ChangeEvent<HTMLInputElement>) =>
    setInputValue(e.target.value);

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
    setInputValue("");
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
  }, [message]);

  return (
    <div>
      <div ref={messageListRef} className="h-[95vh] bg-black p-4 overflow-auto">
        {message.map((msg) => (
          <div className="m-4">
            <span className="max-w-xs bg-blue-500 text-white p-2 rounded-lg">
              {msg}
            </span>
          </div>
        ))}
      </div>
      <div className="flex w-full bg-white p-4">
        <input
          type="text"
          placeholder="Enter text"
          className="flex-1 border border-gray-300 px-4 py-2 w-64 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          value={inputValue}
          onChange={handleInputValue}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              sendMessage();
            }
          }}
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 border border-blue-700 hover:bg-blue-600 focus:ring-2 focus:ring-blue-300"
          onClick={sendMessage}
        >
          Send Message
        </button>
      </div>
    </div>
  );
}

export default App;
