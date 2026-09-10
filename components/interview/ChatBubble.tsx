"use client";

import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";

interface ChatBubbleProps {
  role: "ai" | "candidate";
  content: string;
  isSkillBanner?: boolean;
}

export default function ChatBubble({ role, content, isSkillBanner }: ChatBubbleProps) {
  if (isSkillBanner) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center my-4"
      >
        <div className="rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-200 dark:border-indigo-800 px-6 py-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
          {content}
        </div>
      </motion.div>
    );
  }

  const isAI = role === "ai";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isAI ? "justify-start" : "justify-end"}`}
    >
      {isAI && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500">
          <Bot className="h-4 w-4 text-white" />
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isAI
            ? "bg-[var(--color-surface)] border border-[var(--color-border)] rounded-tl-sm"
            : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-sm"
        }`}
      >
        {content}
      </div>
      {!isAI && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
          <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        </div>
      )}
    </motion.div>
  );
}
