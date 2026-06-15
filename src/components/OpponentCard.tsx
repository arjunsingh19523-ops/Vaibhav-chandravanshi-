/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BotPersona } from '../types.ts';
import { Sparkles, MessageSquare } from 'lucide-react';

interface OpponentCardProps {
  persona: BotPersona;
  gameStatus: 'active' | 'check' | 'checkmate' | 'draw' | 'stalemate';
  activeTurn: 'white' | 'black';
  latestCommentary: string;
  isThinking: boolean;
  isAiThinkingComment: boolean;
  memeReaction?: 'bruh' | 'noice' | 'damage' | null;
}

export const OpponentCard: React.FC<OpponentCardProps> = ({
  persona,
  gameStatus,
  activeTurn,
  latestCommentary,
  isThinking,
  isAiThinkingComment,
  memeReaction = null,
}) => {
  // Turn indicator
  const isBotTurn = (persona.difficulty !== 'beginner' && activeTurn === 'black') || (persona.difficulty === 'beginner' && activeTurn === 'black'); 
  // Wait, in our game white is always the user and black is the bot by default unless otherwise specified or flipped. We'll pass the active turn.

  // Get status label badge
  const getStatusBadge = () => {
    switch (gameStatus) {
      case 'check':
        return <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-black uppercase px-2 py-0.5 rounded-full animate-bounce">⚠️ King in Check</span>;
      case 'checkmate':
        return <span className="bg-rose-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full">🏆 Checkmate! Game Over</span>;
      case 'draw':
        return <span className="bg-gray-500/20 text-gray-300 border border-gray-500/30 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">🤝 Draw Match</span>;
      case 'stalemate':
        return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full font-mono">Stalemate</span>;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-4 bg-[#171725] rounded-2xl border border-white/5 p-4.5 shadow-lg w-full">
      {/* 1. Profile section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar frame */}
          <div className="relative">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${persona.avatarGradient} flex items-center justify-center text-2xl shadow-md border border-white/10`}>
              {persona.avatarEmoji}
            </div>
            {isThinking && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-500"></span>
              </span>
            )}
            
            {/* Meme Reaction Comic Balloon Pop overlay */}
            {memeReaction && (
              <div className={`absolute -bottom-2 -left-6 px-2.5 py-1 whitespace-nowrap text-[10px] font-black uppercase rounded-lg border shadow-xl z-30 select-none flex items-center gap-1 animate-bounce ${
                memeReaction === 'bruh' 
                  ? 'bg-zinc-800 text-zinc-200 border-zinc-600 shadow-zinc-950/80' 
                  : memeReaction === 'noice' 
                  ? 'bg-emerald-600 text-yellow-300 border-emerald-400 shadow-emerald-950/80'
                  : 'bg-red-600 text-white border-red-400 shadow-red-950/80 font-mono tracking-widest'
              }`}>
                {memeReaction === 'bruh' && '💀 Bruh...'}
                {memeReaction === 'noice' && '✨ NOICE! 👍'}
                {memeReaction === 'damage' && '💥 EMOTIONAL DAMAGE! 💔'}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="text-white font-extrabold text-base leading-none">{persona.name}</h3>
              <span className="text-[10px] font-mono font-bold bg-[#212134] text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/10">
                {persona.rating} ELO
              </span>
            </div>
            <span className="text-gray-400 text-xs mt-1 font-medium capitalize">
              Difficulty: <span className="text-gray-300 font-semibold">{persona.title}</span>
            </span>
          </div>
        </div>

        {/* Dynamic Status label */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          {getStatusBadge()}
          {gameStatus === 'active' && (
            <span className="flex items-center gap-1.5 text-[10px] text-gray-400 font-semibold bg-[#212134]/40 px-2 py-0.5 rounded-full">
              <span className={`w-2 h-2 rounded-full ${isBotTurn ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
              {isThinking ? 'Opponent is thinking...' : isBotTurn ? 'Opponent Turn' : 'Your Turn'}
            </span>
          )}
        </div>
      </div>

      {/* 2. Interactive chat bubbles reacting from Gemini */}
      <div className="relative flex flex-col bg-[#1c1c2a]/90 rounded-xl p-3 border border-white/5 shadow-inner">
        <div className="flex items-center gap-1.5 pb-1 mb-1 border-b border-white/5">
          <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider">Opponent Dialogue React</span>
          
          {isAiThinkingComment && (
            <span className="ml-auto flex items-center gap-1 text-[10px] text-blue-400 font-medium">
              <Sparkles className="w-3 h-3 animate-spin" />
              AIding comment...
            </span>
          )}
        </div>

        {isAiThinkingComment && !latestCommentary ? (
          <div className="flex flex-col gap-1 py-1.5">
            <div className="h-3 w-3/4 bg-white/5 rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-white/5 rounded animate-pulse mt-1" />
          </div>
        ) : (
          <p className="text-xs text-gray-100 leading-relaxed font-sans font-medium italic">
            "{latestCommentary || persona.greeting}"
          </p>
        )}
      </div>
    </div>
  );
};
