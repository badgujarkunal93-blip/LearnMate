import React, { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { GraduationCap, User } from "lucide-react";
import { parseAgentResponse } from "../utils/quizParser";

export default function ChatWindow({ messages, isLoading, onSelectOption, trackName }) {
  const bottomRef = useRef(null);

  // Smooth scroll to bottom when messages change or loading state toggles
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-accent/15 flex items-center justify-center text-accent mb-6 animate-pulse">
            <GraduationCap className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-textPrimary mb-2">Welcome to LearnMate</h2>
          <p className="text-sm text-textSecondary">
            To start your customized path for <span className="text-accent font-semibold">"{trackName}"</span>, 
            send any message or just click the button below. I will administer a quick skill assessment 
            and generate a roadmap.
          </p>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg, index) => {
            const isUser = msg.sender === "user";
            
            // Check if this is the last agent message in the list
            const isLastMessage = index === messages.length - 1;

            if (isUser) {
              return (
                <div key={index} className="flex items-start justify-end gap-3 animate-fadeIn">
                  <div className="max-w-[85%] bg-chatUser border border-[#3d3d3d] text-textPrimary rounded-2xl py-3 px-4 shadow-md">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/25 text-accent shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                </div>
              );
            }

            // Parse agent response for quiz questions and options
            const parsed = parseAgentResponse(msg.text);

            return (
              <div key={index} className="flex items-start gap-3 animate-fadeIn">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/15 text-accent shrink-0 mt-0.5 border border-accent/25">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-4 max-w-[85%]">
                  {/* Clean text section */}
                  {parsed.cleanText && (
                    <div className="text-textPrimary text-sm leading-relaxed">
                      <ReactMarkdown
                        components={{
                          p: ({ ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                          ul: ({ ...props }) => <ul className="list-disc pl-5 mb-2 space-y-1 text-textSecondary" {...props} />,
                          ol: ({ ...props }) => <ol className="list-decimal pl-5 mb-2 space-y-1 text-textSecondary" {...props} />,
                          li: ({ ...props }) => <li className="mb-0.5" {...props} />,
                          strong: ({ ...props }) => <strong className="font-semibold text-white bg-accent/10 px-1 py-0.5 rounded" {...props} />,
                        }}
                      >
                        {parsed.cleanText}
                      </ReactMarkdown>
                    </div>
                  )}

                  {/* Quiz question block if detected */}
                  {parsed.hasQuiz && (
                    <div className="bg-[#232323] border border-[#333333] rounded-xl p-4 space-y-4 shadow-lg shadow-black/10">
                      <div className="flex items-start gap-2">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase bg-accent/20 text-accent rounded shrink-0 mt-0.5">
                          Quiz
                        </span>
                        <p className="text-sm font-semibold text-textPrimary leading-snug">
                          {parsed.question}
                        </p>
                      </div>

                      {/* Clickable Quick-Reply Option Chips */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {parsed.options.map((opt, optIdx) => (
                          <button
                            key={optIdx}
                            disabled={!isLastMessage || isLoading}
                            onClick={() => onSelectOption(opt)}
                            className={`px-4 py-2 text-xs font-medium rounded-full border transition-all duration-200 ${
                              isLastMessage && !isLoading
                                ? "border-[#444444] hover:border-accent hover:bg-accent/5 text-textSecondary hover:text-accent active:scale-95 cursor-pointer"
                                : "border-neutral-800 text-neutral-600 bg-neutral-900 cursor-not-allowed"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex items-start gap-3 animate-fadeIn">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/15 text-accent shrink-0 border border-accent/25">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="bg-bgSecondary/80 border border-[#2d2d2d] rounded-2xl py-3.5 px-5 flex items-center justify-center gap-1.5 typing-dots shadow-sm">
                <span className="dot w-1.5 h-1.5 rounded-full bg-neutral-500"></span>
                <span className="dot w-1.5 h-1.5 rounded-full bg-neutral-500"></span>
                <span className="dot w-1.5 h-1.5 rounded-full bg-neutral-500"></span>
              </div>
            </div>
          )}
          
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
