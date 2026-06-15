/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, Send, Swords, Play, Plus, ChevronRight, LogOut, RefreshCw, Flag, ShieldCheck, MessageSquare } from 'lucide-react';
import { GameFormat } from '../types.ts';

interface MultiplayerControlProps {
  clientId: string;
  roomId: string | null;
  roomState: any | null;
  nickname: string;
  onNicknameChange: (name: string) => void;
  isConnected: boolean;
  onJoinRoom: (roomId: string, colorPref: 'white' | 'black' | 'random') => void;
  onQuickPlay: (format: GameFormat) => void;
  onResign: () => void;
  onLeaveRoom: () => void;
  onSendChat: (text: string) => void;
  onRematch: () => void;
}

export const MultiplayerControl: React.FC<MultiplayerControlProps> = ({
  clientId,
  roomId,
  roomState,
  nickname,
  onNicknameChange,
  isConnected,
  onJoinRoom,
  onQuickPlay,
  onResign,
  onLeaveRoom,
  onSendChat,
  onRematch,
}) => {
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<GameFormat>('blitz');
  const [preferredColor, setPreferredColor] = useState<'white' | 'black' | 'random'>('random');

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomState?.chatHistory?.length]);

  const copyRoomCode = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendChat(chatInput.trim());
    setChatInput('');
  };

  const handleCreatePrivateRoom = () => {
    const generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    onJoinRoom(generatedCode, preferredColor);
  };

  const handleJoinPrivateRoom = () => {
    const code = joinCodeInput.trim().toUpperCase();
    if (!code) return;
    onJoinRoom(code, preferredColor);
  };

  // Determine user identity inside the room
  const isWhite = roomState?.players?.white?.clientId === clientId;
  const isBlack = roomState?.players?.black?.clientId === clientId;
  const isPlayer = isWhite || isBlack;

  const currentRoleString = isWhite 
    ? 'White Piece Commander' 
    : isBlack 
    ? 'Black Piece Commander' 
    : roomState 
    ? 'Spectating Advisor' 
    : 'Lobbyist';

  return (
    <div className="flex flex-col gap-4 bg-[#171725] rounded-2xl border border-white/5 p-5 shadow-lg max-w-md w-full animate-fadeIn">
      
      {/* 1. Header showing WebSocket integrity status */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md">
            👑
          </div>
          <div className="flex flex-col">
            <span className="text-white font-bold text-xs leading-none">Online PVP Multiplayer</span>
            <span className="text-[9px] text-[#6272a4] font-bold mt-1">Live Server Interaction</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 shadow-[0_0_8px_#34d399]' : 'bg-red-500 animate-pulse'}`} />
          <span className="text-[10px] font-mono font-bold text-gray-400 capitalize">
            {isConnected ? 'Sync Active' : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* 2. Before Entering Room: Configuration Lobby Dashboard */}
      {!roomId ? (
        <div className="flex flex-col gap-4">
          
          {/* Profile Handle Config */}
          <div className="flex flex-col gap-1.5 bg-[#212134]/40 p-3 rounded-xl border border-white/5">
            <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
              👤 Chess Nickname Identification
            </label>
            <input
              id="nick-input-field"
              type="text"
              value={nickname}
              onChange={(e) => onNicknameChange(e.target.value.substring(0, 16))}
              className="bg-[#12121e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-blue-500"
              placeholder="e.g. Grandmaster Joe"
            />
          </div>

          {/* Time control formats */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
              ⚡ Select Game Format Matchmaking
            </label>
            <div className="grid grid-cols-4 gap-1.5 bg-[#212134] p-1.5 rounded-xl">
              {([
                { id: 'bullet', label: 'Bullet 1m' },
                { id: 'blitz', label: 'Blitz 3m' },
                { id: 'rapid', label: 'Rapid 10m' },
                { id: 'classical', label: 'Classic 30m' }
              ] as const).map((fmt) => {
                const isSelected = selectedFormat === fmt.id;
                return (
                  <button
                    key={fmt.id}
                    id={`mp-format-${fmt.id}`}
                    onClick={() => setSelectedFormat(fmt.id)}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {fmt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Preference selections */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
              🔘 Preferred Seat Color
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-[#212134] p-1 py-1 rounded-xl">
              {(['white', 'random', 'black'] as const).map((color) => {
                const isSelected = preferredColor === color;
                return (
                  <button
                    key={color}
                    id={`color-pref-${color}`}
                    onClick={() => setPreferredColor(color)}
                    className={`py-1 rounded-lg text-[10px] font-bold capitalize transition-all ${
                      isSelected
                        ? 'bg-white text-black font-extrabold'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {color}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lobby Dual Action Pathways */}
          <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
            
            {/* Quick Matchmaking pathway */}
            <button
              id="mp-quick-play-btn"
              disabled={!isConnected}
              onClick={() => onQuickPlay(selectedFormat)}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-extrabold text-xs shadow-lg shadow-blue-500/10 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Swords className="w-4 h-4" />
              Quick Match Matchmaking
            </button>

            <span className="text-center text-[10px] text-gray-500 font-bold my-1">OR CREATE/ENTER PRIVATE CODES</span>

            <div className="grid grid-cols-2 gap-2">
              <button
                id="mp-host-btn"
                disabled={!isConnected}
                onClick={handleCreatePrivateRoom}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-bold text-xs transition-all disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5 text-blue-400" />
                Host Battle
              </button>

              <div className="flex gap-1">
                <input
                  id="mp-join-input"
                  type="text"
                  placeholder="CODE"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  className="bg-[#12121e] border border-white/10 rounded-xl px-2 w-[85px] text-center font-mono font-bold text-xs uppercase text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  id="mp-join-btn"
                  disabled={!isConnected || !joinCodeInput.trim()}
                  onClick={handleJoinPrivateRoom}
                  className="flex-1 flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-xl font-bold transition-all disabled:opacity-50 px-1"
                >
                  Join
                </button>
              </div>
            </div>

          </div>

        </div>
      ) : (
        // 3. Inside the Active Multiplayer Room
        <div className="flex flex-col gap-4 animate-fadeIn">
          
          {/* Active Room Code display and Seat Info */}
          <div className="flex items-center justify-between bg-[#212134]/30 border border-white/5 p-3 rounded-xl">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-gray-500">Battle Room Invitation</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-white text-base font-black tracking-widest">{roomId}</span>
                <button
                  id="mp-copy-code-btn"
                  onClick={copyRoomCode}
                  className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-white/5 transition-all flex items-center gap-1"
                  title="Copy Room Code URL Link"
                >
                  {copiedCode ? <Check className="w-4.5 h-4.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="text-[10px] font-bold">{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-gray-400 block">Game Mode</span>
              <span className="text-amber-400 text-xs font-black capitalize mt-0.5 block">{roomState?.format || selectedFormat}</span>
            </div>
          </div>

          {/* List of active players on seats */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] uppercase font-mono font-black text-[#6272a4]">Fighter Participants</span>
            <div className="grid grid-cols-2 gap-2">
              {/* White Player */}
              <div className={`p-2.5 rounded-xl border flex flex-col justify-between h-[65px] ${
                roomState?.players?.white 
                  ? 'bg-white/5 border-white/10' 
                  : 'bg-transparent border-dashed border-white/5'
              }`}>
                <span className="text-[9px] text-gray-400 font-bold block">⚪ Player White</span>
                <span className="text-white font-extrabold text-xs truncate mt-1">
                  {roomState?.players?.white?.name || 'Waiting...'}
                </span>
                {roomState?.players?.white?.clientId === clientId && (
                  <span className="text-[8px] text-blue-400 font-extrabold self-start mt-0.5">YOU</span>
                )}
              </div>

              {/* Black Player */}
              <div className={`p-2.5 rounded-xl border flex flex-col justify-between h-[65px] ${
                roomState?.players?.black 
                  ? 'bg-white/5 border-white/10' 
                  : 'bg-transparent border-dashed border-white/5'
              }`}>
                <span className="text-[9px] text-gray-400 font-bold block">⚫ Player Black</span>
                <span className="text-white font-extrabold text-xs truncate mt-1">
                  {roomState?.players?.black?.name || 'Waiting...'}
                </span>
                {roomState?.players?.black?.clientId === clientId && (
                  <span className="text-[8px] text-blue-400 font-extrabold self-start mt-0.5 font-sans">YOU</span>
                )}
              </div>
            </div>
          </div>

          {/* 4. Scrollable real-time Chat history */}
          <div className="flex flex-col gap-1.5 bg-[#12121e] rounded-xl border border-white/5 p-3">
            <span className="text-[10px] uppercase font-mono font-black text-[#50fa7b] flex items-center gap-1">
              <MessageSquare className="w-3 h-3 text-green-400" />
              Battlefield chat
            </span>

            <div className="h-[120px] overflow-y-auto pr-1 flex flex-col gap-1.5 scrollbar-thin">
              {roomState?.chatHistory?.map((chat: any, idx: number) => {
                let roleColor = 'text-[#6272a4]';
                if (chat.sender === 'White') roleColor = 'text-white border-l-2 border-white pl-1.5';
                else if (chat.sender === 'Black') roleColor = 'text-[#ff79c6] border-l-2 border-[#ff79c6] pl-1.5';
                else if (chat.sender === 'System') roleColor = 'text-[#f1fa8c] font-semibold italic text-[10px]';

                return (
                  <div key={idx} className="text-[11px] leading-tight flex flex-col">
                    <div className="flex items-center gap-1">
                      <span className={`font-black tracking-wide text-[10px] ${roleColor}`}>{chat.name}</span>
                      <span className="text-[8px] text-gray-600 font-mono ml-auto">{chat.timestamp}</span>
                    </div>
                    <p className="text-gray-300 mt-0.5 break-words font-medium ml-1.5">{chat.text}</p>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Send Form */}
            <form onSubmit={handleSendChat} className="flex gap-1 mt-2">
              <input
                id="mp-chat-input"
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type match remarks..."
                className="flex-1 bg-[#1a1a2b] border border-white/5 focus:border-blue-500 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none text-white font-medium"
              />
              <button
                id="mp-chat-send"
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white p-1.5 px-3 rounded-lg flex items-center justify-center transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* 5. In-game battle controllers */}
          <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
            <div className="flex gap-2">
              {roomState?.status === 'active' && isPlayer && (
                <button
                  id="mp-resign-btn"
                  onClick={onResign}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 hover:border-red-500/50 text-red-400 font-extrabold text-xs transition-all active:scale-[0.98]"
                >
                  <Flag className="w-3.5 h-3.5" />
                  Resign Battle
                </button>
              )}

              {(roomState?.status === 'checkmate' || roomState?.status === 'draw' || roomState?.status === 'stalemate' || roomState?.status === 'timeout' || roomState?.status === 'abandoned') && (
                <button
                  id="mp-rematch-btn"
                  onClick={onRematch}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-extrabold text-xs shadow-md shadow-emerald-700/10 transition-all active:scale-[0.98]"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Swap & Rematch
                </button>
              )}

              <button
                id="mp-leave-btn"
                onClick={onLeaveRoom}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-300 font-bold text-xs transition-all"
              >
                <LogOut className="w-3.5 h-3.5 text-gray-400" />
                Leave Room
              </button>
            </div>

            <div className="text-center text-[10px] text-gray-500 font-mono mt-1 mt-0.5">
              Assigned Seat: {currentRoleString}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
