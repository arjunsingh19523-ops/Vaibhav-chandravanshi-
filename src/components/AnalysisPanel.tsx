/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MoveAnalysis, MoveClassification } from '../types.ts';
import { Sparkles, Trophy, ChevronLeft, ChevronRight, Activity, Award, HelpCircle, RefreshCw } from 'lucide-react';

interface AnalysisPanelProps {
  moveHistory: { sNo: number; san: string; from: string; to: string; fen: string; color: 'w' | 'b' }[];
  currentMoveIndex: number;
  onJumpToMove: (index: number) => void;
  onAnalyzeMatch: () => void;
  isAnalyzing: boolean;
  coachSummary: string | null;
  analyzedMoves: MoveAnalysis[]; // Moves annotated by Gemini
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  moveHistory,
  currentMoveIndex,
  onJumpToMove,
  onAnalyzeMatch,
  isAnalyzing,
  coachSummary,
  analyzedMoves,
}) => {
  const [selectedAnalyzedMoveIdx, setSelectedAnalyzedMoveIdx] = useState<number | null>(null);

  // Group moves into pairs (White & Black) for standard notation view
  const pairs: { sNo: number; white: string; black?: string; whiteIdx: number; blackIdx: number }[] = [];
  
  for (let i = 0; i < moveHistory.length; i += 2) {
    pairs.push({
      sNo: Math.floor(i / 2) + 1,
      white: moveHistory[i].san,
      whiteIdx: i,
      black: moveHistory[i + 1] ? moveHistory[i + 1].san : undefined,
      blackIdx: i + 1,
    });
  }

  // Get classification styling
  const getLabelStyles = (classification: MoveClassification) => {
    switch (classification) {
      case 'brilliant':
        return 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30';
      case 'best':
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      case 'excellent':
        return 'bg-emerald-600/10 text-emerald-300 border border-emerald-500/10';
      case 'good':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'book':
        return 'bg-amber-100/10 text-amber-200 border border-amber-200/20';
      case 'inaccuracy':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'mistake':
        return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
      case 'blunder':
        return 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse';
      default:
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/10';
    }
  };

  const getLabelEmoji = (classification: MoveClassification) => {
    switch (classification) {
      case 'brilliant': return '!!';
      case 'best': return '★';
      case 'excellent': return '✓';
      case 'good': return '👍';
      case 'book': return '📖';
      case 'inaccuracy': return '?!';
      case 'mistake': return '?';
      case 'blunder': return '??';
      default: return '•';
    }
  };

  // Find analysis details for a move
  const handleMoveClick = (idx: number) => {
    onJumpToMove(idx);
    
    // Check if we have analysis for this move number & player side
    const targetMove = moveHistory[idx];
    const itemNumber = Math.floor(idx / 2) + 1;
    const itemSide = idx % 2 === 0 ? 'white' : 'black';

    const foundAnalysisIdx = analyzedMoves.findIndex(
      m => m.moveNumber === itemNumber && m.player === itemSide
    );

    if (foundAnalysisIdx !== -1) {
      setSelectedAnalyzedMoveIdx(foundAnalysisIdx);
    } else {
      setSelectedAnalyzedMoveIdx(null);
    }
  };

  const activeMoveAnalysis = selectedAnalyzedMoveIdx !== null ? analyzedMoves[selectedAnalyzedMoveIdx] : null;

  return (
    <div className="flex flex-col gap-4 bg-[#171725] rounded-2xl border border-white/5 p-5 shadow-lg max-w-md w-full h-[620px]">
      
      {/* 1. Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-400" />
          <h3 className="text-white font-extrabold text-base">Match Analysis</h3>
        </div>
        <span className="text-[10px] font-bold text-gray-500 font-mono">
          Moves: {moveHistory.length}
        </span>
      </div>

      {/* 2. Moves Navigation controls */}
      <div className="flex gap-2 justify-center py-2 bg-[#212134]/30 rounded-xl border border-white/5">
        <button
          id="prev-pos-btn"
          disabled={currentMoveIndex < 0}
          onClick={() => handleMoveClick(Math.max(-1, currentMoveIndex - 1))}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-xs text-gray-300 font-medium px-4 py-1.5">
          {currentMoveIndex === -1 ? 'Starting Position' : `Move ${currentMoveIndex + 1} of ${moveHistory.length}`}
        </span>
        <button
          id="next-pos-btn"
          disabled={currentMoveIndex >= moveHistory.length - 1}
          onClick={() => handleMoveClick(Math.min(moveHistory.length - 1, currentMoveIndex + 1))}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* 3. Moves notation grid list */}
      <div className="flex-1 overflow-y-auto bg-[#1c1c2a]/95 rounded-xl border border-[#302d44]/30 p-3 h-48 select-none">
        {pairs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <HelpCircle className="w-8 h-8 text-gray-600 mb-2" />
            <p className="text-xs font-semibold text-gray-500">No moves played yet.</p>
            <p className="text-[10px] text-gray-600 mt-1">Start moving pieces on the board to fill history.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-y-1 text-xs">
            {pairs.map((pair) => {
              // Check if White / Black has analysis class indices
              const whiteAnalysis = analyzedMoves.find(m => m.moveNumber === pair.sNo && m.player === 'white');
              const blackAnalysis = analyzedMoves.find(m => m.moveNumber === pair.sNo && m.player === 'black');

              return (
                <div key={pair.sNo} className="col-span-2 grid grid-cols-12 items-center hover:bg-white/5 py-1 px-1.5 rounded transition-all">
                  <span className="col-span-2 font-mono text-[10px] text-gray-500">{pair.sNo}.</span>
                  
                  {/* White move */}
                  <div 
                    onClick={() => handleMoveClick(pair.whiteIdx)}
                    className={`col-span-5 flex items-center justify-between cursor-pointer py-1 px-1.5 rounded mr-1 transition-all ${
                      currentMoveIndex === pair.whiteIdx 
                        ? 'bg-blue-600/30 text-white font-extrabold border border-blue-500/20' 
                        : 'text-gray-300 hover:bg-white/5 font-medium'
                    }`}
                  >
                    <span>{pair.white}</span>
                    {whiteAnalysis && (
                      <span className={`text-[8px] font-black px-1 rounded-full ${getLabelStyles(whiteAnalysis.classification)}`}>
                        {getLabelEmoji(whiteAnalysis.classification)}
                      </span>
                    )}
                  </div>

                  {/* Black move */}
                  {pair.black ? (
                    <div 
                      onClick={() => handleMoveClick(pair.blackIdx)}
                      className={`col-span-5 flex items-center justify-between cursor-pointer py-1 px-1.5 rounded transition-all ${
                        currentMoveIndex === pair.blackIdx 
                          ? 'bg-blue-600/30 text-white font-extrabold border border-blue-500/20' 
                          : 'text-gray-300 hover:bg-white/5 font-medium'
                      }`}
                    >
                      <span>{pair.black}</span>
                      {blackAnalysis && (
                        <span className={`text-[8px] font-black px-1 rounded-full ${getLabelStyles(blackAnalysis.classification)}`}>
                          {getLabelEmoji(blackAnalysis.classification)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="col-span-5" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Deep AI Coach review triggers */}
      <div className="flex flex-col gap-3">
        {analyzedMoves.length === 0 ? (
          <button
            id="analyze-game-btn"
            disabled={moveHistory.length < 2 || isAnalyzing}
            onClick={onAnalyzeMatch}
            className="flex items-center justify-center gap-2.5 w-full bg-[#3b82f6] hover:bg-blue-500 disabled:bg-[#312e46]/60 text-white py-3 px-4 rounded-xl font-bold text-xs shadow-lg transition-all active:scale-[0.98] disabled:cursor-not-allowed group"
          >
            <Sparkles className="w-4 h-4 text-emerald-400 group-hover:animate-bounce" />
            {isAnalyzing ? 'Evaluating Position Matrix...' : '✨ Run Full Gemini AI Game Review'}
          </button>
        ) : (
          <button
            id="re-analyze-game-btn"
            disabled={isAnalyzing}
            onClick={onAnalyzeMatch}
            className="flex items-center justify-center gap-2 w-full bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 hover:border-white/20 py-2.5 px-4 rounded-xl font-semibold text-xs transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Recalculate Review
          </button>
        )}

        {/* Loading overlay for high immersive feel */}
        {isAnalyzing && (
          <div className="flex flex-col gap-2 p-3.5 bg-[#212134]/60 border border-blue-500/20 rounded-xl animate-pulse">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] text-blue-400 uppercase tracking-wider font-extrabold font-mono">Analyzing squares with Coach Review engine</span>
            </div>
            <p className="text-[11px] text-gray-400 leading-tight">
              Gemini is assessing casting moves, pawn structures, structural gaps, and generating tactical chess alternatives...
            </p>
          </div>
        )}

        {/* 5. Coach commentary output card */}
        {coachSummary && !isAnalyzing && (
          <div className="flex flex-col gap-1.5 p-3.5 bg-[#22c55e]/5 border border-emerald-500/20 rounded-xl overflow-y-auto max-h-[160px]">
            <div className="flex items-center gap-2 mb-1.5">
              <Award className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-extrabold">Elite Coach Match Summary</span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed font-medium">
              {coachSummary}
            </p>
          </div>
        )}

        {/* 6. Draw/Explanation Drawer for clicked classified move */}
        {activeMoveAnalysis && !isAnalyzing && (
          <div className="flex flex-col bg-[#212134]/80 p-3 rounded-xl border border-white/5 text-xs animate-fadeIn max-h-[200px] overflow-y-auto">
            <div className="flex items-center gap-2 mb-2 pb-1 border-b border-white/5">
              <span className="font-mono font-bold text-white">Move {activeMoveAnalysis.moveNumber} ({activeMoveAnalysis.player === 'white' ? 'W' : 'B'})</span>
              <span className="font-bold text-gray-300 font-sans">{activeMoveAnalysis.san}</span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${getLabelStyles(activeMoveAnalysis.classification)}`}>
                {activeMoveAnalysis.classification.toUpperCase()}
              </span>
            </div>
            <p className="text-gray-300 font-sans text-xs leading-relaxed mb-2.5">
              {activeMoveAnalysis.explanation}
            </p>

            {/* Alternative suggestion block */}
            {activeMoveAnalysis.alternative && (
              <div className="bg-[#1c1c2a] p-2 rounded border border-white/5 text-[11px]">
                <div className="flex items-center gap-1.5 mb-1">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-400 font-extrabold uppercase text-[9px]">Coach Better Alternative:</span>
                  <span className="text-white font-mono font-extrabold bg-[#2a2a3e] px-1 py-0.5 rounded">{activeMoveAnalysis.alternative.san}</span>
                </div>
                <p className="text-gray-400 leading-snug">
                  {activeMoveAnalysis.alternative.explanation}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
