import React from 'react';

const paths = {
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  walk: <><circle cx="13" cy="4.5" r="1.8" /><path d="M12.5 8.5l-2.5 5 3.5 2.5V21M10 13.5L7.5 21M12.5 8.5l3.5 2.5 2.5.5M12.5 8.5L9 10l-1 3" /></>,
  rover: <><path d="M3 14h18M6 14V9.5h8.5L18 14M9 9.5V5.5" /><circle cx="7.5" cy="17.5" r="2.2" /><circle cx="16.5" cy="17.5" r="2.2" /></>,
  alert: <path d="M12 4.5l8.5 15h-17l8.5-15zM12 10.5v4.5M12 17.4v.1" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  play: <path d="M8 5.5l10.5 6.5L8 18.5v-13z" />,
  pause: <path d="M8.5 5.5v13M15.5 5.5v13" />,
  chevron: <path d="M6 9.5l6 6 6-6" />,
  arrow: <path d="M12 3l6 16-6-4-6 4 6-16z" />,
};

export default function Icon({ name, size = 18 }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}
