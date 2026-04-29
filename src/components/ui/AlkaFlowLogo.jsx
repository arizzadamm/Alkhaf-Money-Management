import React from 'react';

export const AlkaFlowLogoMark = ({ size = 72, className = '' }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="alkaflowArcDark" x1="18" y1="92" x2="78" y2="24" gradientUnits="userSpaceOnUse">
        <stop stopColor="#7EA43C" />
        <stop offset="0.45" stopColor="#1B5B3D" />
        <stop offset="1" stopColor="#0E3426" />
      </linearGradient>
      <linearGradient id="alkaflowArcLime" x1="82" y1="18" x2="98" y2="76" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F1FF63" />
        <stop offset="1" stopColor="#D2F411" />
      </linearGradient>
      <linearGradient id="alkaflowArcOlive" x1="22" y1="48" x2="52" y2="102" gradientUnits="userSpaceOnUse">
        <stop stopColor="#C4DD5D" />
        <stop offset="1" stopColor="#5D8932" />
      </linearGradient>
      <linearGradient id="alkaflowArcDeep" x1="76" y1="82" x2="100" y2="38" gradientUnits="userSpaceOnUse">
        <stop stopColor="#14503A" />
        <stop offset="1" stopColor="#0A2C20" />
      </linearGradient>
    </defs>
    <circle cx="60" cy="60" r="37" fill="none" stroke="url(#alkaflowArcDark)" strokeWidth="22" strokeLinecap="round" strokeDasharray="112 260" transform="rotate(132 60 60)" />
    <circle cx="60" cy="60" r="37" fill="none" stroke="url(#alkaflowArcLime)" strokeWidth="22" strokeLinecap="round" strokeDasharray="74 298" transform="rotate(-44 60 60)" />
    <circle cx="60" cy="60" r="37" fill="none" stroke="url(#alkaflowArcOlive)" strokeWidth="22" strokeLinecap="round" strokeDasharray="58 314" transform="rotate(170 60 60)" />
    <circle cx="60" cy="60" r="37" fill="none" stroke="url(#alkaflowArcDeep)" strokeWidth="22" strokeLinecap="round" strokeDasharray="86 286" transform="rotate(48 60 60)" opacity="0.92" />
  </svg>
);

export const AlkaFlowWordmark = ({ compact = false }) => (
  <div className={`alkaflow-wordmark${compact ? ' compact' : ''}`}>
    <span className="alkaflow-wordmark-primary">Alka</span>
    <span className="alkaflow-wordmark-accent">Flow</span>
  </div>
);
