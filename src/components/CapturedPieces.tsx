/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChessPieces, getPieceThemeFilter } from './ChessPieces.tsx';

interface CapturedPiecesProps {
  capturedList: string[]; // e.g. ['p', 'p', 'n', 'q']
  color: 'w' | 'b'; // 'w' means White pieces that have been captured (by Black), 'b' means Black pieces captured (by White)
  advantageDiff: number; // advantage from White perspective
  pieceTheme?: string;
}

export const CapturedPieces: React.FC<CapturedPiecesProps> = ({
  capturedList,
  color,
  advantageDiff,
  pieceTheme = 'classic',
}) => {
  // Group pieces e.g. { p: 3, n: 1 }
  const counts: { [key: string]: number } = {};
  capturedList.forEach((p) => {
    counts[p] = (counts[p] || 0) + 1;
  });

  const order = ['q', 'r', 'b', 'n', 'p'];

  // Is this specific side leading?
  const showAdvantageNum = (color === 'w' && advantageDiff < 0) || (color === 'b' && advantageDiff > 0);
  const advValue = Math.abs(advantageDiff);

  return (
    <div className="flex items-center gap-2 bg-[#1c1c28] border border-white/5 py-1 px-3 rounded-lg overflow-x-auto select-none min-h-[38px]">
      <span className="text-gray-400 text-xs font-semibold mr-1">
        {color === 'w' ? 'Captured White:' : 'Captured Black:'}
      </span>
      
      {capturedList.length === 0 ? (
        <span className="text-gray-600 text-xs italic">none</span>
      ) : (
        <div className="flex items-center gap-1.5">
          {order.map((type) => {
            const count = counts[type];
            if (!count) return null;
            
            // Render small piece
            const pieceCode = `${color}${type}`;
            const SvgPiece = ChessPieces[pieceCode];
            
            return (
              <div key={type} className="flex items-center bg-white/5 rounded px-1.5 py-0.5 border border-white/5">
                <div 
                  className="w-5 h-5 flex items-center justify-center"
                  style={{ filter: pieceTheme !== 'classic' ? getPieceThemeFilter(pieceTheme) : undefined }}
                >
                  {SvgPiece && <SvgPiece className="w-full h-full" />}
                </div>
                {count > 1 && (
                  <span className="text-[10px] font-bold text-gray-400 ml-0.5">
                    ×{count}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Material advantage highlight indicator */}
      {showAdvantageNum && advValue > 0 && (
        <span className="ml-auto text-xs font-bold leading-none bg-emerald-500/20 text-emerald-400 py-0.5 px-1.5 rounded border border-emerald-500/20">
          +{advValue}
        </span>
      )}
    </div>
  );
};
