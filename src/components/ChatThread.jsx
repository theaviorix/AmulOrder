import React, { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';

function dayLabel(iso) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const same = (a, b) => a.toDateString() === b.toDateString();
  if (same(d, today)) return 'Today';
  if (same(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ChatThread({ messages, mine, onSend, placeholder = 'Type a message…', disabled = false }) {
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  const submit = () => {
    if (!text.trim()) return;
    onSend(text);
    setText('');
  };

  let lastDay = null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-canvas/40">
        {messages.length === 0 ? (
          <p className="text-sm text-ink2 text-center py-10">No messages yet — say hello 👋</p>
        ) : (
          messages.map((m) => {
            const thisDay = dayLabel(m.created_date);
            const showDay = thisDay !== lastDay;
            lastDay = thisDay;
            const isMine = m.sender === mine;
            return (
              <React.Fragment key={m.id}>
                {showDay && (
                  <div className="flex justify-center my-3">
                    <span className="text-[10px] font-medium text-ink2 bg-surface border border-mist rounded-full px-3 py-1">{thisDay}</span>
                  </div>
                )}
                <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[78%] sm:max-w-[65%] rounded-2xl px-3.5 py-2 mb-1.5 ${isMine ? 'bg-jet text-surface rounded-br-sm' : 'bg-surface border border-mist text-ink rounded-bl-sm'}`}>
                    <p className="text-sm whitespace-pre-wrap break-words leading-snug">{m.text}</p>
                    <p className={`mt-1 text-[10px] font-mono ${isMine ? 'text-surface/50' : 'text-ink2'}`}>
                      {new Date(m.created_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      <div className="p-3 border-t border-mist bg-surface flex items-end gap-2 shrink-0">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-mist bg-canvas px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink max-h-28 disabled:opacity-50"
        />
        <button
          onClick={submit}
          disabled={disabled || !text.trim()}
          className="w-10 h-10 rounded-xl bg-jet text-surface grid place-items-center hover:bg-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
