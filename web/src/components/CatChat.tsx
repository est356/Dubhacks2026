"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { catReply } from "@/lib/recommend";
import type { ChatMessage } from "@/types";

async function askCat(prompt: string): Promise<{
  text: string;
  recommendedSpotId: string;
}> {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) throw new Error("chat failed");
    const data = (await res.json()) as {
      text?: string;
      recommendedSpotId?: string;
    };
    if (!data.text || !data.recommendedSpotId) throw new Error("bad payload");
    return { text: data.text, recommendedSpotId: data.recommendedSpotId };
  } catch {
    return catReply(prompt);
  }
}

interface CatChatProps {
  open: boolean;
  onClose: () => void;
  onRecommend: (spotId: string) => void;
}

const STARTER: ChatMessage = {
  id: "welcome",
  role: "cat",
  text: "Mrrp! Tell me what you need — quiet, outlets, close to campus… I'll sniff out a spot.",
};

export default function CatChat({ open, onClose, onRecommend }: CatChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([STARTER]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const prompt = input.trim();
    if (!prompt) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text: prompt,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    const reply = await askCat(prompt);
    const catMsg: ChatMessage = {
      id: `c-${Date.now()}`,
      role: "cat",
      text: reply.text,
      recommendedSpotId: reply.recommendedSpotId,
    };
    setMessages((prev) => [...prev, catMsg]);
    onRecommend(reply.recommendedSpotId);
  }

  if (!open) return null;

  return (
    <div className="cat-chat" role="dialog" aria-label="AI Cat chatbot">
      <header className="cat-chat__header">
        <div className="cat-chat__mascot" aria-hidden>
          <span className="cat-chat__mug">☕</span>
          <span className="cat-chat__cat">🐈</span>
        </div>
        <div>
          <h2>AI Cat</h2>
          <p>Study spot recommender</p>
        </div>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close chat">
          ✕
        </button>
      </header>
      <div className="cat-chat__messages">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`cat-chat__bubble cat-chat__bubble--${m.role}`}
          >
            {m.text}
            {m.recommendedSpotId ? (
              <button
                type="button"
                className="cat-chat__jump"
                onClick={() => onRecommend(m.recommendedSpotId!)}
              >
                Show on map
              </button>
            ) : null}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form className="cat-chat__form" onSubmit={send}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="quiet, lots of outlets, close to campus…"
          aria-label="Message the cat"
        />
        <button type="submit">Ask</button>
      </form>
    </div>
  );
}
