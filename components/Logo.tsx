'use client';

import React from 'react';

export function Logo({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <div className={`relative rounded-2xl bg-gradient-to-tr from-sky-500 to-teal-400 p-1 shadow-xs flex items-center justify-center shrink-0 ${className}`}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Soft background shape */}
        <rect width="100" height="100" rx="22" fill="#FFFFFF" fillOpacity="0.95" />
        
        {/* 4 dots/symbols */}
        {/* Water Drop Top-Left */}
        <path
          d="M32 20 C32 20 22 34 22 41 C22 47 26.5 51 32 51 C37.5 51 42 47 42 41 C42 34 32 20 32 20 Z"
          fill="#0284C7"
        />
        {/* Sneaker spark Top-Right */}
        <path
          d="M62 48 C68 46 76 38 80 38 C84 38 86 42 84 48 L60 48"
          stroke="#10B981"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="68" cy="35" r="3" fill="#10B981" />

        {/* Moon Bottom-Left */}
        <path
          d="M38 62 C30 63 24 71 24 79 C24 88 32 94 40 94 C44 94 48 92 51 89 C42 88 36 80 38 62 Z"
          fill="#6366F1"
        />

        {/* Pill Bottom-Right */}
        <g transform="translate(70, 75) rotate(-45)">
          <rect x="-6" y="-14" width="12" height="14" rx="6" fill="#EF4444" />
          <rect x="-6" y="0" width="12" height="14" rx="6" fill="#F59E0B" />
        </g>
      </svg>
    </div>
  );
}
