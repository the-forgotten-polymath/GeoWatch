import { useState, useRef, useEffect } from 'react';
import { Send, Map as MapIcon, X } from 'lucide-react';
import { FormattedText } from './FormattedText';
import { aiService } from '@/services/aiService';

export const ChatWidget = ({ onSendMessage, messages, loading }: { 
  onSendMessage: (msg: string) => void, 
  messages: any[], 
  loading: boolean 
}) => {
  const [input, setInput] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (endRef.current && !isMinimized) endRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, isMinimized]);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    onSendMessage(input);
    setInput("");
    setIsMinimized(false);
  };

  const hasMessages = messages.length > 0 || loading;

  return (
    <div className="fixed bottom-6 right-6 z-[50] w-[90vw] max-w-sm flex flex-col justify-end items-end pointer-events-none gap-4">
      
      {/* Chat History Panel - Apple/Perplexity Glassmorphism */}
      {hasMessages && !isMinimized && (
        <div className="w-full bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] pointer-events-auto flex flex-col overflow-hidden max-h-[50vh] transition-all duration-300">
          <div className="flex justify-between items-center p-3 border-b border-white/10 bg-white/5">
             <div className="flex items-center gap-2">
               <MapIcon className="w-4 h-4 text-primary" />
               <span className="text-xs font-bold tracking-wide text-white/90">GeoWatch Assistant</span>
               <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-primary/10 border border-primary/20 text-primary font-mono font-bold tracking-normal uppercase ml-1">
                 {aiService.getProviderName()}
               </span>
             </div>
             <button 
               onClick={() => setIsMinimized(true)} 
               className="text-white/40 hover:text-white/90 hover:bg-white/10 rounded-full p-1 transition-colors"
               title="Hide Chat"
             >
               <X className="w-4 h-4" />
             </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
             {messages.map((m, i) => (
               <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed backdrop-blur-md ${m.role === 'user' ? 'bg-primary/20 border border-primary/30 text-white rounded-tr-sm' : 'bg-white/5 border border-white/10 text-white/90 rounded-tl-sm'}`}>
                     <FormattedText text={m.content} />
                     {m.isos && m.isos.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/10 flex gap-2 flex-wrap">
                           {m.isos.map((iso: string) => (
                              <span key={iso} className="text-[9px] bg-primary/20 px-2 py-1 rounded-full border border-primary/30 text-emerald-400 font-mono tracking-widest uppercase">
                                [{iso}]
                              </span>
                           ))}
                        </div>
                     )}
                  </div>
               </div>
             ))}
             {loading && (
               <div className="flex items-start">
                 <div className="max-w-[85%] p-3 rounded-2xl rounded-tl-sm bg-white/5 border border-white/10 text-white/90 text-sm flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"></div>
                   <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce delay-75"></div>
                   <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce delay-150"></div>
                 </div>
               </div>
             )}
             <div ref={endRef} />
          </div>
        </div>
      )}

      {/* Persistent Input Bar */}
      <div className="w-full bg-black/60 backdrop-blur-2xl border border-white/10 rounded-full shadow-[0_8px_32px_rgba(34,197,94,0.15)] pointer-events-auto flex items-center p-1.5 ring-1 ring-white/5 transition-all hover:ring-primary/50 focus-within:ring-primary">
        <div className="pl-4 pr-2">
          <MapIcon className="w-5 h-5 text-primary opacity-80" />
        </div>
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask the map (e.g., 'Compare tensions in Sudan vs Ethiopia')"
          className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-white/40 px-2 h-10 font-medium"
        />
        <button 
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="bg-primary text-black rounded-full p-2.5 hover:bg-primary/80 disabled:opacity-50 disabled:hover:bg-primary transition-all ml-2"
        >
          <Send className="w-4 h-4 ml-0.5" />
        </button>
      </div>

    </div>
  );
};
