/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ChessPieces, getPieceThemeFilter } from './ChessPieces.tsx';
import { motion, AnimatePresence } from 'motion/react';
import { BoardTheme } from '../types.ts';

interface ChessBoardProps {
  fen: string;
  onMove: (from: string, to: string, promotion?: string) => boolean;
  legalMoves: { from: string; to: string; promotion?: string }[];
  lastMove: { from: string; to: string } | null;
  kingInCheckSquare: string | null;
  orientation: 'white' | 'black';
  theme: BoardTheme;
  whitePieceTheme?: string;
  blackPieceTheme?: string;
  variant?: string;
  isInteractive: boolean;
}

interface PieceInfo {
  type: string;
  square: string;
}

const getPiecesFromFen = (fenString: string): PieceInfo[] => {
  const list: PieceInfo[] = [];
  const parts = fenString.split(' ');
  const rows = parts[0].split('/');
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  rows.forEach((row, r) => {
    let c = 0;
    for (let charIdx = 0; charIdx < row.length; charIdx++) {
      const char = row[charIdx];
      if (isNaN(parseInt(char))) {
        const isWhite = char === char.toUpperCase();
        const pieceKey = `${isWhite ? 'w' : 'b'}${char.toLowerCase()}`;
        const square = `${files[c]}${ranks[r]}`;
        list.push({ type: pieceKey, square });
        c++;
      } else {
        c += parseInt(char);
      }
    }
  });
  return list;
};

