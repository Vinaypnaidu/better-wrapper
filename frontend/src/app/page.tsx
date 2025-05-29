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

function ChevronDownIcon({ className = "" }: { className?: string }) {
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
        d="M6 9L12 15L18 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Type definitions
type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

type Conversation = {
  id: string;
  title: string;
  summary?: string | null;
  created_at: string;
  updated_at: string;
  messages?: Message[];
};

type ConversationDetail = {
  id: string;
  title: string;
  summary?: string | null;
  messages: Message[];
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [visibleConversations, setVisibleConversations] = useState<number>(5);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Check for mobile size on resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };

    checkMobile(); // Check on initial load
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Fetch conversations on first load
  useEffect(() => {
    fetchConversations();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Fetch conversation list
  const fetchConversations = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/conversations/");
      const data = await res.json();

      // Get detailed data for each conversation to access first message
      const detailedConversations = await Promise.all(
        data.conversations.map(async (conv: Conversation) => {
          try {
            const detailRes = await fetch(`http://localhost:8000/api/conversations/${conv.id}`);
            const detailData = await detailRes.json();
            return {
              ...conv,
              messages: detailData.messages
            };
          } catch (err) {
            // If fetching details fails, return the conversation without messages
            return conv;
          }
        })
      );

      setConversations(detailedConversations);
    } catch (err) {
      console.error("Error fetching conversations:", err);
    }
  };

  // Load a specific conversation
  const loadConversation = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:8000/api/conversations/${id}`);
      const data: ConversationDetail = await res.json();

      // Filter out system messages for display
      const displayMessages = data.messages.filter(msg => msg.role !== "system");

      // Set the filtered conversation messages
      setMessages(displayMessages);
      setConversationId(data.id);

      // On mobile, close the sidebar after selecting a conversation
      if (isMobile) {
        setSidebarOpen(false);
      }
    } catch (err) {
      console.error("Error loading conversation:", err);
    } finally {
      setLoading(false);
    }
  };

  // Start a new conversation
  const startNewConversation = async () => {
    try {
      // Clear current messages and conversation ID
      setMessages([]);
      setConversationId(null);

      // Create a new conversation
      const res = await fetch("http://localhost:8000/api/conversations/", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      const data = await res.json();
      setConversationId(data.id);

      // Refresh the conversation list
      fetchConversations();

      // On mobile, close the sidebar after creating a new conversation
      if (isMobile) {
        setSidebarOpen(false);
      }
    } catch (err) {
      console.error("Error creating new conversation:", err);
    }
  };

  // Load more conversations
  const loadMoreConversations = () => {
    setVisibleConversations(prev => prev + 5);
  };

  // Send a message
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = { role: "user", content: input };
    setMessages(msgs => [...msgs, userMsg]);
    setLoading(true);
    setInput("");

    try {
      const res = await fetch("http://localhost:8000/api/chat/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          conversation_id: conversationId
        }),
      });

      const data = await res.json();
      setMessages(msgs => [...msgs, { role: "assistant", content: data.reply }]);

      // Store the conversation ID from the response
      setConversationId(data.conversation_id);

      // Refresh conversations list to show the new/updated conversation
      fetchConversations();
    } catch (err) {
      setMessages(msgs => [...msgs, { role: "assistant", content: "Error: Could not connect to backend." }]);
    } finally {
      setLoading(false);
    }
  };

  // Format conversation title to show first user message (max 5 words)
  const formatTitle = (title: string, messages?: Message[]): string => {
    // If we have messages and this is just a default title, use the first user message instead
    if (messages && messages.length > 0 && (title === "New Conversation" || !title)) {
      // Find the first user message (skip system messages)
      const userMessages = messages.filter(m => m.role === "user");
      const firstUserMessage = userMessages.length > 0 ? userMessages[0].content : "";

      // Limit to 5 words
      const words = firstUserMessage.split(' ');
      const shortTitle = words.slice(0, 5).join(' ');

      // Add ellipsis if truncated
      return words.length > 5 ? `${shortTitle}...` : shortTitle;
    }

    // Fallback to regular title formatting
    return title.length > 30 ? title.substring(0, 27) + "..." : title;
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen w-full bg-[#202123] flex font-sans transition-colors duration-300 overflow-hidden">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed md:relative z-20 w-64 h-screen bg-[#1a1b1e] border-r border-gray-800 transition-transform duration-200 md:translate-x-0 flex flex-col`}
      >
        {/* New Chat Button */}
        <div className="p-4 border-b border-gray-800 flex-shrink-0">
          <button
            onClick={startNewConversation}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#2a2b32] hover:bg-[#343541] text-white rounded-lg transition-colors"
          >
            <PlusIcon />
            <span>New Chat</span>
          </button>
        </div>

        {/* Recent Chats - Independent scrollable area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-4">
            <h2 className="text-white text-sm font-medium mb-3">Recent Chats</h2>
            <div className="space-y-2">
              {conversations.slice(0, visibleConversations).map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => loadConversation(conv.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    conversationId === conv.id
                      ? 'bg-[#343541] text-white'
                      : 'text-gray-300 hover:bg-[#2a2b32]'
                  }`}
                >
                  <div className="text-sm font-medium truncate">
                    {formatTitle(conv.title, conv.messages)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatDate(conv.created_at)}
                  </div>
                </button>
              ))}

              {conversations.length > visibleConversations && (
                <button
                  onClick={loadMoreConversations}
                  className="w-full text-center py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Load More
                  <ChevronDownIcon className="ml-1 inline" />
                </button>
              )}

              {conversations.length === 0 && (
                <div className="text-center py-4 text-gray-400 text-sm">
                  No conversations yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Toggle */}
      {isMobile && (
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed top-4 left-4 z-30 p-2 bg-[#2a2b32] rounded-md text-white"
        >
          {sidebarOpen ? "✕" : "☰"}
        </button>
      )}

      {/* Main Content - Independent scrollable area */}
      <div className={`flex-1 flex flex-col h-screen overflow-hidden ${isMobile && sidebarOpen ? 'opacity-50' : ''}`}>
        {/* Initial state - show centered card */}
        {messages.length === 0 && !loading ? (
          <div className="h-full w-full flex flex-col items-center justify-center px-4">
            <form
              onSubmit={handleSubmit}
              className="w-full max-w-3xl flex flex-col items-center"
            >
              <h1 className="text-4xl font-semibold text-white mb-12 text-center">What can I help with?</h1>
              <div className="w-full bg-[#2a2b32] rounded-3xl shadow-xl px-4 py-4 flex items-center gap-3">
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
        ) : (
          // Full chat interface after first message
          <>
            {/* Messages area - scrollable */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 pt-10 px-4 sm:px-0 pb-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {/* Only render non-system messages */}
                    {msg.role !== "system" && (
                      <div
                        className={`px-6 py-4 rounded-3xl max-w-[80%] break-words text-lg shadow-md transition-all duration-200 ${
                          msg.role === "user"
                            ? "bg-[#40414f] text-white rounded-br-2xl"
                            : "bg-[#343541] text-gray-100 rounded-bl-2xl"
                        }`}
                      >
                        {msg.content}
                      </div>
                    )}
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
            
            {/* Input form - fixed at bottom */}
            <div className="flex-shrink-0 bg-gradient-to-t from-[#202123] via-[#202123]/80 to-transparent pt-8 pb-4 px-4">
              <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
                <div className="bg-[#2a2b32] rounded-3xl shadow-xl px-4 py-4 flex items-center gap-3">
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
          </>
        )}
      </div>
    </div>
  );
}