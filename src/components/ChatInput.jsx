import React, { useRef, useEffect } from "react";
import { Send, CornerDownLeft } from "lucide-react";

export default function ChatInput({ value, onChange, onSend, disabled }) {
  const textareaRef = useRef(null);

  // Automatically adjust textarea height based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to compute scrollHeight
    textarea.style.height = "auto";
    // Set actual height based on scrollHeight, up to max-height (160px)
    const newHeight = Math.min(textarea.scrollHeight, 160);
    textarea.style.height = `${newHeight}px`;
  }, [value]);

  const handleKeyDown = (e) => {
    // Submit on Enter without Shift key, if not disabled and value is not empty
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSend();
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim() && !disabled) {
      onSend();
    }
  };

  return (
    <div className="border-t border-[#2d2d2d] bg-bgPrimary px-4 py-4 md:px-8">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative">
        <div className="relative flex items-center bg-bgInput border border-[#3d3d3d] focus-within:border-accent rounded-2xl pl-4 pr-12 py-3 transition-colors duration-200 shadow-inner">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Type your message here... (Enter to send, Shift+Enter for newline)"
            className="w-full bg-transparent text-textPrimary text-sm outline-none resize-none max-h-40 placeholder-neutral-500 leading-relaxed py-0.5"
            style={{ height: "auto" }}
          />

          <button
            type="submit"
            disabled={!value.trim() || disabled}
            className={`absolute right-3 bottom-2.5 p-2 rounded-xl transition-all duration-200 ${
              value.trim() && !disabled
                ? "bg-accent hover:bg-accent-dark text-white active:scale-95 shadow-md shadow-accent/15"
                : "bg-neutral-800 text-neutral-600 cursor-not-allowed"
            }`}
            title="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        
        <div className="mt-2 flex justify-between items-center px-2">
          <p className="text-[10px] text-neutral-500 flex items-center gap-1.5">
            <CornerDownLeft className="w-3 h-3 text-neutral-600" />
            <span>Press Enter to send</span>
          </p>
          <p className="text-[10px] text-neutral-500">
            Powered by watsonx Orchestrate
          </p>
        </div>
      </form>
    </div>
  );
}