export const ChessBoard: React.FC<ChessBoardProps> = ({
  fen,
  onMove,
  legalMoves,
  lastMove,
  kingInCheckSquare,
  orientation,
  theme,
  whitePieceTheme = 'classic',
  blackPieceTheme = 'classic',
  variant = 'standard',
  isInteractive,
}) => {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [draggedSquare, setDraggedSquare] = useState<string | null>(null);
  const [promotionPending, setPromotionPending] = useState<{ from: string; to: string } | null>(null);

  // Stateful piece tracking for beautiful, lightning-fast animations
  const [pieces, setPieces] = useState<{ id: string; type: string; square: string }[]>([]);

  // Keep piece states synchronized with FEN updates using stable identifier mappings
  useEffect(() => {
    const newPiecesList = getPiecesFromFen(fen);

    setPieces((prevPieces) => {
      // If no pre-existing tracks, bootstrap initial stable IDs
      if (prevPieces.length === 0) {
        const typeCounts: { [key: string]: number } = {};
        return newPiecesList.map(p => {
          typeCounts[p.type] = (typeCounts[p.type] || 0) + 1;
          return {
            id: `${p.type}-${typeCounts[p.type]}`,
            type: p.type,
            square: p.square
          };
        });
      }

      const remainingStatePieces = [...prevPieces];
      const unmatchedNewPieces = [...newPiecesList];
      const nextPiecesState: { id: string; type: string; square: string }[] = [];

      // Phase 1: Perfect static match (same coordinate & same piece type)
      for (let i = remainingStatePieces.length - 1; i >= 0; i--) {
        const sp = remainingStatePieces[i];
        const matchIdx = unmatchedNewPieces.findIndex(np => np.square === sp.square && np.type === sp.type);
        if (matchIdx !== -1) {
          nextPiecesState.push(sp);
          remainingStatePieces.splice(i, 1);
          unmatchedNewPieces.splice(matchIdx, 1);
        }
      }

      // Phase 2: Piece movement (same piece type shifted to a different coordinate)
      for (let i = unmatchedNewPieces.length - 1; i >= 0; i--) {
        const np = unmatchedNewPieces[i];
        const matchIdx = remainingStatePieces.findIndex(sp => sp.type === np.type);
        if (matchIdx !== -1) {
          const matchedSp = remainingStatePieces[matchIdx];
          nextPiecesState.push({
            ...matchedSp,
            square: np.square // Glide smoothly to new position!
          });
          remainingStatePieces.splice(matchIdx, 1);
          unmatchedNewPieces.splice(i, 1);
        }
      }

      // Phase 3: Promotions (Pawn of matching color upgraded to new character type)
      for (let i = unmatchedNewPieces.length - 1; i >= 0; i--) {
        const np = unmatchedNewPieces[i];
        const isWhite = np.type.startsWith('w');
        const pawnType = isWhite ? 'wp' : 'bp';
        const matchIdx = remainingStatePieces.findIndex(sp => sp.type === pawnType);
        if (matchIdx !== -1) {
          const matchedSp = remainingStatePieces[matchIdx];
          nextPiecesState.push({
            ...matchedSp,
            type: np.type,
            square: np.square
          });
          remainingStatePieces.splice(matchIdx, 1);
          unmatchedNewPieces.splice(i, 1);
        }
      }

      // Phase 4: Leftovers (e.g. fresh game or custom resets)
      unmatchedNewPieces.forEach(np => {
        const uniqueId = `${np.type}-new-${Math.random().toString(36).substring(2, 6)}`;
        nextPiecesState.push({
          id: uniqueId,
          type: np.type,
          square: np.square
        });
      });

      return nextPiecesState;
    });
  }, [fen]);

  // Parse FEN into an 8x8 matrix for board background state
  const boardRepresentation: string[][] = Array(8).fill(null).map(() => Array(8).fill(''));
  const parts = fen.split(' ');
  const rows = parts[0].split('/');

  rows.forEach((row, r) => {
    let c = 0;
    for (let charIdx = 0; charIdx < row.length; charIdx++) {
      const char = row[charIdx];
      if (isNaN(parseInt(char))) {
        const isWhite = char === char.toUpperCase();
        boardRepresentation[r][c] = `${isWhite ? 'w' : 'b'}${char.toLowerCase()}`;
        c++;
      } else {
        c += parseInt(char);
      }
    }
  });

  // Theme colors
  const themes = {
    classic: {
      light: 'bg-[#f0d9b5] text-[#b58863]',
      dark: 'bg-[#b58863] text-[#f0d9b5]',
      highlight: 'bg-emerald-500/40 ring-4 ring-emerald-400',
      lastMoveHighlight: 'bg-yellow-400/35',
      checkHighlight: 'bg-rose-500/50 shadow-[inset_0_0_12px_rgba(244,63,94,0.8)] animate-pulse',
      boardBorder: 'border-[#8B5A2B]',
    },
    cosmic: {
      light: 'bg-[#1e293b] text-cyan-400 border border-cyan-950/30',
      dark: 'bg-[#0f172a] text-[#38bdf8] border border-cyan-950/30',
      highlight: 'bg-cyan-500/40 ring-4 ring-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.6)]',
      lastMoveHighlight: 'bg-violet-500/30',
      checkHighlight: 'bg-red-500/50 shadow-[inset_0_0_16px_rgba(239,68,68,1)] animate-pulse',
      boardBorder: 'border-[#1e1e38]',
    },
    wood: {
      light: 'bg-[#eecfa1] text-[#8b5a2b]',
      dark: 'bg-[#8b5a2b] text-[#eecfa1]',
      highlight: 'bg-orange-500/35 ring-4 ring-orange-300',
      lastMoveHighlight: 'bg-amber-100/30',
      checkHighlight: 'bg-red-600/50 animate-pulse',
      boardBorder: 'border-[#5A3816]',
    },
    dark: {
      light: 'bg-[#404040] text-gray-400',
      dark: 'bg-[#262626] text-gray-500',
      highlight: 'bg-amber-400/30 ring-4 ring-amber-300',
      lastMoveHighlight: 'bg-neutral-500/40',
      checkHighlight: 'bg-red-600/40 animate-pulse',
      boardBorder: 'border-[#171717]',
    }
  };

  const activeTheme = themes[theme] || themes.classic;

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  // Handle click on a square
  const handleSquareClick = (square: string, piece: string) => {
    if (!isInteractive) return;

    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }

      const legals = legalMoves.filter(m => m.from === selectedSquare && m.to === square);
      
      if (legals.length > 0) {
        const isPromo = legals.some(m => m.promotion);
        triggerMove(selectedSquare, square, isPromo ? undefined : legals[0].promotion);
      } else {
        const isWhitePiece = piece.startsWith('w');
        const isCurrentTurnWhite = fen.split(' ')[1] === 'w';
        
        if ((isCurrentTurnWhite && isWhitePiece) || (!isCurrentTurnWhite && !isWhitePiece)) {
          setSelectedSquare(square);
        } else {
          setSelectedSquare(null);
        }
      }
    } else {
      if (!piece) return;
      const isWhitePiece = piece.startsWith('w');
      const isCurrentTurnWhite = fen.split(' ')[1] === 'w';

      if ((isCurrentTurnWhite && isWhitePiece) || (!isCurrentTurnWhite && !isWhitePiece)) {
        setSelectedSquare(square);
      }
    }
  };

  const triggerMove = (from: string, to: string, existingPromotion?: string) => {
    const isPawnMove = boardRepresentation[ranks.indexOf(from[1])]?.[files.indexOf(from[0])]?.endsWith('p');
    const isPromotionRank = to[1] === '8' || to[1] === '1';

    if (isPawnMove && isPromotionRank && !existingPromotion) {
      setPromotionPending({ from, to });
    } else {
      const moved = onMove(from, to, existingPromotion);
      if (moved) {
        setSelectedSquare(null);
      }
    }
  };

  const handlePromotionSelect = (promoType: string) => {
    if (promotionPending) {
      onMove(promotionPending.from, promotionPending.to, promoType);
      setPromotionPending(null);
      setSelectedSquare(null);
    }
  };

  // Drag-and-drop triggers
  const handleDragStart = (e: React.DragEvent, square: string) => {
    if (!isInteractive) {
      e.preventDefault();
      return;
    }
    setDraggedSquare(square);
    setSelectedSquare(square);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetSquare: string) => {
    e.preventDefault();
    if (!draggedSquare || !isInteractive) return;

    const legals = legalMoves.filter(m => m.from === draggedSquare && m.to === targetSquare);
    if (legals.length > 0) {
      const isPromo = legals.some(m => m.promotion);
      triggerMove(draggedSquare, targetSquare, isPromo ? undefined : legals[0].promotion);
    }
    setDraggedSquare(null);
  };

  const displayRanks = orientation === 'white' ? ranks : [...ranks].reverse();
  const displayFiles = orientation === 'white' ? files : [...files].reverse();

  return (
    <div id="chessboard-container" className="relative select-none w-full max-w-lg aspect-square rounded-2xl overflow-hidden shadow-2xl p-2 bg-[#181824] border-4 border-[#312e46]/60">
      
      {/* Promotion Choice Dialog Modal */}
      <AnimatePresence>
        {promotionPending && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center p-4"
            onClick={() => setPromotionPending(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#242436] rounded-2xl border border-white/10 p-6 flex flex-col items-center w-full max-w-xs text-center"
            >
              <h4 className="text-white font-semibold text-lg mb-4">Pawn Promotion</h4>
              <p className="text-gray-400 text-xs mb-6">Choose your piece advancement</p>
              
              <div className="grid grid-cols-4 gap-3 w-full">
                {[
                  { type: 'q', label: 'Queen' },
                  { type: 'r', label: 'Rook' },
                  { type: 'b', label: 'Bishop' },
                  { type: 'n', label: 'Knight' }
                ].map((p) => {
                  const isWhitePromo = fen.split(' ')[1] === 'w';
                  const pieceCode = `${isWhitePromo ? 'w' : 'b'}${p.type}`;
                  const themeToUse = isWhitePromo ? whitePieceTheme : blackPieceTheme;
                  const SvgPiece = ChessPieces[pieceCode];
                  return (
                    <button
                      key={p.type}
                      id={`promo-btn-${p.type}`}
                      onClick={() => handlePromotionSelect(p.type)}
                      className="p-2 aspect-square rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/20 flex flex-col items-center justify-center transition-all group"
                    >
                      {SvgPiece && (
                        <div style={{ filter: themeToUse !== 'classic' ? getPieceThemeFilter(themeToUse) : undefined }}>
                          <SvgPiece className="w-10 h-10 group-hover:scale-110 transition-transform" />
                        </div>
                      )}
                      <span className="text-[10px] text-gray-400 mt-1">{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative w-full h-full rounded-lg overflow-hidden">
        {/* Board squares grid layer */}
        <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
          {displayRanks.map((rank, rIdx) => {
            return displayFiles.map((file, fIdx) => {
              const squareName = `${file}${rank}`;
              const piece = boardRepresentation[ranks.indexOf(rank)][files.indexOf(file)];
              
              const isDarkSquare = (ranks.indexOf(rank) + files.indexOf(file)) % 2 !== 0;
              const bgClass = isDarkSquare ? activeTheme.dark : activeTheme.light;
              
              const isSelected = selectedSquare === squareName;
              const isLegalTarget = selectedSquare && legalMoves.some(m => m.from === selectedSquare && m.to === squareName);
              const isKingInCheck = kingInCheckSquare === squareName;
              const isLastMoveSrcOrDst = lastMove && (lastMove.from === squareName || lastMove.to === squareName);

              const showRankLabel = fIdx === 0;
              const showFileLabel = rIdx === 7;

              return (
                <div
                  key={squareName}
                  id={`square-${squareName}`}
                  onClick={() => handleSquareClick(squareName, piece)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, squareName)}
                  className={`relative flex items-center justify-center aspect-square cursor-pointer transition-colors ${bgClass}
                    ${isKingInCheck ? activeTheme.checkHighlight : ''}
                    ${isLastMoveSrcOrDst && !isSelected && !isKingInCheck ? activeTheme.lastMoveHighlight : ''}
                    ${isSelected ? 'ring-4 ring-amber-400 ring-inset bg-amber-400/20' : ''}
                  `}
                >
                  {/* Variant Special Overlays */}
                  {variant === 'king_of_the_hill' && ['d4', 'd5', 'e4', 'e5'].includes(squareName) && (
                     <div className="absolute inset-0 z-10 pointer-events-none ring-2 ring-inset ring-amber-400 bg-amber-400/10 opacity-75" />
                  )}

                  {/* Legal Move Indicators */}
                  {isLegalTarget && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none select-none">
                      {piece ? (
                        <div className={`w-[85%] h-[85%] rounded-full border-[5px] transition-all duration-200
                          ${
                            theme === 'cosmic'
                              ? 'border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.7)]'
                              : theme === 'classic'
                              ? 'border-[#5c4033]/30'
                              : theme === 'wood'
                              ? 'border-[#422006]/35'
                              : 'border-white/25'
                          }
                        `} />
                      ) : (
                        <div className={`w-[26%] h-[26%] rounded-full transition-all duration-200 transform scale-100 hover:scale-130
                          ${
                            theme === 'cosmic'
                              ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                              : theme === 'classic'
                              ? (isDarkSquare ? 'bg-[#5c4033]/24' : 'bg-[#5c4033]/18')
                              : theme === 'wood'
                              ? (isDarkSquare ? 'bg-[#422006]/30' : 'bg-[#422006]/22')
                              : (isDarkSquare ? 'bg-white/20' : 'bg-black/28')
                          }
                        `} />
                      )}
                    </div>
                  )}

                  {/* Rank Annotations (left) */}
                  {showRankLabel && (
                    <span className="absolute top-1 left-1 text-[10px] font-bold opacity-60 pointer-events-none">
                      {rank}
                    </span>
                  )}

                  {/* File Annotations (bottom) */}
                  {showFileLabel && (
                    <span className="absolute bottom-1 right-1 text-[10px] font-bold opacity-60 pointer-events-none">
                      {file}
                    </span>
                  )}
                </div>
              );
            });
          })}
        </div>

        {/* Pieces overlay layer for smooth absolute transitions */}
        <div className="absolute inset-0 pointer-events-none z-20">
          {pieces.map((p) => {
            const SvgComponent = ChessPieces[p.type];
            if (!SvgComponent) return null;

            const file = p.square[0];
            const rank = p.square[1];

            const fileIdx = displayFiles.indexOf(file);
            const rankIdx = displayRanks.indexOf(rank);

            if (fileIdx === -1 || rankIdx === -1) return null;

            const leftPercent = fileIdx * 12.5;
            const topPercent = rankIdx * 12.5;
            const themeToUse = p.type.startsWith('w') ? whitePieceTheme : blackPieceTheme;

            return (
              <motion.div
                key={p.id}
                layout
                transition={{
                  type: 'spring',
                  stiffness: 480, // ultra response fast
                  damping: 32,    // ultra snappy smooth
                  mass: 0.6
                }}
                draggable={isInteractive}
                onDragStart={(e) => handleDragStart(e, p.square)}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSquareClick(p.square, p.type);
                }}
                style={{
                  position: 'absolute',
                  width: '12.5%',
                  height: '12.5%',
                  left: `${leftPercent}%`,
                  top: `${topPercent}%`,
                  filter: themeToUse !== 'classic' ? getPieceThemeFilter(themeToUse) : undefined
                }}
                className="flex items-center justify-center p-0.5 cursor-pointer pointer-events-auto select-none"
              >
                <SvgComponent className="w-[90%] h-[90%] drop-shadow-md select-none pointer-events-none active:scale-105 transition-transform" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
