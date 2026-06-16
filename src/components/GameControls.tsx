/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BotDifficulty, BotPersona, GameMode, BoardTheme, GameFormat, ChessVariant } from '../types.ts';
import { BOT_PERSONAS } from '../utils/personas.ts';
import { Undo, RefreshCw, Eye, Swords, ShieldCheck, Download, Upload, Copy, Check, Bluetooth } from 'lucide-react';

interface GameControlsProps {
  activePersona: BotPersona;
  onPersonaChange: (bot: BotPersona) => void;
  gameFormat: GameFormat;
  onGameFormatChange: (format: GameFormat) => void;
  chessVariant: ChessVariant;
  onChessVariantChange: (variant: ChessVariant) => void;
  gameMode: GameMode;
  onGameModeChange: (mode: GameMode) => void;
  boardTheme: BoardTheme;
  onBoardThemeChange: (theme: BoardTheme) => void;
  whitePieceTheme: string;
  onWhitePieceThemeChange: (theme: string) => void;
  blackPieceTheme: string;
  onBlackPieceThemeChange: (theme: string) => void;
  playerColorSelection: 'white' | 'black';
  onPlayerColorChange: (color: 'white' | 'black') => void;
  onUndo: () => void;
  onNewGame: () => void;
  onFlipBoard: () => void;
  exportPgn: () => void;
  onImportFen: (fen: string) => void;
  onImportPgn: (pgn: string) => void;
  currentFen: string;
  currentPgn: string;
}

