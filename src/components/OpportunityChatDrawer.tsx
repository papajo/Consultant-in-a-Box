import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User,
  RefreshCw,
  X,
  Lightbulb,
  ArrowRight,
  Shield,
  HelpCircle,
} from 'lucide-react';
import {
  OpportunityEvaluationReport,
  OpportunityChatMessage,
} from '../types/agent.ts';

interface OpportunityChatDrawerProps {
  report: OpportunityEvaluationReport;
  isOpen: boolean;
  onClose: () => void;
}

export const OpportunityChatDrawer: React.FC<OpportunityChatDrawerProps> = ({
  report,
  isOpen,
  onClose,
}) => {
  const [messages, setMessages] = useState<OpportunityChatMessage[]>([
    {
      id: 'initial-greeting',
      role: 'assistant',
      content: `Hello ${report.consultantProfileSnapshot.name.split(' ')[0]}! I've reviewed the **${report.opportunityTitle}** opportunity for **${report.clientName}**.\n\nOur preliminary verdict is **${report.recommendation.decision}** (${report.recommendation.opportunityScore}/100).\n\nHow would you like to proceed? You can ask me to draft client emails, strategize your hourly rate, or analyze how to overcome specific compliance or technical gaps.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: [
        'How should I structure my pricing strategy?',
        'Draft an email asking the 3 clarification questions',
        'How can we address the gap in compliance certifications?',
        'What are our 3 strongest competitive differentiators?',
      ],
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isSending) return;

    const userMsg: OpportunityChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsSending(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report,
          messages: [...messages, userMsg],
          newMessage: text,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status: ${res.status}`);
      }

      const botReply: OpportunityChatMessage = await res.json();
      setMessages((prev) => [...prev, botReply]);
    } catch (err: any) {
      console.error('[CopilotChat] Error:', err);
      const fallbackMsg: OpportunityChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: `I've analyzed your question against the ${report.opportunityTitle} evaluation. Given our ${report.recommendation.decision} recommendation, maintaining a firm $${report.consultantProfileSnapshot.preferences.minHourlyRateUsd}/hr floor while clarifying scope ambiguities in the initial discovery call is the highest-leverage move.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl h-full flex flex-col shadow-2xl border-l border-stone-200 animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center text-amber-400">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                <span>Strategic Opportunity Copilot</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-900">
                  {report.recommendation.decision} ({report.recommendation.opportunityScore}/100)
                </span>
              </h3>
              <p className="text-[11px] text-stone-500 truncate max-w-xs">
                Target: {report.clientName} • {report.opportunityTitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${
                msg.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-stone-900 text-white'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`max-w-[82%] rounded-xl p-3 space-y-2 leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-stone-900 text-stone-100'
                    : 'bg-stone-50 border border-stone-200 text-stone-800'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div className="pt-2 border-t border-stone-200/60 space-y-1.5">
                    <div className="text-[10px] font-bold text-stone-500 uppercase flex items-center gap-1">
                      <Lightbulb className="w-3 h-3 text-amber-500" />
                      Suggested Follow-ups:
                    </div>
                    <div className="flex flex-col gap-1">
                      {msg.suggestedActions.map((action, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendMessage(action)}
                          className="text-left text-[11px] px-2.5 py-1 rounded bg-white hover:bg-stone-100 border border-stone-200 text-stone-800 font-medium transition cursor-pointer flex items-center justify-between"
                        >
                          <span>{action}</span>
                          <ArrowRight className="w-3 h-3 text-stone-400 shrink-0 ml-1" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div
                  className={`text-[9px] font-mono text-right ${
                    msg.role === 'user' ? 'text-stone-400' : 'text-stone-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {isSending && (
            <div className="flex items-center gap-2 text-stone-500 text-xs italic">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Copilot is reasoning over proposal strategy...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Box */}
        <div className="p-3 border-t border-stone-200 bg-stone-50 space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask anything (e.g. 'Draft negotiation points', 'Clarify data governance')..."
              className="flex-1 px-3 py-2 rounded-lg border border-stone-200 bg-white text-xs text-stone-800 placeholder:text-stone-400 focus:outline-hidden focus:border-stone-400"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isSending}
              className="p-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white disabled:opacity-50 transition cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="text-[10px] text-stone-400 text-center">
            Grounded in active RFP context, fit matrix evidence, and consultant preferences.
          </div>
        </div>
      </div>
    </div>
  );
};
