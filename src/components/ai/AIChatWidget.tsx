"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { nanoid } from "@/lib/utils";
import type { ChatMessage } from "@/types";

/** Maximum time (ms) to wait for a chat response */
const CHAT_TIMEOUT_MS = 20_000;

/** Maximum conversation history sent to Gemini (keeps payloads small) */
const MAX_HISTORY_TURNS = 10;

export default function AIChatWidget() {
  const { profile, summary } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);



  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || sending || !profile || !summary) return;

    const userMessage: ChatMessage = {
      id: nanoid(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setSending(true);

    // Abort any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS);

    try {
      // Send only the last N turns to keep payload small
      const historySlice = updatedMessages.slice(-MAX_HISTORY_TURNS);

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historySlice,
          summary: summary,
          profile: profile.lifestyle,
        }),
        signal: controller.signal,
      });

      const data = await res.json();
      const assistantMessage: ChatMessage = {
        id: nanoid(),
        role: "assistant",
        content: data.text || "I couldn't generate a response. Please try again.",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        setMessages((prev) => [
          ...prev,
          {
            id: nanoid(),
            role: "assistant",
            content: "Request timed out. Please try again with a shorter question.",
            timestamp: new Date().toISOString(),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: nanoid(),
            role: "assistant",
            content: "Something went wrong. Please try again in a moment.",
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } finally {
      clearTimeout(timeout);
      setSending(false);
    }
  }, [input, sending, messages, profile, summary]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Don't render if no profile
  if (!profile) return null;

  return (
    <>
      {/* Chat Panel */}
      {isOpen && (
        <div
          className="fixed bottom-20 right-4 z-50 flex h-[480px] w-[360px] flex-col rounded-2xl border border-stone-200 bg-white shadow-2xl dark:border-stone-700 dark:bg-stone-900 lg:bottom-6 lg:right-6"
          role="dialog"
          aria-label="AI Climate Coach Chat"
        >
          {/* Header */}
          <div className="flex items-center gap-3 rounded-t-2xl border-b border-stone-200 bg-gradient-to-r from-forest-600 to-forest-700 px-4 py-3 dark:border-stone-700">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm">
              ✨
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-white">Climate Coach</h3>
              <p className="text-xs text-forest-200">Powered by Gemini</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
              aria-label="Close chat"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-3 text-4xl">🌱</div>
                <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
                  Hi! I&apos;m your climate coach.
                </p>
                <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                  Ask me about your carbon footprint, reduction tips, or anything about sustainability.
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5 justify-center">
                  {[
                    "What's my biggest emission source?",
                    "How can I reduce my footprint?",
                    "What does CO₂e mean?",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setInput(suggestion);
                        setTimeout(() => sendMessage(), 50);
                      }}
                      className="rounded-full border border-forest-200 bg-forest-50 px-3 py-1.5 text-xs text-forest-700 hover:bg-forest-100 dark:border-forest-800 dark:bg-forest-950/30 dark:text-forest-300"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-forest-600 text-white rounded-br-md"
                      : "bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-200 rounded-bl-md"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {sending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl bg-stone-100 px-4 py-3 dark:bg-stone-800">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-stone-400 [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-stone-400 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-stone-400 [animation-delay:300ms]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-stone-200 px-3 py-3 dark:border-stone-700">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your footprint…"
                disabled={sending}
                className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-900 placeholder-stone-400 outline-none focus:border-forest-500 focus:ring-1 focus:ring-forest-500 disabled:opacity-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                aria-label="Chat message input"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || sending}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-600 text-white transition-colors hover:bg-forest-700 disabled:opacity-40 disabled:hover:bg-forest-600"
                aria-label="Send message"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-stone-400">
              AI responses may not be exact · based on your profile data
            </p>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-200 hover:scale-105 lg:bottom-6 lg:right-6 ${
          isOpen
            ? "bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-300 scale-0 pointer-events-none"
            : "bg-gradient-to-br from-forest-500 to-forest-700 text-white"
        }`}
        aria-label={isOpen ? "Close AI chat" : "Open AI chat"}
      >
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </button>
    </>
  );
}