export const GameControls: React.FC<GameControlsProps> = ({
  activePersona,
  onPersonaChange,
  gameFormat,
  onGameFormatChange,
  chessVariant,
  onChessVariantChange,
  gameMode,
  onGameModeChange,
  boardTheme,
  onBoardThemeChange,
  whitePieceTheme,
  onWhitePieceThemeChange,
  blackPieceTheme,
  onBlackPieceThemeChange,
  playerColorSelection,
  onPlayerColorChange,
  onUndo,
  onNewGame,
  onFlipBoard,
  exportPgn,
  onImportFen,
  onImportPgn,
  currentFen,
  currentPgn,
}) => {
  const [fenInput, setFenInput] = useState('');
  const [pgnInput, setPgnInput] = useState('');
  const [showImportPanel, setShowImportPanel] = useState(false);
  const [copiedFen, setCopiedFen] = useState(false);

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-5 bg-[#171725] rounded-2xl border border-white/5 p-5 shadow-lg max-w-md w-full">
      {/* 1. Mode Selector Segment */}
      <div className="flex gap-1.5 bg-[#212134] p-1 rounded-xl">
        <button
          id="mode-play-btn"
          onClick={() => onGameModeChange('play')}
          className={`flex-1 py-2 px-1.5 rounded-lg font-medium text-[11px] flex items-center justify-center gap-1.5 transition-all ${
            gameMode === 'play'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          👤 Play Bot
        </button>
        <button
          id="mode-multiplayer-btn"
          onClick={() => onGameModeChange('multiplayer')}
          className={`flex-1 py-2 px-1.5 rounded-lg font-medium text-[11px] flex items-center justify-center gap-1.5 transition-all ${
            gameMode === 'multiplayer'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          👥 Online PVP
        </button>
        <button
          id="mode-review-btn"
          onClick={() => onGameModeChange('analysis')}
          className={`flex-1 py-2 px-1.5 rounded-lg font-medium text-[11px] flex items-center justify-center gap-1.5 transition-all ${
            gameMode === 'analysis'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          🔍 Review
        </button>
        <button
          id="mode-pass-and-play-btn"
          onClick={() => onGameModeChange('pass_and_play')}
          className={`flex-1 py-2 px-1.5 rounded-lg font-medium text-[11px] flex items-center justify-center gap-1.5 transition-all ${
            gameMode === 'pass_and_play'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          🤝 Pass & Play
        </button>
        <button
          id="mode-bluetooth-btn"
          onClick={() => onGameModeChange('bluetooth')}
          className={`flex-1 py-2 px-1.5 rounded-lg font-medium text-[11px] flex items-center justify-center gap-1.5 transition-all outline-none ${
            gameMode === 'bluetooth'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Bluetooth className="w-3.5 h-3.5" /> Bluetooth
        </button>
      </div>

      {/* 2. Choose Opponent / Bot Difficulty Grid */}
      {(gameMode === 'play' || gameMode === 'pass_and_play') && (
        <div className="flex flex-col gap-3">
          {/* Game Format / Time Control Segment */}
          <div className="flex flex-col gap-1.5 bg-[#212134]/30 p-2.5 rounded-xl border border-white/5">
            <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
              ⚡ Game Type / Time Control
            </label>
            <div className="grid grid-cols-5 gap-1 bg-[#212134] p-1 rounded-lg">
              {([
                { id: 'bullet', label: '1 min', desc: 'Bullet (1m)' },
                { id: 'blitz', label: '3 min', desc: 'Quick Blitz (3m)' },
                { id: 'rapid', label: '10 min', desc: 'Rapid (10m)' },
                { id: 'classical', label: '30 min', desc: 'Classical (30m)' },
                { id: 'infinite', label: 'No Limit', desc: 'Free practice play' }
              ] as const).map((fmt) => {
                const isFmtSelected = gameFormat === fmt.id;
                return (
                  <button
                    key={fmt.id}
                    id={`format-btn-${fmt.id}`}
                    type="button"
                    onClick={() => onGameFormatChange(fmt.id)}
                    title={fmt.desc}
                    className={`py-1.5 rounded-md text-[9px] font-bold transition-all transition-duration-150 ${
                      isFmtSelected
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-extrabold'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {fmt.label}
                  </button>
                );
              })}
            </div>
            
            <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mt-1">
              ♟ Chess Variant
            </label>
            <div className="grid grid-cols-4 gap-1 bg-[#212134] p-1 rounded-lg">
              {([
                { id: 'standard', label: 'Standard', desc: 'Classic rules' },
                { id: 'king_of_the_hill', label: 'Hill Top', desc: 'King to center wins (d4/d5/e4/e5)' },
                { id: '360_chess', label: '360 Chess', desc: 'Circular 360 board (Incoming)' },
                { id: '4_player', label: '4 Player', desc: '4 Player mode (Incoming)' }
              ] as const).map((v) => {
                const isSelected = chessVariant === v.id;
                return (
                  <button
                    key={v.id}
                    id={`variant-btn-${v.id}`}
                    type="button"
                    onClick={() => onChessVariantChange(v.id as ChessVariant)}
                    title={v.desc}
                    className={`py-1.5 px-1 rounded-md text-[8.5px] font-bold transition-all transition-duration-150 ${
                      isSelected
                        ? 'bg-pink-600 text-white shadow-md shadow-pink-500/20 font-extrabold'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {v.label}
                  </button>
                );
              })}
            </div>
          </div>

          {gameMode === 'play' && (
            <>
              <label className="text-[11px] uppercase tracking-wider font-bold text-gray-500">
                Select Your opponent
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-[175px] overflow-y-auto pr-0.5 scrollbar-thin">
                {BOT_PERSONAS.map((bot) => {
                  const isSelected = bot.id === activePersona.id;
                  return (
                    <button
                      key={bot.id}
                      id={`bot-card-${bot.id}`}
                      onClick={() => onPersonaChange(bot)}
                      className={`flex flex-col text-left p-2.5 rounded-xl border transition-all relative overflow-hidden group shrink-0 ${
                        isSelected
                          ? 'bg-blue-600/10 border-blue-500/60 shadow-lg'
                          : 'bg-[#212134]/50 border-white/5 hover:border-white/10 hover:bg-[#212134]'
                      }`}
                    >
                      {/* Miniature Avatar indicator */}
                      <div className="flex items-center gap-1.5 mb-1 z-10">
                        <div className={`w-5.5 h-5.5 rounded-full bg-gradient-to-tr ${bot.avatarGradient} flex items-center justify-center text-xs shadow-md`}>
                          {bot.avatarEmoji}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-white font-bold text-[11px] leading-none">{bot.name}</span>
                          <span className="text-[9px] text-gray-400 font-mono mt-0.5 leading-none">{bot.rating} ELO</span>
                        </div>
                      </div>
                      <p className="text-[9px] text-gray-400 leading-tight line-clamp-2 mt-0.5 z-10">{bot.description}</p>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Quick orientation helper */}
          <div className="flex items-center justify-between bg-[#212134]/30 p-2.5 rounded-xl border border-white/5 mt-0.5">
            <span className="text-xs text-gray-400">Play Side:</span>
            <div className="flex gap-1.5">
              {(['white', 'black'] as const).map((side) => (
                <button
                  key={side}
                  id={`side-btn-${side}`}
                  onClick={() => onPlayerColorChange(side)}
                  className={`py-1 px-3 rounded-lg text-xs font-semibold capitalize border transition-all ${
                    playerColorSelection === side
                      ? 'bg-white text-black border-white'
                      : 'bg-transparent text-gray-400 border-white/10 hover:border-white/25'
                  }`}
                >
                  {side}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Aesthetic Configuration (Board Theme) */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] uppercase tracking-wider font-bold text-gray-500">
          Chessboard Aesthetic Theme
        </label>
        <div className="grid grid-cols-4 gap-1.5 bg-[#212134] p-1.5 rounded-xl">
          {(['classic', 'cosmic', 'wood', 'dark'] as const).map((t) => {
            const isSelected = boardTheme === t;
            return (
              <button
                key={t}
                id={`theme-btn-${t}`}
                onClick={() => onBoardThemeChange(t)}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold capitalize transition-all ${
                  isSelected
                    ? 'bg-white text-black font-extrabold shadow'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <label className="text-[11px] uppercase tracking-wider font-bold text-gray-500 mb-1.5 block">
              White Piece Color
            </label>
            <div className="grid grid-cols-4 gap-1.5 bg-[#212134] p-1.5 rounded-xl">
              {(['classic', 'red', 'blue', 'green', 'cyan', 'purple', 'gold'] as const).map((t) => {
                const isSelected = whitePieceTheme === t;
                return (
                  <button
                    key={t}
                    id={`white-piecetheme-btn-${t}`}
                    onClick={() => onWhitePieceThemeChange(t)}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-bold capitalize transition-all ${
                      isSelected
                        ? 'bg-white text-black font-extrabold shadow'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider font-bold text-gray-500 mb-1.5 block">
              Black Piece Color
            </label>
            <div className="grid grid-cols-4 gap-1.5 bg-[#212134] p-1.5 rounded-xl">
              {(['classic', 'red', 'blue', 'green', 'cyan', 'purple', 'gold'] as const).map((t) => {
                const isSelected = blackPieceTheme === t;
                return (
                  <button
                    key={t}
                    id={`black-piecetheme-btn-${t}`}
                    onClick={() => onBlackPieceThemeChange(t)}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-bold capitalize transition-all ${
                      isSelected
                        ? 'bg-white text-black font-extrabold shadow'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Action Mechanics Controllers */}
      <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            id="new-game-btn"
            onClick={onNewGame}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-700/10 transition-all active:scale-[0.98]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            New Match
          </button>
          
          <button
            id="undo-btn"
            onClick={onUndo}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-300 font-semibold text-xs transition-all active:scale-[0.98]"
          >
            <Undo className="w-3.5 h-3.5" />
            Undo Move
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            id="flip-btn"
            onClick={onFlipBoard}
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-300 font-semibold text-xs transition-all"
          >
            Flip Perspective
          </button>

          <button
            id="export-pgn-btn"
            onClick={exportPgn}
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#312e46]/65 hover:bg-[#312e46] border border-white/5 text-gray-300 font-bold text-xs transition-all"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            Export PGN
          </button>
        </div>
      </div>

      {/* 5. Study, Import and Code Copy Tools */}
      <div className="border-t border-white/5 pt-3">
        <button
          id="toggle-import-panel-btn"
          onClick={() => setShowImportPanel(!showImportPanel)}
          className="flex items-center justify-between w-full py-2 px-3 bg-[#212134]/20 hover:bg-[#212134]/40 rounded-xl text-xs text-blue-400 font-semibold transition-all"
        >
          <span className="flex items-center gap-2">
            <Upload className="w-3.5 h-3.5" />
            Import / Study Game Codes
          </span>
          <span>{showImportPanel ? '▲' : '▼'}</span>
        </button>

        {showImportPanel && (
          <div className="flex flex-col gap-3.5 mt-3 bg-[#212134]/30 p-3 rounded-xl border border-white/5 animate-fadeIn">
            {/* FEN Box */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-mono font-bold text-gray-500 uppercase">Load Position FEN</span>
              <div className="flex gap-1">
                <input
                  id="fen-input-field"
                  type="text"
                  placeholder="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -"
                  value={fenInput}
                  onChange={(e) => setFenInput(e.target.value)}
                  className="flex-1 bg-[#151522] border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  id="load-fen-btn"
                  onClick={() => {
                    if (fenInput.trim()) {
                      onImportFen(fenInput);
                      setFenInput('');
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 rounded-lg font-bold transition-colors"
                >
                  Load
                </button>
              </div>
            </div>

            {/* PGN Box */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-mono font-bold text-gray-500 uppercase">Load PGN History</span>
              <textarea
                id="pgn-input-field"
                placeholder="Paste PGN here e.g. 1. e4 e5 2. Nf3 ..."
                value={pgnInput}
                onChange={(e) => setPgnInput(e.target.value)}
                rows={2}
                className="w-full bg-[#151522] border border-white/10 rounded-lg p-2 text-[10px] text-white focus:outline-none focus:border-blue-500 resize-none"
              />
              <button
                id="load-pgn-btn"
                onClick={() => {
                  if (pgnInput.trim()) {
                    onImportPgn(pgnInput);
                    setPgnInput('');
                  }
                }}
                className="w-full bg-[#3b82f6] hover:bg-blue-500 text-white py-1 text-xs rounded-lg font-bold transition-all"
              >
                Apply PGN Moves List
              </button>
            </div>

            {/* Current Copy-outs */}
            <div className="flex flex-col gap-2 pt-2 border-t border-white/5 text-[10px]">
              <div className="flex items-center justify-between text-gray-400 bg-[#1c1c2b] p-2 rounded">
                <span className="font-mono truncate max-w-[200px]">{currentFen}</span>
                <button
                  id="copy-fen-btn"
                  onClick={() => copyToClipboard(currentFen, setCopiedFen)}
                  className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-0.5 ml-2 shrink-0"
                >
                  {copiedFen ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  {copiedFen ? 'Copied' : 'Copy FEN'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
