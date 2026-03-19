import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageCircle, Loader2, RotateCcw, User } from "lucide-react";

export default function ChatPreview({ client, products, backendUrl }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const productsInfo = (products || [])
    .filter((p) => p.available)
    .map((p) => `- ${p.name}: ${p.price?.toLocaleString()} XAF — ${p.description} (Stock: ${p.stock})`)
    .join("\n");

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const customerMsg = { role: "customer", content: input.trim(), timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, customerMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${backendUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: client?.id || "preview",
          customerPhone: "+237600000000",
          message: customerMsg.content,
          conversationHistory: messages,
          clientInfo: {
            business_name: client?.business_name || "My Business",
            business_description: client?.business_description || "",
            location: client?.location || "",
            language: client?.language || "French",
            tone: client?.tone || "Friendly",
          },
          productsInfo,
        }),
      });

      const data = await res.json();
      const agentMsg = {
        role: "agent",
        content: data.response || "Sorry, something went wrong.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, agentMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "agent", content: "Connection error. Check your backend.", timestamp: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetChat = () => setMessages([]);

  return (
    <div className="flex gap-8 h-[calc(100vh-120px)]" data-testid="chat-preview">
      {/* Phone Mockup */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative w-[340px] h-[680px] bg-zinc-950 rounded-[3rem] border-2 border-zinc-700 shadow-2xl overflow-hidden flex flex-col">
          {/* Phone notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-30" />

          {/* Chat Header */}
          <div className="flex items-center gap-3 px-5 pt-9 pb-3 bg-zinc-900 border-b border-zinc-800 shrink-0">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <MessageCircle size={18} className="text-black" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{client?.business_name || "AutoChat AI"}</p>
              <p className="text-[10px] text-primary">Online</p>
            </div>
            <button
              onClick={resetChat}
              className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 transition-colors"
              title="Reset chat"
              data-testid="chat-preview-reset"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: "#0b141a" }}>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="w-14 h-14 bg-zinc-800/50 rounded-full flex items-center justify-center mb-3">
                  <MessageCircle size={24} className="text-zinc-600" />
                </div>
                <p className="text-zinc-500 text-xs">Send a message to test your AI bot</p>
                <p className="text-zinc-600 text-[10px] mt-1">Try: "Bonjour, quels produits avez-vous?"</p>
              </div>
            )}
            <AnimatePresence>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${msg.role === "customer" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] px-3.5 py-2.5 shadow-lg ${
                      msg.role === "customer"
                        ? "bg-primary text-black rounded-2xl rounded-tr-sm"
                        : "bg-zinc-800 text-white rounded-2xl rounded-tl-sm border border-zinc-700/50"
                    }`}
                    data-testid={`preview-bubble-${idx}`}
                  >
                    <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-[9px] mt-1 ${msg.role === "customer" ? "text-black/40" : "text-zinc-500"}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {loading && (
              <div className="flex justify-start">
                <div className="bg-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3 border border-zinc-700/50">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="px-3 pb-6 pt-2 bg-[#0b141a] border-t border-zinc-800/50 shrink-0">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-full px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-primary transition-colors"
                disabled={loading}
                data-testid="chat-preview-input"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-black hover:bg-primary-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                data-testid="chat-preview-send"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="w-72 shrink-0 space-y-4 overflow-y-auto">
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <MessageCircle size={16} className="text-primary" /> Bot Configuration
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-zinc-500">Language</span><span className="text-zinc-300">{client?.language || "French"}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Tone</span><span className="text-zinc-300">{client?.tone || "Friendly"}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Hours</span><span className="text-zinc-300">{client?.working_hours_start || "08:00"} - {client?.working_hours_end || "18:00"}</span></div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <User size={16} className="text-primary" /> Products Loaded
          </h3>
          <div className="space-y-2">
            {(products || []).slice(0, 5).map((p, i) => (
              <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-zinc-800/30 last:border-0">
                <span className="text-zinc-300 truncate mr-2">{p.name}</span>
                <span className="text-primary font-medium shrink-0">{p.price?.toLocaleString()} XAF</span>
              </div>
            ))}
            {(products || []).length === 0 && <p className="text-zinc-600 text-xs">No products loaded</p>}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-2">Test Prompts</h3>
          <div className="space-y-2">
            {[
              "Bonjour, quels produits avez-vous?",
              "What is the price?",
              "I want to place an order",
              "Are you open now?",
            ].map((prompt, i) => (
              <button
                key={i}
                onClick={() => { setInput(prompt); }}
                className="w-full text-left text-[11px] text-zinc-400 hover:text-primary px-3 py-2 rounded-lg bg-zinc-800/30 hover:bg-zinc-800/60 transition-all"
                data-testid={`test-prompt-${i}`}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
