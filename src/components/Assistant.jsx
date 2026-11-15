import React, { useEffect, useMemo, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { buildRouteFacts } from '../lib/routeFacts.js';
import { templateAnswer, numbersAreGrounded, mentionsSafety, quickQuestions } from '../lib/explain.js';

const apiUrl = import.meta.env.VITE_ASSISTANT_API_URL;
const sourceLabels = {
  route: 'From the calculated route, without AI',
  ai: 'AI-generated, check it against the route summary',
};

async function askAi(question, facts) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pregunta: question, ficha: facts }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`API ${response.status}`);
    const { texto } = await response.json();
    if (!texto) throw new Error('Empty answer');
    return texto;
  } finally {
    clearTimeout(timer);
  }
}

export default function Assistant({ grid, route, mode, limits }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const toggleButton = useRef(null);
  const panel = useRef(null);
  const log = useRef(null);

  const facts = useMemo(() => buildRouteFacts(grid, route, mode, limits), [grid, route, mode, limits]);

  const close = () => {
    toggleButton.current?.focus();
    setOpen(false);
  };

  useEffect(() => { setMessages([]); }, [route]);
  useEffect(() => { log.current?.scrollTo(0, log.current.scrollHeight); }, [messages, busy]);

  useEffect(() => {
    if (!open) return undefined;
    panel.current?.focus();
    const closeOnEscape = (event) => {
      if (event.key !== 'Escape') return;
      toggleButton.current?.focus();
      setOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [open]);

  const ask = async (input) => {
    const question = input.trim().slice(0, 300);
    if (!question || busy) return;
    setText('');
    setMessages(list => [...list, { from: 'user', text: question }]);

    if (!facts) {
      setMessages(list => [...list, { from: 'bot', text: 'Calculate a route first, then ask about it.', source: 'route' }]);
      return;
    }

    let answer = templateAnswer(question, facts), source = 'route';
    if (apiUrl) {
      setBusy(true);
      const aiAnswer = await askAi(question, facts).catch(() => null);
      if (aiAnswer && numbersAreGrounded(aiAnswer, facts) && !mentionsSafety(aiAnswer)) {
        answer = aiAnswer;
        source = 'ai';
      }
      setBusy(false);
    }
    setMessages(list => [...list, { from: 'bot', text: answer, source }]);
  };

  return (
    <>
      <button ref={toggleButton} type="button" className="button button-icon assistant-toggle" onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open} aria-controls="route-assistant" aria-label="Route assistant" title="Route assistant">
        <Icon name="chat" />
      </button>

      {open && (
        <section id="route-assistant" ref={panel} tabIndex={-1} className="assistant" aria-labelledby="route-assistant-title">
          <header className="assistant-head">
            <h2 id="route-assistant-title">Route assistant</h2>
            <button type="button" className="button button-icon button-quiet" onClick={close} aria-label="Close assistant">
              <Icon name="close" />
            </button>
          </header>
          {apiUrl && <p className="assistant-notice">Questions are sent to an external AI service.</p>}

          <div className="assistant-log" ref={log} aria-live="polite">
            {!messages.length && (
              <p className="assistant-empty">
                {facts ? 'Ask about the calculated route. Answers use only its A* result and the mission assumptions.' : 'Calculate a route first, then ask about it.'}
              </p>
            )}
            {messages.map((message, i) => (
              <div key={i} className={`assistant-msg ${message.from}`}>
                <p>{message.text}</p>
                {message.source && <small>{sourceLabels[message.source]}</small>}
              </div>
            ))}
            {busy && <p className="assistant-msg bot">Waiting for the AI service…</p>}
          </div>

          <div className="assistant-quick">
            {quickQuestions.map(question => (
              <button key={question} type="button" onClick={() => ask(question)} disabled={busy}>{question}</button>
            ))}
          </div>

          <form className="assistant-form" onSubmit={(event) => { event.preventDefault(); ask(text); }}>
            <input value={text} onChange={(event) => setText(event.target.value)} maxLength={300}
              placeholder="Ask about the route…" aria-label="Question about the route" disabled={busy} />
            <button type="submit" className="button" disabled={busy || !text.trim()}>Send</button>
          </form>
        </section>
      )}
    </>
  );
}
