import React from 'react';

const GAME_URL = 'https://andrew-gyit.github.io/olympus-walk/';

export default function GameLink() {
  return (
    <a
      href={GAME_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="button button-icon game-link"
      aria-label="Play astronaut game"
      title="Play astronaut game"
    >
      <svg
        className="icon"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M7 8h10a5 5 0 0 1 4.6 6.9l-.9 2.2a2 2 0 0 1-3.2.7L15.5 16h-7l-2 1.8a2 2 0 0 1-3.2-.7l-.9-2.2A5 5 0 0 1 7 8Z" />
        <path d="M7 12h4M9 10v4" />
        <circle cx="16" cy="11.5" r=".7" fill="currentColor" />
        <circle cx="18" cy="13.5" r=".7" fill="currentColor" />
      </svg>
    </a>
  );
}