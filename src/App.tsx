/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Chess } from 'chess.js';
import { BotDifficulty, BotPersona, GameMode, BoardTheme, MoveAnalysis, GameFormat } from './types.ts';
import { getPersonaByDifficulty } from './utils/personas.ts';
import { getBotMove, getCapturedCountAndDiff } from './utils/chessEngine.ts';
import { ChessBoard } from './components/ChessBoard.tsx';
import { OpponentCard } from './components/OpponentCard.tsx';
import { GameControls } from './components/GameControls.tsx';
import { CapturedPieces } from './components/CapturedPieces.tsx';
import { AnalysisPanel } from './components/AnalysisPanel.tsx';
import { MultiplayerControl } from './components/MultiplayerControl.tsx';
import { Swords, Eye, Trophy, Calendar, Sparkles, HelpCircle, ShieldCheck, Volume2, VolumeX } from 'lucide-react';
import { soundEffects } from './utils/soundEffects.ts';

export default function App() {
  // We use a mutable ref for chess.js to prevent double-render issues or desynchronized move attempts
  const chessRef = useRef<Chess>(new Chess());

  // Board State
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [moveHistory, setMoveHistory] = useState<{ sNo: number; san: string; from: string; to: string; fen: string; color: 'w' | 'b' }[]>([]);
  const [currentMoveIdx, setCurrentMoveIdx] = useState<number>(-1); // -1 is starting position
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  
  // Game Configuration States
  const [gameMode, setGameMode] = useState<GameMode>('play');
  const [gameFormat, setGameFormat] = useState<GameFormat>('blitz');
  const [difficulty, setDifficulty] = useState<BotDifficulty>('intermediate');
  const [boardTheme, setBoardTheme] = useState<BoardTheme>('cosmic');
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');

  // Dual Chess Clocks states (in seconds)
  const [whiteTime, setWhiteTime] = useState<number>(180); // Default to 3 min (Blitz)
  const [blackTime, setBlackTime] = useState<number>(180);

  // Status Indicators
  const [kingInCheckSquare, setKingInCheckSquare] = useState<string | null>(null);
  const [gameStatus, setGameStatus] = useState<'active' | 'check' | 'checkmate' | 'draw' | 'stalemate'>('active');

  // Online PVP Multiplayer States
  const [clientId] = useState(() => {
    let id = localStorage.getItem('onlineChessClientId');
    if (!id) {
      id = 'usr_' + Math.random().toString(36).substring(2, 12);
      localStorage.setItem('onlineChessClientId', id);
    }
    return id;
  });

  const [nickname, setNickname] = useState(() => {
    return localStorage.getItem('onlineChessNickname') || ('Fighter-' + Math.random().toString(36).substring(2, 6).toUpperCase());
  });

  const handleNicknameChange = (newNick: string) => {
    setNickname(newNick);
    localStorage.setItem('onlineChessNickname', newNick);
  };

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [multiplayerRoomId, setMultiplayerRoomId] = useState<string | null>(null);
  const [multiplayerRoomState, setMultiplayerRoomState] = useState<any | null>(null);
  const [isWsConnected, setIsWsConnected] = useState(false);

  // Captured pieces and material differential
  const [capturedW, setCapturedW] = useState<string[]>([]); // pieces originally White captured by Black/Bot
  const [capturedB, setCapturedB] = useState<string[]>([]); // pieces originally Black captured by White/User
  const [materialDiff, setMaterialDiff] = useState<number>(0);

  // AI Bots + Commentary States
  const [activePersona, setActivePersona] = useState<BotPersona>(getPersonaByDifficulty('intermediate'));
  const [latestCommentary, setLatestCommentary] = useState<string>('');
  const [isBotThinking, setIsBotThinking] = useState<boolean>(false);
  const [isAiThinkingComment, setIsAiThinkingComment] = useState<boolean>(false);

  // Meme states
  const [memeReaction, setMemeReaction] = useState<'bruh' | 'noice' | 'damage' | null>(null);

  const triggerMemeReaction = (type: 'bruh' | 'noice' | 'damage') => {
    setMemeReaction(type);
    if (type === 'bruh') {
      soundEffects.playBruh();
    } else if (type === 'noice') {
      soundEffects.playNoice();
    } else if (type === 'damage') {
      soundEffects.playEmotionalDamage();
    }
    // Automatically clear the comic balloon pop after 3 seconds
    setTimeout(() => {
      setMemeReaction(prev => prev === type ? null : prev);
    }, 3000);
  };

  // Sound Synth Mute State
  const [isMuted, setIsMuted] = useState<boolean>(soundEffects.getMuteState());

  const handleToggleMute = () => {
    const muted = soundEffects.toggleMute();
    setIsMuted(muted);
  };

  // Post-Game Analysis Modes
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [coachSummary, setCoachSummary] = useState<string | null>(null);
  const [analyzedMoves, setAnalyzedMoves] = useState<MoveAnalysis[]>([]);

  // Helper to resolve initial selection clock seconds
  const getInitialSeconds = (format: GameFormat): number => {
    switch (format) {
      case 'bullet': return 60;
      case 'blitz': return 180;
      case 'rapid': return 600;
      case 'classical': return 1800;
      default: return 0;
    }
  };

  // Helper to format remaining clock counts
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Format click handler
  const handleGameFormatChange = (fmt: GameFormat) => {
    setGameFormat(fmt);
    const initialSecs = getInitialSeconds(fmt);
    setWhiteTime(initialSecs);
    setBlackTime(initialSecs);
    // Restart match automatically with new timers
    const chess = chessRef.current;
    chess.load('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    setFen(chess.fen());
    setMoveHistory([]);
    setCurrentMoveIdx(-1);
    setLastMove(null);
    setKingInCheckSquare(null);
    setGameStatus('active');
    setCoachSummary(null);
    setAnalyzedMoves([]);
    setLatestCommentary(activePersona.greeting);
  };

  // Clock Countdown logic ticking
  useEffect(() => {
    if (gameMode !== 'play' || gameStatus !== 'active' || gameFormat === 'infinite') return;
    if (moveHistory.length === 0) return; // Clocks tick down on the first move!

    const currentTurn = chessRef.current.turn(); // 'w' or 'b'
    
    const interval = setInterval(() => {
      if (currentTurn === 'w') {
        setWhiteTime((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setGameStatus('draw');
            setLatestCommentary("Time's up! You ran out of time! Black wins on time. [MEME:BRUH]");
            soundEffects.playCheckmate();
            return 0;
          }
          return prev - 1;
        });
      } else {
        setBlackTime((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setGameStatus('checkmate');
            setLatestCommentary(`Time's up! ${activePersona.name} ran out of time! You win on time! [MEME:NOICE]`);
            soundEffects.playCheckmate();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameMode, gameStatus, gameFormat, moveHistory.length, fen, activePersona.name]);

  // Manage Live WebSocket Lifecycles
  useEffect(() => {
    if (gameMode !== 'multiplayer') {
      if (socket) {
        socket.close();
        setSocket(null);
        setIsWsConnected(false);
      }
      setMultiplayerRoomId(null);
      setMultiplayerRoomState(null);
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    console.log("[WS Client] Connecting to:", wsUrl);

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("[WS Client] Connection active!");
      setIsWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'room-update') {
          const room = data.room;
          setMultiplayerRoomState(room);
          setMultiplayerRoomId(room.id);

          setFen(room.fen);
          chessRef.current.load(room.fen);

          const syncedHistory = room.moveHistory.map((m: any) => ({
            sNo: m.sNo,
            san: m.san,
            from: m.from,
            to: m.to,
            fen: m.fen,
            color: m.color
          }));
          setMoveHistory(syncedHistory);
          setCurrentMoveIdx(syncedHistory.length - 1);

          setWhiteTime(room.whiteTime);
          setBlackTime(room.blackTime);

          if (room.players?.black?.clientId === clientId) {
            setBoardOrientation('black');
          } else {
            setBoardOrientation('white');
          }

          updateCheckAndSafetyStatus(chessRef.current);

          // Audio feedback triggers
          if (room.moveHistory.length > 0) {
            const lastMoveItem = room.moveHistory[room.moveHistory.length - 1];
            setLastMove({ from: lastMoveItem.from, to: lastMoveItem.to });
            soundEffects.playMove();
          } else {
            setLastMove(null);
          }

          if (room.status === 'checkmate') {
            setGameStatus('checkmate');
            soundEffects.playCheckmate();
          } else if (room.status === 'stalemate') {
            setGameStatus('stalemate');
          } else if (room.status === 'draw') {
            setGameStatus('draw');
          } else if (room.status === 'timeout' || room.status === 'abandoned') {
            setGameStatus('draw');
            soundEffects.playCheckmate();
          } else {
            setGameStatus('active');
          }
        } else if (data.type === 'error') {
          alert(data.message || "An unexpected match incident occurred!");
        }
      } catch (err) {
        console.error("WS error processing message payload:", err);
      }
    };

    ws.onerror = (e) => {
      console.error("[WS Client] Socket error:", e);
    };

    ws.onclose = () => {
      console.log("[WS Client] Disconnected.");
      setIsWsConnected(false);
      setSocket(null);
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [gameMode]);

  // Multiplayer Clocks Countdown local predictor
  useEffect(() => {
    if (gameMode !== 'multiplayer' || !multiplayerRoomState || multiplayerRoomState.status !== 'active' || multiplayerRoomState.format === 'infinite') return;

    const interval = setInterval(() => {
      const activeColor = multiplayerRoomState.activeColor;
      if (activeColor === 'w') {
        setWhiteTime((prev) => Math.max(0, prev - 1));
      } else {
        setBlackTime((prev) => Math.max(0, prev - 1));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameMode, multiplayerRoomState?.activeColor, multiplayerRoomState?.status, multiplayerRoomState?.format]);

  // Interactive socket controller callbacks
  const handleJoinMultiplayerRoom = (targetRoomId: string, colorPref: 'white' | 'black' | 'random' = 'random') => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'join-room',
        roomId: targetRoomId,
        name: nickname,
        clientId,
        preferredColor: colorPref,
        isPrivate: true
      }));
    }
  };

  const handleQuickPlay = (selectedFormat: GameFormat) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'quick-play',
        name: nickname,
        clientId,
        format: selectedFormat
      }));
    }
  };

  const handleResignMultiplayer = () => {
    if (socket && socket.readyState === WebSocket.OPEN && multiplayerRoomId) {
      socket.send(JSON.stringify({
        type: 'resign',
        roomId: multiplayerRoomId
      }));
    }
  };

  const handleLeaveMultiplayerRoom = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'leave-room' }));
    }
    setMultiplayerRoomId(null);
    setMultiplayerRoomState(null);
    handleResetGame();
  };

  const handleSendMultiplayerChat = (text: string) => {
    if (socket && socket.readyState === WebSocket.OPEN && multiplayerRoomId) {
      socket.send(JSON.stringify({
        type: 'chat',
        roomId: multiplayerRoomId,
        text
      }));
    }
  };

  const handleRematchMultiplayer = () => {
    if (socket && socket.readyState === WebSocket.OPEN && multiplayerRoomId) {
      socket.send(JSON.stringify({
        type: 'rematch',
        roomId: multiplayerRoomId
      }));
    }
  };

  const getFighterHUDData = (role: 'far' | 'near') => {
    if (gameMode === 'multiplayer') {
      const opposingRole = boardOrientation === 'white' ? 'black' : 'white';
      const homeRole = boardOrientation === 'white' ? 'white' : 'black';

      if (role === 'far') {
        const oppUser = multiplayerRoomState?.players?.[opposingRole];
        return {
          name: oppUser ? oppUser.name : 'Waiting for Opponent...',
          emoji: opposingRole === 'white' ? '⚪' : '⚫',
          subtitle: `Rating: 1500? • Seat: ${opposingRole.toUpperCase()}`,
          gradient: 'from-[#44475a]/40 to-[#282a36]/20 border border-[#6272a4]/20'
        };
      } else {
        const homeUser = multiplayerRoomState?.players?.[homeRole];
        return {
          name: homeUser ? homeUser.name : nickname,
          emoji: homeRole === 'white' ? '⚪' : '⚫',
          subtitle: `Rating: 1500? • Seat: ${homeRole.toUpperCase()}`,
          gradient: 'from-[#44475a]/45 to-[#282a36]/25 border border-[#8be9fd]/20 border-teal-500/10'
        };
      }
    } else {
      if (role === 'far') {
        return {
          name: boardOrientation === 'white' ? activePersona.name : 'You (Guest)',
          emoji: boardOrientation === 'white' ? activePersona.avatarEmoji : '👤',
          subtitle: boardOrientation === 'white' ? `Rating: ${activePersona.rating}` : 'Rating: 1500?',
          gradient: boardOrientation === 'white' ? activePersona.avatarGradient : 'from-blue-600/30 to-blue-600/10 border border-blue-500/20',
          isBot: boardOrientation === 'white'
        };
      } else {
        return {
          name: boardOrientation === 'white' ? 'You (Guest)' : activePersona.name,
          emoji: boardOrientation === 'white' ? '👤' : activePersona.avatarEmoji,
          subtitle: boardOrientation === 'white' ? 'Rating: 1500?' : `Rating: ${activePersona.rating}`,
          gradient: boardOrientation === 'white' ? 'from-blue-600/30 to-blue-600/10 border border-blue-500/20' : activePersona.avatarGradient,
          isBot: boardOrientation === 'black'
        };
      }
    }
  };

  // Sync orientation with play color choice by default
  useEffect(() => {
    if (gameMode !== 'multiplayer') {
      setBoardOrientation(playerColor);
    }
  }, [playerColor, gameMode]);

  // Sync captured pieces whenever FEN changes
  useEffect(() => {
    const data = getCapturedCountAndDiff(fen);
    setCapturedW(data.captured.w);
    setCapturedB(data.captured.b);
    setMaterialDiff(data.diff);
  }, [fen]);

  // Fetch bot commentary from server-side proxy
  const fetchBotCommentary = async (currentFen: string, history: string[]) => {
    setIsAiThinkingComment(true);
    try {
      const response = await fetch('/api/chess/commentary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fen: currentFen,
          moveHistory: history,
          botName: activePersona.name,
          botDifficulty: activePersona.difficulty,
          botTitle: activePersona.title,
          systemInstruction: activePersona.systemInstruction
        })
      });
      const data = await response.json();
      if (data.commentary) {
        let text = data.commentary;
        let reactionToTrigger: 'bruh' | 'noice' | 'damage' | null = null;

        if (text.includes('[MEME:BRUH]')) {
          reactionToTrigger = 'bruh';
          text = text.replace('[MEME:BRUH]', '').trim();
        } else if (text.includes('[MEME:NOICE]')) {
          reactionToTrigger = 'noice';
          text = text.replace('[MEME:NOICE]', '').trim();
        } else if (text.includes('[MEME:EMOTIONAL_DAMAGE]')) {
          reactionToTrigger = 'damage';
          text = text.replace('[MEME:EMOTIONAL_DAMAGE]', '').trim();
        }

        setLatestCommentary(text);

        if (reactionToTrigger) {
          triggerMemeReaction(reactionToTrigger);
        }
      }
    } catch (err) {
      console.error("Failed to load dialogue commentary", err);
    } finally {
      setIsAiThinkingComment(false);
    }
  };

  // Perform Gemini full game analysis
  const handleAnalyzeMatch = async () => {
    if (moveHistory.length === 0) return;
    setIsAnalyzing(true);
    setCoachSummary(null);
    setAnalyzedMoves([]);

    try {
      const response = await fetch('/api/chess/analyse-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: moveHistory,
          difficulty: difficulty
        })
      });

      const result = await response.json();
      if (result.coachSummary) {
        setCoachSummary(result.coachSummary);
      }
      if (result.moves) {
        setAnalyzedMoves(result.moves);
      }
    } catch (err) {
      console.error("Match analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Evaluates if game is ended and returns state checks
   */
  const updateCheckAndSafetyStatus = (gameInstance: Chess) => {
    if (gameInstance.isCheckmate()) {
      setGameStatus('checkmate');
      setKingInCheckSquare(findKingSquare(gameInstance, gameInstance.turn()));
    } else if (gameInstance.isDraw() || gameInstance.isThreefoldRepetition() || gameInstance.isInsufficientMaterial()) {
      setGameStatus('draw');
      setKingInCheckSquare(null);
    } else if (gameInstance.isStalemate()) {
      setGameStatus('stalemate');
      setKingInCheckSquare(null);
    } else if (gameInstance.inCheck()) {
      setGameStatus('check');
      setKingInCheckSquare(findKingSquare(gameInstance, gameInstance.turn()));
    } else {
      setGameStatus('active');
      setKingInCheckSquare(null);
    }
  };

  const findKingSquare = (g: Chess, turnSide: 'w' | 'b'): string | null => {
    const board = g.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === 'k' && piece.color === turnSide) {
          const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
          const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
          return `${files[c]}${ranks[r]}`;
        }
      }
    }
    return null;
  };

  // Human user triggers move
  const handleUserMove = (from: string, to: string, promotion?: string): boolean => {
    if (gameMode === 'multiplayer') {
      if (socket && socket.readyState === WebSocket.OPEN && multiplayerRoomId) {
        socket.send(JSON.stringify({
          type: 'make-move',
          roomId: multiplayerRoomId,
          from,
          to,
          promotion: promotion || 'q'
        }));
        return true;
      }
      return false;
    }

    // Prevent moves if it's the bot's turn to play
    const chess = chessRef.current;
    
    // Check match constraints
    const turn = chess.turn();
    const isUserTurn = (playerColor === 'white' && turn === 'w') || (playerColor === 'black' && turn === 'b');
    
    if (gameStatus === 'checkmate' || gameStatus === 'draw' || gameStatus === 'stalemate') return false;
    if (!isUserTurn && gameMode === 'play') return false;

    try {
      const moveResult = chess.move({ from, to, promotion: promotion || 'q' });
      if (moveResult) {
        const nextFen = chess.fen();
        setFen(nextFen);
        setLastMove({ from, to });

        // Trigger dynamic synthesized Sound Effect
        if (chess.isCheckmate()) {
          soundEffects.playCheckmate();
        } else if (chess.inCheck()) {
          soundEffects.playCheck();
        } else if (moveResult.captured) {
          soundEffects.playCapture();
        } else {
          soundEffects.playMove();
        }

        // Add to history
        const newRecord = {
          sNo: moveHistory.length + 1,
          san: moveResult.san,
          from,
          to,
          fen: nextFen,
          color: moveResult.color as 'w' | 'b'
        };

        const nextHistory = [...moveHistory, newRecord];
        setMoveHistory(nextHistory);
        setCurrentMoveIdx(nextHistory.length - 1);
        
        // Update check indicators
        updateCheckAndSafetyStatus(chess);

        // Fetch commentary reacting to User's move
        const recentSanList = nextHistory.map(h => h.san);
        fetchBotCommentary(nextFen, recentSanList);

        return true;
      }
    } catch (err) {
      console.warn("Invalid move attempted", err);
    }
    return false;
  };

  // Bot play logic hook
  useEffect(() => {
    if (gameMode !== 'play') return;
    if (gameStatus === 'checkmate' || gameStatus === 'draw' || gameStatus === 'stalemate') return;

    const chess = chessRef.current;
    const turn = chess.turn();
    const isBotTurn = (playerColor === 'white' && turn === 'b') || (playerColor === 'black' && turn === 'w');

    if (isBotTurn && !isBotThinking) {
      setIsBotThinking(true);

      // Simulate human-like strategic pause delay (between 700 - 1500 ms)
      const thinkDelay = 700 + Math.random() * 800;

      const timer = setTimeout(() => {
        try {
          const currentFen = chess.fen();
          const aiMove = getBotMove(currentFen, difficulty);

          const moveResult = chess.move(aiMove);
          if (moveResult) {
            const nextFen = chess.fen();
            setFen(nextFen);
            setLastMove({ from: aiMove.from, to: aiMove.to });

            // Trigger dynamic synthesized Sound Effect for AI move
            if (chess.isCheckmate()) {
              soundEffects.playCheckmate();
            } else if (chess.inCheck()) {
              soundEffects.playCheck();
            } else if (moveResult.captured) {
              soundEffects.playCapture();
            } else {
              soundEffects.playMove();
            }

            const newRecord = {
              sNo: moveHistory.length + 1,
              san: moveResult.san,
              from: aiMove.from,
              to: aiMove.to,
              fen: nextFen,
              color: moveResult.color as 'w' | 'b'
            };

            const nextHistory = [...moveHistory, newRecord];
            setMoveHistory(nextHistory);
            setCurrentMoveIdx(nextHistory.length - 1);

            updateCheckAndSafetyStatus(chess);

            // Fetch bot reaction dialog on its own calculated move
            const recentSanList = nextHistory.map(h => h.san);
            fetchBotCommentary(nextFen, recentSanList);
          }
        } catch (err) {
          console.error("Bot AI play exception", err);
        } finally {
          setIsBotThinking(false);
        }
      }, thinkDelay);

      return () => clearTimeout(timer);
    }
  }, [fen, gameMode, playerColor, gameStatus, difficulty]);

  // Jump to specific historic move during Game Review/Analysis
  const handleJumpToMove = (idx: number) => {
    setCurrentMoveIdx(idx);
    
    const chess = chessRef.current;
    if (idx === -1) {
      chess.load('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      setFen(chess.fen());
      setLastMove(null);
      soundEffects.playMove();
    } else {
      const stateMove = moveHistory[idx];
      chess.load(stateMove.fen);
      setFen(stateMove.fen);
      setLastMove({ from: stateMove.from, to: stateMove.to });

      // Trigger synthesized Sound Effect retrospectively on timeline scrub
      if (stateMove.san.includes('#')) {
        soundEffects.playCheckmate();
      } else if (stateMove.san.includes('+')) {
        soundEffects.playCheck();
      } else if (stateMove.san.includes('x')) {
        soundEffects.playCapture();
      } else {
        soundEffects.playMove();
      }
    }

    // Check check / checkmate indicators on this historical index
    updateCheckAndSafetyStatus(chess);
  };

  // Undo Move (takes back both White and Black turns)
  const handleUndoMove = () => {
    const chess = chessRef.current;
    if (moveHistory.length < 2) {
      // Just reset
      handleResetGame();
      return;
    }

    // Undo twice to undo both users and bots last plays
    chess.undo();
    chess.undo();

    const nextFen = chess.fen();
    setFen(nextFen);

    const nextHistory = moveHistory.slice(0, -2);
    setMoveHistory(nextHistory);
    setCurrentMoveIdx(nextHistory.length - 1);

    if (nextHistory.length > 0) {
      const last = nextHistory[nextHistory.length - 1];
      setLastMove({ from: last.from, to: last.to });
    } else {
      setLastMove(null);
    }

    updateCheckAndSafetyStatus(chess);
    setLatestCommentary("Oops! A take-back? No worries, let's keep playing.");
    soundEffects.playMove();
  };

  // Full reset
  const handleResetGame = () => {
    const chess = chessRef.current;
    chess.load('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    setFen(chess.fen());
    soundEffects.playMove();
    setMoveHistory([]);
    setCurrentMoveIdx(-1);
    setLastMove(null);
    setKingInCheckSquare(null);
    setGameStatus('active');
    setCoachSummary(null);
    setAnalyzedMoves([]);
    setLatestCommentary(activePersona.greeting);
    
    // Reset dual clocks
    const initialSecs = getInitialSeconds(gameFormat);
    setWhiteTime(initialSecs);
    setBlackTime(initialSecs);
  };

  // Export game PGN to study
  const handleExportPgn = () => {
    const chess = new Chess();
    moveHistory.forEach((m) => {
      chess.move({ from: m.from, to: m.to });
    });
    const pgnContent = chess.pgn();

    // Create visual file trigger download
    const blob = new Blob([pgnContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chess_match_review_${new Date().toISOString().substring(0, 10)}.pgn`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Load custom FEN string
  const handleImportFen = (customFen: string) => {
    try {
      const chess = chessRef.current;
      chess.load(customFen);
      setFen(customFen);
      setMoveHistory([]);
      setCurrentMoveIdx(-1);
      setLastMove(null);
      updateCheckAndSafetyStatus(chess);
      setLatestCommentary("Custom FEN position loaded successfully!");
    } catch {
      alert("Invalid FEN coordinate path. Please make sure format complies with FEN parameters.");
    }
  };

  // Load complete external PGN file
  const handleImportPgn = (pgnStr: string) => {
    try {
      const tempChess = new Chess();
      tempChess.loadPgn(pgnStr);

      // Reconstruct moves
      const pgnMoves = tempChess.history({ verbose: true });
      const reconstructChess = new Chess();
      const records: any[] = [];

      pgnMoves.forEach((m, idx) => {
        reconstructChess.move({ from: m.from, to: m.to });
        records.push({
          sNo: idx + 1,
          san: m.san,
          from: m.from,
          to: m.to,
          fen: reconstructChess.fen(),
          color: m.color as 'w' | 'b'
        });
      });

      chessRef.current = reconstructChess;
      setMoveHistory(records);
      setFen(reconstructChess.fen());
      setCurrentMoveIdx(records.length - 1);
      
      if (records.length > 0) {
        const last = records[records.length - 1];
        setLastMove({ from: last.from, to: last.to });
      }

      updateCheckAndSafetyStatus(reconstructChess);
      setGameMode('analysis'); // Auto switch to review mode to inspect moves
      setLatestCommentary("Pasted PGN game loaded successfully! Switch to Analyser to run reviews.");
    } catch {
      alert("Invalid PGN format. Ensure moves sequence complies with standard chess notation.");
    }
  };

  // Toggle layout perspective orientation
  const handleFlipOrientation = () => {
    setBoardOrientation(prev => prev === 'white' ? 'black' : 'white');
  };

  // Extract legal moves for active layout checks
  const activeChess = chessRef.current;
  const currentLegalMoves = activeChess.moves({ verbose: true }) as any[];

  return (
    <div className="min-h-screen bg-[#0d0d15] text-[#f1f5f9] font-sans antialiased flex flex-col pb-8">
      
      {/* Visual Navigation Bar */}
      <header className="border-b border-white/5 bg-[#12121e]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-xl">
              👑
            </div>
            <div className="flex flex-col">
              <h1 className="text-base font-black tracking-tight text-white leading-none">
                Chess Bot & Analyzer
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#6272a4] mt-1">
                Google AI Studio Engine
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              id="sound-mute-toggle"
              onClick={handleToggleMute}
              className={`p-2 rounded-xl border transition-all duration-200 flex items-center gap-2 text-xs font-bold ${
                isMuted
                  ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                  : 'bg-[#212134] border-white/5 text-gray-300 hover:bg-[#2b2b42]'
              }`}
              title={isMuted ? 'Unmute sound effects' : 'Mute sound effects'}
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-4 h-4 text-red-500" />
                  <span className="hidden sm:inline">Muted</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline">Sounds On</span>
                </>
              )}
            </button>

            <span className="bg-[#212134] text-xs text-gray-300 font-bold px-3 py-1.5 rounded-xl border border-white/5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#ff79c6]" />
              Gemini 3.5 Active
            </span>
          </div>
        </div>
      </header>

      {/* Main Container workspace layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 mt-6">
        
        {/* Workspace responsive layout grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start justify-center">
          
          {/* LEFT WING: Chessboard stage (Columns 1-7) */}
          <div className="lg:col-span-7 flex flex-col items-center gap-4">
            
            {/* TOP HUD: Opponent/Far Player Badge and Clock */}
            <div className="w-full max-w-lg flex items-center justify-between bg-[#171725]/60 px-4 py-2.5 rounded-xl border border-white/5 shadow-md">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${
                  getFighterHUDData('far').gradient
                } flex items-center justify-center text-sm shadow`}>
                  {getFighterHUDData('far').emoji}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="text-white font-extrabold text-xs">
                      {getFighterHUDData('far').name}
                    </span>
                    {getFighterHUDData('far').isBot && (
                      <span className="bg-[#212134] text-[8px] text-[#ffb86c] font-black px-1 py-0.5 rounded uppercase leading-none border border-amber-500/10">
                        BOT
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] text-gray-500 font-mono mt-1">
                    {getFighterHUDData('far').subtitle}
                  </span>
                </div>
              </div>
              {/* Clock segment */}
              {gameFormat !== 'infinite' && (
                <div className={`px-3 py-1.5 rounded-lg font-mono text-sm font-black flex items-center gap-1.5 min-w-[75px] justify-center transition-colors border ${
                  (boardOrientation === 'white' ? chessRef.current.turn() === 'b' : chessRef.current.turn() === 'w') && gameStatus === 'active'
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/45 shadow-[0_0_8px_rgba(245,158,11,0.15)] animate-pulse'
                    : 'bg-[#212134] text-gray-400 border-white/5'
                }`}>
                  ⏱️ {boardOrientation === 'white' ? formatTime(blackTime) : formatTime(whiteTime)}
                </div>
              )}
            </div>

            {/* Simulated Frame status info */}
            <div className="relative shadow-2xl rounded-2xl overflow-hidden w-full max-w-lg">
              <ChessBoard
                fen={fen}
                onMove={handleUserMove}
                legalMoves={currentLegalMoves}
                lastMove={lastMove}
                kingInCheckSquare={kingInCheckSquare}
                orientation={boardOrientation}
                theme={boardTheme}
                isInteractive={
                  gameMode === 'multiplayer'
                    ? (multiplayerRoomState?.status === 'active' && ((chessRef.current.turn() === 'w' && multiplayerRoomState?.players?.white?.clientId === clientId) || (chessRef.current.turn() === 'b' && multiplayerRoomState?.players?.black?.clientId === clientId)))
                    : (gameMode === 'play' && !isBotThinking)
                }
              />

              {/* Bot thinking visual lock state */}
              {isBotThinking && (
                <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px] flex items-center justify-center z-30">
                  <div className="bg-[#1e1e2f]/95 border border-white/10 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-bounce" />
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
                    <span className="text-xs text-white font-bold tracking-wide">
                      {activePersona.name} is calculating...
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* BOTTOM HUD: Near Player Badge and Clock */}
            <div className="w-full max-w-lg flex items-center justify-between bg-[#171725]/60 px-4 py-2.5 rounded-xl border border-white/5 shadow-md">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${
                  getFighterHUDData('near').gradient
                } flex items-center justify-center text-sm shadow`}>
                  {getFighterHUDData('near').emoji}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="text-white font-extrabold text-xs">
                      {getFighterHUDData('near').name}
                    </span>
                    {getFighterHUDData('near').isBot && (
                      <span className="bg-[#212134] text-[8px] text-[#ffb86c] font-black px-1 py-0.5 rounded uppercase leading-none border border-amber-500/10">
                        BOT
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] text-gray-500 font-mono mt-1">
                    {getFighterHUDData('near').subtitle}
                  </span>
                </div>
              </div>
              {/* Clock segment */}
              {gameFormat !== 'infinite' && (
                <div className={`px-3 py-1.5 rounded-lg font-mono text-sm font-black flex items-center gap-1.5 min-w-[75px] justify-center transition-colors border ${
                  (boardOrientation === 'white' ? chessRef.current.turn() === 'w' : chessRef.current.turn() === 'b') && gameStatus === 'active'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/45 shadow-[0_0_8px_rgba(16,185,129,0.15)] animate-pulse'
                    : 'bg-[#212134] text-gray-400 border-white/5'
                }`}>
                  ⏱️ {boardOrientation === 'white' ? formatTime(whiteTime) : formatTime(blackTime)}
                </div>
              )}
            </div>

            {/* Top/Bottom Captured materials display */}
            <div className="w-full max-w-lg mt-1 grid grid-cols-2 gap-3">
              <div className="bg-[#171725]/30 p-2 rounded-xl border border-white/5">
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-gray-500 block mb-1">Captured by You</span>
                <CapturedPieces capturedList={capturedB} color="b" advantageDiff={materialDiff * -1} />
              </div>
              <div className="bg-[#171725]/30 p-2 rounded-xl border border-white/5">
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-gray-500 block mb-1">Captured by Bot</span>
                <CapturedPieces capturedList={capturedW} color="w" advantageDiff={materialDiff} />
              </div>
            </div>

          </div>

          {/* RIGHT WING: Game Controllers & AI reviews (Columns 8-12) */}
          <div className="lg:col-span-5 flex flex-col gap-5 w-full items-center">
            
            {/* Active Dialogue Persona Opponent Card */}
            <OpponentCard
              persona={activePersona}
              gameStatus={gameStatus}
              activeTurn={activeChess.turn() === 'w' ? 'white' : 'black'}
              latestCommentary={latestCommentary}
              isThinking={isBotThinking}
              isAiThinkingComment={isAiThinkingComment}
              memeReaction={memeReaction}
            />

            {/* Responsive Workspace Switch widgets */}
            {gameMode === 'play' && (
              <GameControls
                activePersona={activePersona}
                onPersonaChange={(bot) => {
                  setActivePersona(bot);
                  setDifficulty(bot.difficulty);
                  setLatestCommentary(bot.greeting);
                  // Reset clocks when selecting a new opponent
                  const initialSecs = getInitialSeconds(gameFormat);
                  setWhiteTime(initialSecs);
                  setBlackTime(initialSecs);
                  // Clear board for a fresh game
                  const chess = chessRef.current;
                  chess.load('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
                  setFen(chess.fen());
                  setMoveHistory([]);
                  setCurrentMoveIdx(-1);
                  setLastMove(null);
                  setKingInCheckSquare(null);
                  setGameStatus('active');
                  setCoachSummary(null);
                  setAnalyzedMoves([]);
                }}
                gameFormat={gameFormat}
                onGameFormatChange={handleGameFormatChange}
                gameMode={gameMode}
                onGameModeChange={setGameMode}
                boardTheme={boardTheme}
                onBoardThemeChange={setBoardTheme}
                playerColorSelection={playerColor}
                onPlayerColorChange={setPlayerColor}
                onUndo={handleUndoMove}
                onNewGame={handleResetGame}
                onFlipBoard={handleFlipOrientation}
                exportPgn={handleExportPgn}
                onImportFen={handleImportFen}
                onImportPgn={handleImportPgn}
                currentFen={fen}
                currentPgn={activeChess.pgn()}
              />
            )}

            {gameMode === 'multiplayer' && (
              <MultiplayerControl
                clientId={clientId}
                roomId={multiplayerRoomId}
                roomState={multiplayerRoomState}
                nickname={nickname}
                onNicknameChange={handleNicknameChange}
                isConnected={isWsConnected}
                onJoinRoom={handleJoinMultiplayerRoom}
                onQuickPlay={handleQuickPlay}
                onResign={handleResignMultiplayer}
                onLeaveRoom={handleLeaveMultiplayerRoom}
                onSendChat={handleSendMultiplayerChat}
                onRematch={handleRematchMultiplayer}
              />
            )}

            {gameMode === 'analysis' && (
              <AnalysisPanel
                moveHistory={moveHistory}
                currentMoveIndex={currentMoveIdx}
                onJumpToMove={handleJumpToMove}
                onAnalyzeMatch={handleAnalyzeMatch}
                isAnalyzing={isAnalyzing}
                coachSummary={coachSummary}
                analyzedMoves={analyzedMoves}
              />
            )}

            {/* Simple scope review disclaimer */}
            <div className="text-center w-full max-w-md pt-2 border-t border-white/5 text-[10px] text-gray-500">
              Chess Engine utilizes local minimax calculation. Dialogue and reviews processed via cloud-hosted Gemini model parameters securely.
            </div>

          </div>

        </div>

      </main>

    </div>
  );
}
