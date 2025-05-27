"use client";
import { useState, useRef, useEffect } from "react";

function SendIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      height="24"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 20L20 12L4 4V10L16 12L4 14V20Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PlusIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      height="20"
      viewBox="0 0 24 24"
      width="20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 5V19M5 12H19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ToolsIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      height="16"
      viewBox="0 0 24 24"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 6H21M3 12H21M3 18H21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MicrophoneIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      height="20"
      viewBox="0 0 24 24"
      width="20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 1C10.34 1 9 2.34 9 4V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V4C15 2.34 13.66 1 12 1ZM19 10V12C19 16.42 15.42 20 11 20H13C17.42 20 21 16.42 21 12V10H19ZM5 10V12C5 16.42 8.58 20 13 20H11C6.58 20 3 16.42 3 12V10H5Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function Home() {
  const [messages, setMessages] = useState<{ role: "user" | "bot"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = { role: "user" as const, content: input };
    setMessages((msgs) => [...msgs, userMsg]);
    setLoading(true);
    setInput("");
    try {
      const res = await fetch("http://localhost:8000/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      setMessages((msgs) => [...msgs, { role: "bot", content: data.reply }]);
    } catch (err) {
      setMessages((msgs) => [...msgs, { role: "bot", content: "Error: Could not connect to backend." }]);
    } finally {
      setLoading(false);
    }
  };

  // Initial state: show only the centered card
  if (messages.length === 0 && !loading) {
    return (
      <div className="min-h-screen w-full bg-[#202123] flex flex-col items-center justify-center font-sans transition-colors duration-300">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-3xl flex flex-col items-center px-4"
        >
          <h1 className="text-4xl font-semibold text-white mb-12 text-center">What can I help with?</h1>
          <div className="w-full bg-[#2a2b32] rounded-3xl shadow-xl px-4 py-4 flex items-center gap-3">
            {/* <button
              type="button"
              className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-white transition-colors"
            >
              <PlusIcon />
            </button> */}
            {/* <button
              type="button"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors px-2 py-1"
            >
              <ToolsIcon />
              <span className="text-sm font-medium">Tools</span>
            </button> */}
            <input
              className="flex-1 bg-transparent outline-none border-none text-xl text-white placeholder-gray-400 py-3 px-2"
              type="text"
              placeholder="Ask anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              autoFocus
            />
            {/* <button
              type="button"
              className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-white transition-colors"
            >
              <MicrophoneIcon />
            </button> */}
            <button
              type="submit"
              className="ml-2 w-10 h-10 flex items-center justify-center rounded-full bg-white text-black hover:bg-gray-200 disabled:opacity-50 transition"
              disabled={loading || !input.trim()}
              aria-label="Send"
            >
              <SendIcon className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Full chat interface after first message
  return (
    <div className="min-h-screen w-full bg-[#202123] flex flex-col font-sans transition-colors duration-300">
      <div className="flex-1 w-full flex flex-col items-center justify-between pb-32">
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 pt-10 px-2 sm:px-0">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`px-6 py-4 rounded-3xl max-w-[80%] break-words text-lg shadow-md transition-all duration-200 ${
                  msg.role === "user"
                    ? "bg-[#40414f] text-white rounded-br-2xl"
                    : "bg-[#343541] text-gray-100 rounded-bl-2xl"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="px-6 py-4 rounded-3xl max-w-[80%] break-words text-lg bg-[#343541] text-gray-100 animate-pulse rounded-bl-2xl">
                ...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <form
        onSubmit={handleSubmit}
        className="fixed bottom-0 left-0 w-full flex justify-center bg-gradient-to-t from-[#202123] via-[#202123]/80 to-transparent pt-8 pb-4 px-4 z-10"
      >
        <div className="w-full max-w-3xl bg-[#2a2b32] rounded-3xl shadow-xl px-4 py-4 flex items-center gap-3">
          <input
            className="flex-1 bg-transparent outline-none border-none text-xl text-white placeholder-gray-400 py-3 px-2"
            type="text"
            placeholder="Ask anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            autoFocus
          />
          <button
            type="submit"
            className="ml-2 w-10 h-10 flex items-center justify-center rounded-full bg-white text-black hover:bg-gray-200 disabled:opacity-50 transition"
            disabled={loading || !input.trim()}
            aria-label="Send"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}