import React, { useEffect, useMemo, useRef, useState } from 'react';
import { buildRouteFacts } from '../lib/routeFacts.js';
import { templateAnswer, numbersAreGrounded, QUICK_QUESTIONS } from '../lib/explain.js';

const API_URL = import.meta.env.VITE_API_URL;

async function askAI(question, facts) {
  if (!API_URL) throw new Error('No API URL');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pregunta: question, ficha: facts }),
      signal: ctrl.signal,
    });
    if (!r.ok) throw new Error('API ' + r.status);
    const { texto } = await r.json();
    if (!texto) throw new Error('Empty');
    return texto;
  } finally {
    clearTimeout(timer);
  }
}

export default function Assistant({ grid, route, mode, limits }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const listRef = useRef(null);

  const facts = useMemo(() => buildRouteFacts(grid, route, mode, limits), [grid, route, mode, limits]);

  // New route → clear the conversation
  useEffect(() => { setMsgs([]); }, [route]);
  useEffect(() => { listRef.current?.scrollTo(0, listRef.current.scrollHeight); }, [msgs, busy]);

  const ask = async (q) => {
    const question = q.trim().slice(0, 300);
    if (!question || busy) return;
    setText('');
    setMsgs(m => [...m, { who: 'user', text: question }]);

    if (!facts) {
      setMsgs(m => [...m, { who: 'bot', text: 'Calculate a route first, then ask me about it.', src: 'offline' }]);
      return;
    }

    setBusy(true);
    let answer, src = 'ai';
    try {
      answer = await askAI(question, facts);
      if (!numbersAreGrounded(answer, facts)) throw new Error('Ungrounded number');
    } catch {
      answer = templateAnswer(question, facts);
      src = 'offline';
    }
    setMsgs(m => [...m, { who: 'bot', text: answer, src }]);
    setBusy(false);
  };

  return (
    <div className="asst">
      {open && (
        <section className="asst-panel" aria-label="Route assistant">
          <header className="asst-head">
            <strong>Route assistant</strong>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close assistant">✕</button>
          </header>

          <div className="asst-list" ref={listRef} aria-live="polite">
            {!msgs.length && (
              <p className="asst-empty">
                {facts ? 'Ask me why the map chose this route.' : 'Calculate a route first, then ask me about it.'}
              </p>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={`asst-msg ${m.who}`}>
                <p>{m.text}</p>
                {m.who === 'bot' && (
                  <small>{m.src === 'ai' ? 'AI · based on map data' : 'Offline · based on map data'}</small>
                )}
              </div>
            ))}
            {busy && <div className="asst-msg bot"><p className="asst-typing">Thinking…</p></div>}
          </div>

          <div className="asst-quick">
            {QUICK_QUESTIONS.map(q => (
              <button key={q} type="button" onClick={() => ask(q)} disabled={busy}>{q}</button>
            ))}
          </div>

          <form className="asst-form" onSubmit={e => { e.preventDefault(); ask(text); }}>
            <input value={text} onChange={e => setText(e.target.value)} maxLength={300}
              placeholder="Ask about the route…" aria-label="Question" disabled={busy} />
            <button type="submit" disabled={busy || !text.trim()}>Send</button>
          </form>
        </section>
      )}

      <button type="button" className="asst-fab" onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close assistant' : 'Open assistant'} aria-expanded={open}>
        {open ? '✕' : '💬'}
      </button>
    </div>
  );
}