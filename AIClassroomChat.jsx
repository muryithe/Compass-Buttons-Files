import React, { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { aideStore } from '@/lib/aideStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Bot, Send, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

const SUGGESTIONS = [
  "How has Cairo's behavior trended this week?",
  'Draft an IEP goal based on recent behavioral notes',
  'Which students need extra support today?',
  "Summarize today's behavior incidents",
  "Which students haven't been logged today?",
  'What patterns do you see in recent behavior incidents?',
  'Suggest calming strategies for a student who struggles with transitions',
  'Write a short parent update for a student who had a good week',
  'Which IEP goals are close to being mastered?',
  'What reinforcers could I try for students who refuse work?',
  "Summarize this week's daily notes",
  'Draft a short progress note for an IEP meeting',
];
const VISIBLE = 4;

export default function AIClassroomChat() {
  // chat state lives in aideStore so it survives leaving this page
  const { messages, draft: input, isLoading, error } = useSyncExternalStore(aideStore.subscribe, aideStore.getSnapshot);
  const setInput = aideStore.setDraft;
  const scrollRef = useRef(null);
  const reduce = useReducedMotion();
  const [offset, setOffset] = useState(0);
  const [paused, setPaused] = useState(false);

  // Slide the sample prompts along every few seconds (pauses while hovered)
  useEffect(() => {
    if (paused) return undefined;
    const t = setInterval(() => setOffset((o) => (o + 1) % SUGGESTIONS.length), 4500);
    return () => clearInterval(t);
  }, [reduce, paused]);

  const visible = Array.from({ length: VISIBLE }, (_, k) => SUGGESTIONS[(offset + k) % SUGGESTIONS.length]);

  // Scroll only the chat box (not the whole page) to the newest message
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isLoading]);

  const send = (text) => aideStore.send(text ?? input);

  return (
    <Card className="bg-white shadow-sm border border-slate-100 h-[520px] flex flex-col overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-100 to-purple-100">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">AI Classroom Aide</h3>
            <p className="text-xs text-slate-700">Ask about student behavior, trends & more</p>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-scroll overscroll-contain [scrollbar-width:thin] p-4 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
        {messages.length === 0 ? (
          <div className="text-center py-6">
            <motion.div
              animate={reduce ? undefined : { y: [0, -5, 0], rotate: [0, 6, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-block"
            >
              <Sparkles className="h-12 w-12 text-blue-300 mx-auto" />
            </motion.div>
            <p className="text-slate-600 mt-3 mb-4">Ask me anything about your classroom</p>
            <div
              className="space-y-2"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {visible.map((q) => (
                  <motion.button
                    key={q}
                    layout={!reduce}
                    initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
                    transition={{ duration: 0.35 }}
                    onClick={() => send(q)}
                    className="block w-full text-left px-4 py-2 bg-slate-50 hover:bg-blue-50 rounded-lg text-sm text-slate-700 transition-colors"
                  >
                    {q}
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-blue-600" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-900'
                }`}
              >
                <div className="text-sm">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="ml-4 list-disc">{children}</ul>,
                      ol: ({ children }) => <ol className="ml-4 list-decimal">{children}</ol>,
                      li: ({ children }) => <li className="mb-1">{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
              {msg.role === 'user' && (
                <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 text-white text-xs">
                  You
                </div>
              )}
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4 text-blue-600" />
            </div>
            <div className="bg-slate-200 rounded-lg px-4 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-slate-600" />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about student behavior, trends, or draft goals..."
            disabled={isLoading}
            className="flex-1 bg-[#F8F9FA] border border-[#CCCCCC] text-slate-900"
          />
          <Button type="submit" disabled={!input.trim() || isLoading} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
}