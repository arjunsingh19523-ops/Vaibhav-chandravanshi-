/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface PieceProps {
  className?: string;
}

export const ChessPieces: { [key: string]: React.FC<PieceProps> } = {
  // =========================================================================
  // WHITE PIECES - Chess.com Neo Style Vector Pieces
  // =========================================================================

  // White Pawn (wp)
  wp: ({ className }) => (
    <svg viewBox="0 0 45 45" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="wp-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#FAFAFA" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
        <filter id="neo-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1" floodColor="#000" floodOpacity="0.25"/>
        </filter>
      </defs>
      <g filter="url(#neo-shadow)">
        {/* Head */}
        <circle cx="22.5" cy="14" r="6" fill="url(#wp-grad)" stroke="#17171B" strokeWidth="2" />
        <circle cx="21" cy="13" r="2.5" fill="#FFF" opacity="0.4" />
        {/* Collar */}
        <path d="M17 21h11" stroke="#17171B" strokeWidth="2.2" strokeLinecap="round" />
        {/* Body */}
        <path d="M22.5 21c-3 0-6 4.5-6 9h12c0-4.5-3-9-6-9z" fill="url(#wp-grad)" stroke="#17171B" strokeWidth="2.2" strokeLinejoin="round" />
        {/* Foot rings */}
        <path d="M14.5 32h16" stroke="#17171B" strokeWidth="2" strokeLinecap="round" />
        <path d="M12.5 35.5h20" fill="url(#wp-grad)" stroke="#17171B" strokeWidth="2.2" strokeLinejoin="round" />
        {/* Base bottom */}
        <path d="M11 39h23" stroke="#17171B" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </svg>
  ),

  // White Knight (wn)
  wn: ({ className }) => (
    <svg viewBox="0 0 45 45" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="wn-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#FAFAFA" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
      </defs>
      <g filter="url(#neo-shadow)">
        {/* Detailed horse profile - Neo iconic shape */}
        <path d="M33 35.5c0 0-4-1.5-4-8.5 0-5.5-2.5-9-6.5-12 0 0 .5-3-1.5-5.5-2.5-3-5.5-2-5.5-2s-1 .5-.5 3c.5 2.5 2 4.5 2 4.5s-4 .5-6 3.5c-2 3-1.5 6-.5 7.5s4 1.5 5 0c0 0-1.5 1.5-1 4.5s2.5 4.5 4 4.5c1.5 0 2-2 2-2s1 1 3.5 1c2.5 0 4.5-1.5 5.5-4 1 3 3 4 3 4z" fill="url(#wn-grad)" stroke="#17171B" strokeWidth="2.2" strokeLinejoin="round" />
        {/* Mane Details (Spikes) */}
        <path d="M22.5 10c0 0 1-2.5 3-2M25 14c0 0 1.5-2.5 3.5-1.5M26.5 19.5c0 0 2-2 4-1" stroke="#17171B" strokeWidth="1.8" strokeLinecap="round" />
        {/* Eye */}
        <circle cx="21" cy="12" r="1.5" fill="#17171B" />
        <circle cx="20.5" cy="11.5" r="0.5" fill="#FFF" />
        {/* Ears */}
        <path d="M19 8.5c-.8-1.5-1.8-2.5-1.8-2.5" stroke="#17171B" strokeWidth="2" strokeLinecap="round" />
        {/* Nostril / Snout detail */}
        <path d="M12.5 17.5a1.2 1.2 0 101.2-1.2" stroke="#17171B" strokeWidth="1.5" />
        {/* Base */}
        <path d="M12.5 35.5h20" fill="url(#wn-grad)" stroke="#17171B" strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M11 39h23" stroke="#17171B" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </svg>
  ),

  // White Bishop (wb)
  wb: ({ className }) => (
    <svg viewBox="0 0 45 45" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="wb-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#FAFAFA" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
      </defs>
      <g filter="url(#neo-shadow)">
        {/* Mitre Head */}
        <path d="M22.5 9c-3.3 0-6 4.5-6 10s2.7 10 6 10 6-4.5 6-10-2.7-10-6-10z" fill="url(#wb-grad)" stroke="#17171B" strokeWidth="2.2" strokeLinejoin="round" />
        {/* Bishop slit */}
        <path d="M24.5 13.5l-3.5 4.5" stroke="#17171B" strokeWidth="2" strokeLinecap="round" />
        {/* Pedestal collar */}
        <path d="M17.5 25.5h10M16 28h13" stroke="#17171B" strokeWidth="2.2" strokeLinecap="round" />
        {/* Small head ball cross */}
        <circle cx="22.5" cy="7" r="1.8" fill="url(#wb-grad)" stroke="#17171B" strokeWidth="1.8" />
        {/* Base */}
        <path d="M12.5 35.5h20" fill="url(#wb-grad)" stroke="#17171B" strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M11 39h23" stroke="#17171B" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </svg>
  ),

  // White Rook (wr)
  wr: ({ className }) => (
    <svg viewBox="0 0 45 45" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="wr-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#FAFAFA" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
      </defs>
      <g filter="url(#neo-shadow)">
        {/* Castle Body */}
        <path d="M16.5 19.5h12V33h-12V19.5z" fill="url(#wr-grad)" stroke="#17171B" strokeWidth="2.2" strokeLinejoin="round" />
        {/* Battlements tower top */}
        <path d="M14.5 13h16v6.5h-16V13z" fill="url(#wr-grad)" stroke="#17171B" strokeWidth="2.2" strokeLinejoin="round" />
        {/* Crenellations (slots) inside top */}
        <path d="M18.5 13v3.5h2V13M24.5 13v3.5h2V13" stroke="#17171B" strokeWidth="2.2" strokeLinejoin="round" />
        {/* Masonry line */}
        <path d="M16.5 25.5h12" stroke="#17171B" strokeWidth="1.8" strokeLinecap="round" />
        {/* Base */}
        <path d="M12.5 35.5h20" fill="url(#wr-grad)" stroke="#17171B" strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M11 39h23" stroke="#17171B" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </svg>
  ),

  // White Queen (wq)
  wq: ({ className }) => (
    <svg viewBox="0 0 45 45" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="wq-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#FAFAFA" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
      </defs>
      <g filter="url(#neo-shadow)">
        {/* Pedestal base collar */}
        <path d="M15 28.5c0 0 2.5 4.5 7.5 4.5s7.5-4.5 7.5-4.5h-15z" fill="url(#wq-grad)" stroke="#17171B" strokeWidth="2.2" strokeLinejoin="round" />
        {/* Crown core */}
        <path d="M22.5 14.5c-4.5 0-8.5 5.5-8.5 14h17c0-8.5-4-14-8.5-14z" fill="url(#wq-grad)" stroke="#17171B" strokeWidth="2.2" strokeLinejoin="round" />
        {/* Majestic 5 Crown points */}
        <path d="M13 13.5l3.5 9.5M32 13.5l-3.5 9.5M22.5 10v12.5M17.5 11l4.5 11.5M27.5 11l-4.5 11.5" stroke="#17171B" strokeWidth="2" strokeLinecap="round" />
        {/* Pearl Orbs on Tips */}
        <circle cx="13" cy="13.5" r="1.8" fill="url(#wq-grad)" stroke="#17171B" strokeWidth="1.8" />
        <circle cx="17.5" cy="11" r="1.8" fill="url(#wq-grad)" stroke="#17171B" strokeWidth="1.8" />
        <circle cx="22.5" cy="9.5" r="1.8" fill="url(#wq-grad)" stroke="#17171B" strokeWidth="1.8" />
        <circle cx="27.5" cy="11" r="1.8" fill="url(#wq-grad)" stroke="#17171B" strokeWidth="1.8" />
        <circle cx="32" cy="13.5" r="1.8" fill="url(#wq-grad)" stroke="#17171B" strokeWidth="1.8" />
        {/* Base */}
        <path d="M12.5 35.5h20" fill="url(#wq-grad)" stroke="#17171B" strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M11 39h23" stroke="#17171B" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </svg>
  ),

  // White King (wk)
  wk: ({ className }) => (
    <svg viewBox="0 0 45 45" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="wk-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#FAFAFA" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
      </defs>
      <g filter="url(#neo-shadow)">
        {/* Base body */}
        <path d="M22.5 14c-4.5 0-8 5.5-8 14h16c0-8.5-3.5-14-8-14z" fill="url(#wk-grad)" stroke="#17171B" strokeWidth="2.2" strokeLinejoin="round" />
        {/* Crown ridges */}
        <path d="M13.5 13.5c4-2 7.5.5 9-1s5-1 9 1" stroke="#17171B" strokeWidth="2" strokeLinecap="round" />
        {/* Pedestal lines */}
        <path d="M16 28h13M14.5 31.5H30.5" stroke="#17171B" strokeWidth="2.2" strokeLinecap="round" />
        {/* Royal Cross on top */}
        <path d="M22.5 4.5V11M19.5 6.5h6" stroke="#17171B" strokeWidth="2.2" strokeLinecap="round" />
        {/* Base */}
        <path d="M12.5 35.5h20" fill="url(#wk-grad)" stroke="#17171B" strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M11 39h23" stroke="#17171B" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </svg>
  ),

  // =========================================================================
  // BLACK PIECES - Chess.com Neo Style Charcoal / Slate Pieces
  // =========================================================================

  // Black Pawn (bp)
  bp: ({ className }) => (
    <svg viewBox="0 0 45 45" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bp-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#52525B" />
          <stop offset="60%" stopColor="#27272A" />
          <stop offset="100%" stopColor="#18181B" />
        </linearGradient>
      </defs>
      <g filter="url(#neo-shadow)">
        {/* Head */}
        <circle cx="22.5" cy="14" r="6" fill="url(#bp-grad)" stroke="#17171B" strokeWidth="25" />
        <circle cx="22.5" cy="14" r="6" fill="url(#bp-grad)" stroke="#111" strokeWidth="2" />
        <circle cx="21" cy="13" r="1.5" fill="#FFF" opacity="0.15" />
        {/* Collar */}
        <path d="M17 21h11" stroke="#111" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Inner glow lines to look three-dimensional */}
        <path d="M18.5 22.5c-.8.5-1.5 2-1.5 4" stroke="#71717A" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
        {/* Body */}
        <path d="M22.5 21c-3 0-6 4.5-6 9h12c0-4.5-3-9-6-9z" fill="url(#bp-grad)" stroke="#111" strokeWidth="2.2" strokeLinejoin="round" />
        {/* Foot rings */}
        <path d="M14.5 32h16" stroke="#111" strokeWidth="2" strokeLinecap="round" />
        <path d="M12.5 35.5h20" fill="url(#bp-grad)" stroke="#111" strokeWidth="2.2" strokeLinejoin="round" />
        {/* Base bottom */}
        <path d="M11 39h23" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </svg>
  ),

  // Black Knight (bn)
  bn: ({ className }) => (
    <svg viewBox="0 0 45 45" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bn-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#52525B" />
          <stop offset="60%" stopColor="#27272A" />
          <stop offset="100%" stopColor="#18181B" />
        </linearGradient>
      </defs>
      <g filter="url(#neo-shadow)">
        {/* Detailed horse profile - Neo Black */}
        <path d="M33 35.5c0 0-4-1.5-4-8.5 0-5.5-2.5-9-6.5-12 0 0 .5-3-1.5-5.5-2.5-3-5.5-2-5.5-2s-1 .5-.5 3c.5 2.5 2 4.5 2 4.5s-4 .5-6 3.5c-2 3-1.5 6-.5 7.5s4 1.5 5 0c0 0-1.5 1.5-1 4.5s2.5 4.5 4 4.5c1.5 0 2-2 2-2s1 1 3.5 1c2.5 0 4.5-1.5 5.5-4 1 3 3 4 3 4z" fill="url(#bn-grad)" stroke="#111" strokeWidth="2.2" strokeLinejoin="round" />
        {/* Mane Details (Spikes) */}
        <path d="M22.5 10c0 0 1-2.5 3-2M25 14c0 0 1.5-2.5 3.5-1.5M26.5 19.5c0 0 2-2 4-1" stroke="#52525B" strokeWidth="1.8" strokeLinecap="round" />
        {/* Eye - bright contrast */}
        <circle cx="21" cy="12" r="1.5" fill="#E4E4E7" />
        <circle cx="20.5" cy="11.5" r="0.5" fill="#FFF" />
        {/* Ears */}
        <path d="M19 8.5c-.8-1.5-1.8-2.5-1.8-2.5" stroke="#111" strokeWidth="2" strokeLinecap="round" />
        {/* Nostril */}
        <path d="M12.5 17.5a1.2 1.2 0 101.2-1.2" stroke="#111" strokeWidth="1.5" />
        {/* Chess.com highlights */}
        <path d="M18.5 25.5c-1 0-1.8.8-1.8 1.8 0 .5-.2 1.5-.2 1.5 M19.5 20c-1.5 1-2 2.5-2 2.5" stroke="#52525B" strokeWidth="1" strokeLinecap="round" />
        {/* Base */}
        <path d="M12.5 35.5h20" fill="url(#bn-grad)" stroke="#111" strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M11 39h23" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </svg>
  ),

  // Black Bishop (bb)
  bb: ({ className }) => (
    <svg viewBox="0 0 45 45" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bb-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#52525B" />
          <stop offset="60%" stopColor="#27272A" />
          <stop offset="100%" stopColor="#18181B" />
        </linearGradient>
      </defs>
      <g filter="url(#neo-shadow)">
        {/* Mitre Head */}
        <path d="M22.5 9c-3.3 0-6 4.5-6 10s2.7 10 6 10 6-4.5 6-10-2.7-10-6-10z" fill="url(#bb-grad)" stroke="#111" strokeWidth="2.2" strokeLinejoin="round" />
        {/* Bishop slit - bright contrast */}
        <path d="M24.5 13.5l-3.5 4.5" stroke="#E4E4E7" strokeWidth="2" strokeLinecap="round" />
        {/* Highlighting curve */}
        <path d="M18.5 15.5c-1 2-1.5 5-1.5 8" stroke="#52525B" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
        {/* Pedestal collar */}
        <path d="M17.5 25.5h10M16 28h13" stroke="#111" strokeWidth="2.2" strokeLinecap="round" />
        {/* Head ball cap */}
        <circle cx="22.5" cy="7" r="1.8" fill="url(#bb-grad)" stroke="#111" strokeWidth="1.8" />
        {/* Base */}
        <path d="M12.5 35.5h20" fill="url(#bb-grad)" stroke="#111" strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M11 39h23" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </svg>
  ),

  // Black Rook (br)
  br: ({ className }) => (
    <svg viewBox="0 0 45 45" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="br-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#52525B" />
          <stop offset="60%" stopColor="#27272A" />
          <stop offset="100%" stopColor="#18181B" />
        </linearGradient>
      </defs>
      <g filter="url(#neo-shadow)">
        {/* Castle Body */}
        <path d="M16.5 19.5h12V33h-12V19.5z" fill="url(#br-grad)" stroke="#111" strokeWidth="2.2" strokeLinejoin="round" />
        {/* Battlements tower top */}
        <path d="M14.5 13h16v6.5h-16V13z" fill="url(#br-grad)" stroke="#111" strokeWidth="2.2" strokeLinejoin="round" />
        {/* Crenellations */}
        <path d="M18.5 13v3.5h2V13M24.5 13v3.5h2V13" stroke="#111" strokeWidth="2.2" strokeLinejoin="round" />
        {/* Side shadow lines */}
        <path d="M18.5 21v10 M26.5 21v10" stroke="#52525B" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
        {/* Masonry line */}
        <path d="M16.5 25.5h12" stroke="#111" strokeWidth="1.8" strokeLinecap="round" />
        {/* Base */}
        <path d="M12.5 35.5h20" fill="url(#br-grad)" stroke="#111" strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M11 39h23" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </svg>
  ),

  // Black Queen (bq)
  bq: ({ className }) => (
    <svg viewBox="0 0 45 45" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bq-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#52525B" />
          <stop offset="60%" stopColor="#27272A" />
          <stop offset="100%" stopColor="#18181B" />
        </linearGradient>
      </defs>
      <g filter="url(#neo-shadow)">
        {/* Pedestal base collar */}
        <path d="M15 28.5c0 0 2.5 4.5 7.5 4.5s7.5-4.5 7.5-4.5h-15z" fill="url(#bq-grad)" stroke="#111" strokeWidth="2.2" strokeLinejoin="round" />
        {/* Crown core */}
        <path d="M22.5 14.5c-4.5 0-8.5 5.5-8.5 14h17c0-8.5-4-14-8.5-14z" fill="url(#bq-grad)" stroke="#111" strokeWidth="2.2" strokeLinejoin="round" />
        {/* Vertical luster line */}
        <path d="M22.5 17v9" stroke="#52525B" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        {/* Majestic 5 Crown points */}
        <path d="M13 13.5l3.5 9.5M32 13.5l-3.5 9.5M22.5 10v12.5M17.5 11l4.5 11.5M27.5 11l-4.5 11.5" stroke="#111" strokeWidth="2" strokeLinecap="round" />
        {/* Pearl Orbs on Tips */}
        <circle cx="13" cy="13.5" r="1.8" fill="url(#bq-grad)" stroke="#111" strokeWidth="1.8" />
        <circle cx="17.5" cy="11" r="1.8" fill="url(#bq-grad)" stroke="#111" strokeWidth="1.8" />
        <circle cx="22.5" cy="9.5" r="1.8" fill="url(#bq-grad)" stroke="#111" strokeWidth="1.8" />
        <circle cx="27.5" cy="11" r="1.8" fill="url(#bq-grad)" stroke="#111" strokeWidth="1.8" />
        <circle cx="32" cy="13.5" r="1.8" fill="url(#bq-grad)" stroke="#111" strokeWidth="1.8" />
        {/* Base */}
        <path d="M12.5 35.5h20" fill="url(#bq-grad)" stroke="#111" strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M11 39h23" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </svg>
  ),

  // Black King (bk)
  bk: ({ className }) => (
    <svg viewBox="0 0 45 45" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bk-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#52525B" />
          <stop offset="60%" stopColor="#27272A" />
          <stop offset="100%" stopColor="#18181B" />
        </linearGradient>
      </defs>
      <g filter="url(#neo-shadow)">
        {/* Base body */}
        <path d="M22.5 14c-4.5 0-8 5.5-8 14h16c0-8.5-3.5-14-8-14z" fill="url(#bk-grad)" stroke="#111" strokeWidth="2.2" strokeLinejoin="round" />
        {/* Royal luster highlight */}
        <path d="M20 18c0 0-2 2-2 6" stroke="#52525B" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
        {/* Crown ridges */}
        <path d="M13.5 13.5c4-2 7.5.5 9-1s5-1 9 1" stroke="#111" strokeWidth="2" strokeLinecap="round" />
        {/* Pedestal lines */}
        <path d="M16 28h13M14.5 31.5H30.5" stroke="#111" strokeWidth="2.2" strokeLinecap="round" />
        {/* Royal Cross on top */}
        <path d="M22.5 4.5V11M19.5 6.5h6" stroke="#111" strokeWidth="2.2" strokeLinecap="round" />
        {/* Base */}
        <path d="M12.5 35.5h20" fill="url(#bk-grad)" stroke="#111" strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M11 39h23" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </svg>
  ),
};
