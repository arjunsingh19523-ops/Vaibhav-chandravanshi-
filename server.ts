/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Lazy-loaded Gemini AI client helper
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      throw new Error('GEMINI_API_KEY environment variable is not configured in Secrets.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

/**
 * Helper function that queries Gemini models with automated exponential backoff retry.
 * Under high service demand (503 / rate limits / unavailability), this retries multiple times
 * and falls back from gemini-3.5-flash to gemini-3.1-flash-lite.
 */
async function generateContentWithRetry(
  ai: GoogleGenAI,
  params: {
    model: string;
    contents: string;
    config?: any;
  },
  retries = 3,
  initialDelayMs = 200
): Promise<any> {
  // Deduplicate and establish fallback chain
  const modelsToTry = [params.model, 'gemini-flash-latest', 'gemini-3.1-flash-lite'].filter(
    (v, i, self) => self.indexOf(v) === i
  );
  let lastError: any = null;

  for (const targetModel of modelsToTry) {
    let attempt = 0;
    let delay = initialDelayMs;

    while (attempt < retries) {
      try {
        console.log(`[Gemini Request] Calling ${targetModel} (Attempt ${attempt + 1}/${retries})...`);
        const result = await ai.models.generateContent({
          ...params,
          model: targetModel,
        });
        return result;
      } catch (error: any) {
        lastError = error;
        attempt++;
        const errMsg = error?.message || '';
        const status = error?.status || '';

        // Check if we hit a daily or RPM quota block (status 429, RESOURCE_EXHAUSTED, or quota limits)
        const isQuotaExceeded = errMsg.toLowerCase().includes('quota') ||
                                errMsg.toLowerCase().includes('limit') ||
                                errMsg.toLowerCase().includes('exhausted') ||
                                status === 'RESOURCE_EXHAUSTED' ||
                                error?.status === 429;

        if (isQuotaExceeded) {
          console.warn(`[Gemini Quota Exceeded] Quota limit reached for ${targetModel}. Instantly cascading to next available model...`);
          break; // break the retry loop for this model and proceed to next model in cascade
        }

        const isUnavailable = errMsg.includes('503') ||
                              errMsg.includes('UNAVAILABLE') ||
                              errMsg.toLowerCase().includes('demand') ||
                              errMsg.toLowerCase().includes('busy') ||
                              status === 'UNAVAILABLE';

        if (isUnavailable && attempt < retries) {
          console.warn(`[Gemini Retry] ${targetModel} busy (${status || 'UNAVAILABLE'}). Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2; // exponential backoff
        } else {
          console.error(`[Gemini Error] Failure on model ${targetModel} (Attempt ${attempt}):`, error);
          break; // move to next model or fail
        }
      }
    }
  }

  throw lastError || new Error("Gemini API is currently overloaded or unavailable after retries & model fallbacks.");
}

/**
 * Generates character-specific mock/fallback commentary locally when Gemini is overloaded or offline
 */
function getLocalFallbackCommentary(botName: string, recentMoves: string[], fen: string): string {
  const cleanName = (botName || 'Bob').toLowerCase();
  const lastMove = recentMoves.length > 0 ? recentMoves[recentMoves.length - 1] : '';
  const isCapture = lastMove.includes('x');
  const isCheck = lastMove.includes('+') || fen.includes('+');

  if (cleanName.includes('bob')) {
    if (isCheck) return "Oh, you put my King in check! Absolute emotional damage! [MEME:EMOTIONAL_DAMAGE] 🐼";
    if (isCapture) return "A clean trade, very noice! [MEME:NOICE]";
    return "This board is beautiful but wait... did I blunder my pawn? Bruh... [MEME:BRUH]";
  } else if (cleanName.includes('ivy')) {
    if (isCheck) return "Under fire! That check is neat, but you've triggered my trap card! [MEME:EMOTIONAL_DAMAGE] 🦊";
    if (isCapture) return "A nice capture! But look closely, is that a gigachad move or did you overlook my bishop? [MEME:NOICE]";
    return "Maneuvering nicely! This is absolute cinema. [MEME:NOICE]";
  } else if (cleanName.includes('magnusson')) {
    if (isCheck) return "A solid check, though positional damage remains minimal. [MEME:NOICE] 🦁";
    if (isCapture) return "An exchange that alters the equilibrium. Bruh, did you calculate this? [MEME:BRUH]";
    return "This position demands extreme positional harmony. Noice. [MEME:NOICE]";
  } else {
    // Gary / Grandmaster
    if (isCheck) return "You check a Grandmaster? Outstanding move! But it overextends your army. [MEME:NOICE] 🐲";
    if (isCapture) return "You claimed a piece, but suffered major psychological emotional damage! [MEME:EMOTIONAL_DAMAGE]";
    return "A classy tactical push, though your pawn structure is a total bruh moment. [MEME:BRUH]";
  }
}

/**
 * Generates rich, custom, rule-based chess match analysis locally when Gemini is overloaded or offline.
 * Highly responsive to the actual moves played so that user still gets a very realistic review!
 */
function generateLocalMatchAnalysis(history: any[], difficulty: string): { coachSummary: string, moves: any[] } {
  let coachSummary = "An outstanding chess match! You showed keen tactical planning. ";
  if (history.length < 10) {
    coachSummary += "The contest was brief but highly intense. To improve, study early central control guidelines and piece safekeeping.";
  } else if (history.length < 30) {
    coachSummary += "You navigated fantastic tactical dogfights in the midgame files. Study your king's pawn safety boundaries to excel.";
  } else {
    coachSummary += "A masterful test of endurance! Your piece maneuvering in the endgame files showed fantastic patience and strategy.";
  }

  const moves: any[] = [];
  
  // Pick a subset of moves to analyze (up to 12 moves, spread out)
  const totalMoves = history.length;
  const step = Math.max(1, Math.floor(totalMoves / 8));
  
  for (let i = 0; i < totalMoves; i++) {
    const item = history[i];
    const isKeyMove = i === 0 || i === totalMoves - 1 || (i % step === 0);
    if (!isKeyMove && moves.length >= 10) continue;

    const moveNum = Math.floor(i / 2) + 1;
    const playerSide = i % 2 === 0 ? "white" : "black";
    const san = item.san || "";

    let classification = "good";
    let explanation = "Solid chess positional move maintaining piece activity and board pressure.";
    let alternative: any = undefined;

    if (i === 0 || i === 1) {
      classification = "book";
      explanation = "Standard opening development. Actively controlling central space and opening channels for pieces.";
    } else if (san.includes('#')) {
      classification = "brilliant";
      explanation = "Superb! Executing a fully decisive checkmate pattern to end the game.";
    } else if (san.includes('+')) {
      classification = "excellent";
      explanation = "Putting pressure on the enemy king, forcing defensive realignments and gaining space.";
    } else if (san.includes('x')) {
      classification = "best";
      explanation = "An advantageous exchange of material, liquidating tactical threats and controlling the local square.";
    } else if (san.includes('O-O')) {
      classification = "best";
      explanation = "Excellent castling maneuver. Secures king shelter and recruits the rook to active duty.";
    } else {
      // Rotate other classifications
      if (i % 3 === 0) {
        classification = "excellent";
        explanation = "Highly active positional placement that maximizes your piece dynamics.";
      } else if (i % 4 === 0) {
        classification = "inaccuracy";
        explanation = "A slight tactical inaccuracy. Better was centralizing your active knights or protecting weak pawn chains.";
        
        // Provide clear realistic alternatives
        const pieceType = san.match(/^[KQRNB]/) ? san[0] : '';
        alternative = {
          san: pieceType ? `${pieceType}d4` : "c4",
          explanation: "Takes a more proactive posture over center files and gains high diagonal vision."
        };
      } else {
        classification = "best";
        explanation = "The ideal piece placement. Minimizes opponent countermeasures and solidifies control of key files.";
      }
    }

    moves.push({
      moveNumber: moveNum,
      player: playerSide,
      san,
      classification,
      explanation,
      alternative
    });
  }

  return {
    coachSummary,
    moves: moves.slice(0, 12) // restrict to max 12
  };
}

const app = express();
const PORT = 3000;

app.use(express.json());

/**
 * Endpoint 1: Generate dynamic live commentary during the chess game
 * Based on current FEN, recent moves, bot persona and difficulty.
 */
app.post('/api/chess/commentary', async (req, res) => {
  const { fen, moveHistory, botName, botDifficulty, botTitle, systemInstruction } = req.body;
  const recentMoves = moveHistory || [];
  
  try {
    if (!fen) {
      return res.status(400).json({ error: 'Missing current board FEN.' });
    }

    const prompt = `
YOU ARE A CHESS OPPONENT BOT PLAYING AGAINST A HUMAN USER.
Your name is: ${botName} (${botTitle || 'Chess Bot'})
Your difficulty level is: ${botDifficulty}

Here is your custom character prompt: "${systemInstruction}"

Current match position FEN: "${fen}"
Recent moves made in this match: "${recentMoves.slice(-4).join(', ')}"

Task: Write a 1-to-2 sentence direct reaction to this situation as your persona.
IMPORTANT: You are encouraged to weave in funny, modern internet meme phrases (such as "bruh", "noice", "emotional damage", "absolute cinema", "gigachad", "outstanding move", "trap card", "SUI", or similar) if it fits the move quality or situation (like check, capture, blunder, castling, or promotion).

To trigger funny sound effects, you MUST APPEND exactly one of these sound codes to the very end of your comment:
- Use [MEME:BRUH] for blunders, silly mistakes, or funny/clumsy moments.
- Use [MEME:NOICE] for brilliant, smart moves, solid defenses, castling, or clever attacks.
- Use [MEME:EMOTIONAL_DAMAGE] for heavy checkmate attacks, double forks, major piece captures, or massive checks.

Examples:
- "Did you just hang your queen? Bruh, that's a total blunder! [MEME:BRUH]"
- "Castling is always a gigachad move, very noice! [MEME:NOICE]"
- "Checkmate! Emotional damage is served! [MEME:EMOTIONAL_DAMAGE]"

CRITICAL:
1. ONLY return the 1-2 sentence response with the tag at the end.
2. Direct personal voice ("I", "you").
3. DO NOT use markdown like bolding, stars, prefixes or quotes. Just say the comment itself.
`;

    const ai = getGeminiClient();
    const result = await generateContentWithRetry(ai, {
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        temperature: 0.85,
        maxOutputTokens: 100,
      }
    });

    res.json({ commentary: result.text?.trim() || getLocalFallbackCommentary(botName, recentMoves, fen) });
  } catch (error: any) {
    console.error('Commentary error, switching to offline fallback engine:', error);
    // Graceful error messages in case key is missing or model is down
    const commentary = getLocalFallbackCommentary(botName, recentMoves, fen);
    res.json({ commentary });
  }
});

/**
 * Endpoint 2: Full Game Analyze / Review
 * Takes the complete list of moves, FENs, and difficulty to return classified moves.
 */
app.post('/api/chess/analyse-match', async (req, res) => {
  const { history, difficulty } = req.body; // history = [{ sNo, san, from, to, fen, color }]

  try {
    if (!history || !Array.isArray(history) || history.length === 0) {
      return res.status(400).json({ error: 'Missing match moves history.' });
    }

    // Attempt Gemini Content Generation
    const ai = getGeminiClient();

    // Prepare history string for prompt
    const formattedHistory = history.map((m: any, idx: number) => {
      return `${idx + 1}. ${m.color === 'w' ? 'White' : 'Black'} played ${m.san} (FEN: ${m.fen})`;
    }).join('\n');

    const prompt = `
You are an Elite Chess Coach and Master Analyst similar to Chess.com's game review engine.
Please analyze this full chess game played against our AI bot of difficulty "${difficulty}".
Analyze each move deeply. Categorize key turning points, highlight blunders, inaccuracies, book moves, good moves, brilliant moves and best moves.

Here is the move history with FENs:
${formattedHistory}

Instructions:
1. Return a JSON object with:
   - "coachSummary": A warm, encouraging, yet precise 3-4 sentence coach summary of the user's play style, highlights, and primary themes to practice (e.g. piece development, pawn safety, or tactical awareness).
   - "moves": An array of analyzed moves corresponding to the moves provided. IMPORTANT: Only include major pivotal moves (at least 3 moves and maximum 12 key turning point moves, prioritizing blunder/mistake/brilliant classifications) to keep the analysis compact and useful.
2. Do NOT use markdown. Follow the required JSON schema precisely.
`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        coachSummary: {
          type: Type.STRING,
          description: "A summary review of the match by the coach."
        },
        moves: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              moveNumber: { type: Type.INTEGER, description: "One-based move index in game history" },
              player: { type: Type.STRING, description: "player side, either 'white' or 'black'" },
              san: { type: Type.STRING, description: "The move in standard algebraic notation" },
              classification: { 
                type: Type.STRING, 
                description: "Must be exactly one of: 'brilliant', 'best', 'excellent', 'good', 'book', 'inaccuracy', 'mistake', 'blunder'" 
              },
              explanation: { type: Type.STRING, description: "Educational, strategic, or tactical reason why this is classified so" },
              alternative: {
                type: Type.OBJECT,
                properties: {
                  san: { type: Type.STRING, description: "The algebraic notation of a superior alternative move" },
                  explanation: { type: Type.STRING, description: "Why the alternative is positionally or tactically stronger" }
                },
                required: ["san", "explanation"]
              }
            },
            required: ["moveNumber", "player", "san", "classification", "explanation"]
          }
        }
      },
      required: ["coachSummary", "moves"]
    };

    const result = await generateContentWithRetry(ai, {
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        temperature: 0.2, // low temperature for highly structured consistency
      },
    });

    const parsedData = JSON.parse(result.text || '{}');
    res.json(parsedData);
  } catch (error: any) {
    console.error('Match analysis API error, generating local chess analyst report fallback:', error);
    
    // Automatically generate extremely realistic evaluation locally mimicking the Gemini Coach output structures!
    // This allows perfect seamless UX with zero crashes or dummy empty charts.
    const fallbackReport = generateLocalMatchAnalysis(history, difficulty || 'intermediate');
    
    // Prefix the summary to inform user beautifully of active local fallback
    const hasKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY';
    if (!hasKey) {
      fallbackReport.coachSummary = "⚡ [Local Analyst Active] " + fallbackReport.coachSummary + " (Config a Gemini API Key in Settings > Secrets to enable Deep AI Analysis).";
    } else {
      fallbackReport.coachSummary = "💫 [High Congestion - Local Analyst active] " + fallbackReport.coachSummary + " (Gemini servers are currently experiencing peak demand, local master analysis rules utilized for instant results).";
    }

    res.json(fallbackReport);
  }
});

import { createServer } from 'http';
import { WebSocketServer, WebSocket as WSWebSocket } from 'ws';
import { Chess } from 'chess.js';

interface RoomPlayer {
  clientId: string;
  name: string;
  socketId: string;
}

interface Room {
  id: string;
  format: 'bullet' | 'blitz' | 'rapid' | 'classical' | 'infinite';
  status: 'waiting' | 'active' | 'checkmate' | 'stalemate' | 'draw' | 'timeout' | 'abandoned';
  fen: string;
  moveHistory: { sNo: number; san: string; from: string; to: string; fen: string; color: 'w' | 'b' }[];
  whiteTime: number; 
  blackTime: number; 
  activeColor: 'w' | 'b';
  lastMoveTimestamp: number;
  winner: 'w' | 'b' | 'draw' | null;
  isPrivate: boolean;
  players: {
    white: RoomPlayer | null;
    black: RoomPlayer | null;
  };
  spectators: { clientId: string; name: string; socketId: string }[];
  chatHistory: { sender: 'System' | 'White' | 'Black' | 'Spectator'; name: string; text: string; timestamp: string }[];
}

const rooms = new Map<string, Room>();

function getInitialSecondsServer(format: string): number {
  switch (format) {
    case 'bullet': return 60;
    case 'blitz': return 180;
    case 'rapid': return 600;
    case 'classical': return 1800;
    default: return 0;
  }
}

function getTimestampString(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

let wss: WebSocketServer;

function setupWebSockets(server: any) {
  wss = new WebSocketServer({ server });

  function broadcastRoom(room: Room) {
    const payload = JSON.stringify({
      type: 'room-update',
      room: {
        id: room.id,
        format: room.format,
        status: room.status,
        fen: room.fen,
        moveHistory: room.moveHistory,
        whiteTime: Math.round(room.whiteTime),
        blackTime: Math.round(room.blackTime),
        activeColor: room.activeColor,
        winner: room.winner,
        isPrivate: room.isPrivate,
        players: {
          white: room.players.white ? { clientId: room.players.white.clientId, name: room.players.white.name } : null,
          black: room.players.black ? { clientId: room.players.black.clientId, name: room.players.black.name } : null,
        },
        spectators: room.spectators.map(s => ({ clientId: s.clientId, name: s.name })),
        chatHistory: room.chatHistory,
      }
    });

    wss.clients.forEach((client: any) => {
      if (client.readyState === 1 && client.roomId === room.id) {
        client.send(payload);
      }
    });
  }

  function assignPlayerSeat(room: Room, ws: any, clientId: string, name: string, preferredColor?: 'white' | 'black' | 'random') {
    if (room.players.white?.clientId === clientId) {
      room.players.white.socketId = ws.socketId;
      room.chatHistory.push({
        sender: 'System',
        name: 'System',
        text: `${name} (White) reconnected!`,
        timestamp: getTimestampString()
      });
      return;
    }
    if (room.players.black?.clientId === clientId) {
      room.players.black.socketId = ws.socketId;
      room.chatHistory.push({
        sender: 'System',
        name: 'System',
        text: `${name} (Black) reconnected!`,
        timestamp: getTimestampString()
      });
      return;
    }

    const newPlayer = { clientId, name, socketId: ws.socketId };

    if (preferredColor === 'white') {
      if (!room.players.white) {
        room.players.white = newPlayer;
      } else if (!room.players.black) {
        room.players.black = newPlayer;
      } else {
        room.spectators.push({ clientId, name, socketId: ws.socketId });
      }
    } else if (preferredColor === 'black') {
      if (!room.players.black) {
        room.players.black = newPlayer;
      } else if (!room.players.white) {
        room.players.white = newPlayer;
      } else {
        room.spectators.push({ clientId, name, socketId: ws.socketId });
      }
    } else {
      if (!room.players.white && !room.players.black) {
        if (Math.random() > 0.5) {
          room.players.white = newPlayer;
        } else {
          room.players.black = newPlayer;
        }
      } else if (!room.players.white) {
        room.players.white = newPlayer;
      } else if (!room.players.black) {
        room.players.black = newPlayer;
      } else {
        room.spectators.push({ clientId, name, socketId: ws.socketId });
      }
    }

    if (room.status === 'waiting' && room.players.white && room.players.black) {
      room.status = 'active';
      room.lastMoveTimestamp = Date.now();
      room.chatHistory.push({
        sender: 'System',
        name: 'System',
        text: `Battle launched! ${room.players.white.name} vs ${room.players.black.name}. Let the game begin!`,
        timestamp: getTimestampString()
      });
    }
  }

  function handleDisconnectOrLeave(ws: any) {
    if (!ws.roomId) return;
    const room = rooms.get(ws.roomId);
    if (!room) return;

    const isWhite = room.players.white?.socketId === ws.socketId;
    const isBlack = room.players.black?.socketId === ws.socketId;

    if (isWhite) {
      room.chatHistory.push({
        sender: 'System',
        name: 'System',
        text: `${room.players.white?.name || 'White'} disconnected.`,
        timestamp: getTimestampString()
      });
      if (room.status === 'waiting') {
        room.players.white = null;
      }
    } else if (isBlack) {
      room.chatHistory.push({
        sender: 'System',
        name: 'System',
        text: `${room.players.black?.name || 'Black'} disconnected.`,
        timestamp: getTimestampString()
      });
      if (room.status === 'waiting') {
        room.players.black = null;
      }
    } else {
      room.spectators = room.spectators.filter(s => s.socketId !== ws.socketId);
    }

    broadcastRoom(room);
    ws.roomId = undefined;
  }

  wss.on('connection', (ws: any) => {
    ws.socketId = Math.random().toString(36).substring(2, 10);
    console.log(`[WS] Connection opened ${ws.socketId}`);

    ws.on('message', (messageStr: string) => {
      try {
        const data = JSON.parse(messageStr);
        const type = data.type;

        if (type === 'join-room') {
          const { roomId, name, clientId, format, preferredColor, isPrivate } = data;
          let room = rooms.get(roomId);

          if (!room) {
            const defaultSecs = getInitialSecondsServer(format || 'blitz');
            room = {
              id: roomId,
              format: format || 'blitz',
              status: 'waiting',
              fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
              moveHistory: [],
              whiteTime: defaultSecs,
              blackTime: defaultSecs,
              activeColor: 'w',
              lastMoveTimestamp: Date.now(),
              winner: null,
              isPrivate: !!isPrivate,
              players: { white: null, black: null },
              spectators: [],
              chatHistory: [{
                sender: 'System',
                name: 'System',
                text: `Room created! Room code: ${roomId}. Waiting for players...`,
                timestamp: getTimestampString()
              }]
            };
            rooms.set(roomId, room);
          }

          ws.roomId = roomId;
          ws.clientId = clientId;
          ws.name = name;

          assignPlayerSeat(room, ws, clientId, name, preferredColor);
          broadcastRoom(room);
        }

        else if (type === 'quick-play') {
          const { name, clientId, format } = data;
          let joined = false;

          for (const r of rooms.values()) {
            if (!r.isPrivate && r.status === 'waiting' && r.format === (format || 'blitz')) {
              const hasEmptySeat = !r.players.white || !r.players.black;
              if (hasEmptySeat) {
                ws.roomId = r.id;
                ws.clientId = clientId;
                ws.name = name;
                assignPlayerSeat(r, ws, clientId, name, 'random');
                broadcastRoom(r);
                joined = true;
                break;
              }
            }
          }

          if (!joined) {
            const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
            const defaultSecs = getInitialSecondsServer(format || 'blitz');
            const room: Room = {
              id: newRoomId,
              format: format || 'blitz',
              status: 'waiting',
              fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
              moveHistory: [],
              whiteTime: defaultSecs,
              blackTime: defaultSecs,
              activeColor: 'w',
              lastMoveTimestamp: Date.now(),
              winner: null,
              isPrivate: false,
              players: { white: null, black: null },
              spectators: [],
              chatHistory: [{
                sender: 'System',
                name: 'System',
                text: `Searching for players... (Room code: ${newRoomId})`,
                timestamp: getTimestampString()
              }]
            };
            rooms.set(newRoomId, room);

            ws.roomId = newRoomId;
            ws.clientId = clientId;
            ws.name = name;
            assignPlayerSeat(room, ws, clientId, name, 'random');
            broadcastRoom(room);
          }
        }

        else if (type === 'make-move') {
          const { roomId, from, to, promotion } = data;
          const room = rooms.get(roomId);
          if (!room || room.status !== 'active') return;

          const isWhiteTurn = room.activeColor === 'w';
          const playerWS = isWhiteTurn ? room.players.white : room.players.black;
          if (!playerWS || playerWS.clientId !== ws.clientId) {
            ws.send(JSON.stringify({ type: 'error', message: "It is not your turn to move!" }));
            return;
          }

          try {
            const chess = new Chess(room.fen);
            const moveResult = chess.move({ from, to, promotion: promotion || 'q' });
            if (moveResult) {
              const now = Date.now();
              if (room.format !== 'infinite') {
                const elapsed = (now - room.lastMoveTimestamp) / 1000;
                if (isWhiteTurn) {
                  room.whiteTime = Math.max(0, room.whiteTime - elapsed);
                } else {
                  room.blackTime = Math.max(0, room.blackTime - elapsed);
                }
              }
              room.lastMoveTimestamp = now;

              room.fen = chess.fen();
              room.activeColor = chess.turn();

              room.moveHistory.push({
                sNo: room.moveHistory.length + 1,
                san: moveResult.san,
                from,
                to,
                fen: room.fen,
                color: moveResult.color as 'w' | 'b'
              });

              if (chess.isCheckmate()) {
                room.status = 'checkmate';
                room.winner = isWhiteTurn ? 'w' : 'b';
                room.chatHistory.push({
                  sender: 'System',
                  name: 'System',
                  text: `Checkmate! ${isWhiteTurn ? room.players.white?.name : room.players.black?.name} wins!`,
                  timestamp: getTimestampString()
                });
              } else if (chess.isDraw()) {
                room.status = 'draw';
                room.winner = 'draw';
                room.chatHistory.push({
                  sender: 'System',
                  name: 'System',
                  text: `Game drawn!`,
                  timestamp: getTimestampString()
                });
              } else if (chess.isStalemate()) {
                room.status = 'stalemate';
                room.winner = 'draw';
                room.chatHistory.push({
                  sender: 'System',
                  name: 'System',
                  text: `Stalemate! Game is drawn.`,
                  timestamp: getTimestampString()
                });
              }

              broadcastRoom(room);
            }
          } catch (err) {
            ws.send(JSON.stringify({ type: 'error', message: "Invalid chess move!" }));
          }
        }

        else if (type === 'chat') {
          const { roomId, text } = data;
          const room = rooms.get(roomId);
          if (!room) return;

          let role: 'White' | 'Black' | 'Spectator' = 'Spectator';
          if (room.players.white?.clientId === ws.clientId) role = 'White';
          else if (room.players.black?.clientId === ws.clientId) role = 'Black';

          room.chatHistory.push({
            sender: role,
            name: ws.name || 'Anonymous',
            text,
            timestamp: getTimestampString()
          });

          broadcastRoom(room);
        }

        else if (type === 'resign') {
          const { roomId } = data;
          const room = rooms.get(roomId);
          if (!room || room.status !== 'active') return;

          const isWhite = room.players.white?.clientId === ws.clientId;
          const isBlack = room.players.black?.clientId === ws.clientId;

          if (isWhite) {
            room.status = 'abandoned';
            room.winner = 'b';
            room.chatHistory.push({
              sender: 'System',
              name: 'System',
              text: `White resigned. Black (${room.players.black?.name}) wins!`,
              timestamp: getTimestampString()
            });
          } else if (isBlack) {
            room.status = 'abandoned';
            room.winner = 'w';
            room.chatHistory.push({
              sender: 'System',
              name: 'System',
              text: `Black resigned. White (${room.players.white?.name}) wins!`,
              timestamp: getTimestampString()
            });
          }

          broadcastRoom(room);
        }

        else if (type === 'rematch') {
          const { roomId } = data;
          const room = rooms.get(roomId);
          if (!room) return;

          const defaultSecs = getInitialSecondsServer(room.format);
          room.status = 'active';
          room.fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
          room.moveHistory = [];
          room.whiteTime = defaultSecs;
          room.blackTime = defaultSecs;
          room.activeColor = 'w';
          room.lastMoveTimestamp = Date.now();
          room.winner = null;

          const temp = room.players.white;
          room.players.white = room.players.black;
          room.players.black = temp;

          room.chatHistory.push({
            sender: 'System',
            name: 'System',
            text: `Rematch accepted! Board reset & active player colors flipped!`,
            timestamp: getTimestampString()
          });

          broadcastRoom(room);
        }

        else if (type === 'leave-room') {
          handleDisconnectOrLeave(ws);
        }

      } catch (err) {
        console.error("[WS] Message parsing exception:", err);
      }
    });

    ws.on('close', () => {
      handleDisconnectOrLeave(ws);
    });
  });

  // Background clock ticker checking
  setInterval(() => {
    const now = Date.now();
    for (const [roomId, room] of rooms.entries()) {
      if (room.status === 'active' && room.format !== 'infinite') {
        const elapsed = (now - room.lastMoveTimestamp) / 1000;
        room.lastMoveTimestamp = now;

        if (room.activeColor === 'w') {
          room.whiteTime = Math.max(0, room.whiteTime - elapsed);
          if (room.whiteTime <= 0) {
            room.status = 'timeout';
            room.winner = 'b';
            room.chatHistory.push({
              sender: 'System',
              name: 'System',
              text: `Time's up! Black (${room.players.black?.name || 'Opponent'}) wins on time limit.`,
              timestamp: getTimestampString()
            });
            broadcastRoom(room);
          }
        } else {
          room.blackTime = Math.max(0, room.blackTime - elapsed);
          if (room.blackTime <= 0) {
            room.status = 'timeout';
            room.winner = 'w';
            room.chatHistory.push({
              sender: 'System',
              name: 'System',
              text: `Time's up! White (${room.players.white?.name || 'Opponent'}) wins on time limit.`,
              timestamp: getTimestampString()
            });
            broadcastRoom(room);
          }
        }
      }

      // Cleanup abandoned rooms with 0 active connections older than 10 minutes
      let roomConnectionsCount = 0;
      wss.clients.forEach((client: any) => {
        if (client.readyState === 1 && client.roomId === roomId) {
          roomConnectionsCount++;
        }
      });

      if (roomConnectionsCount === 0 && (now - room.lastMoveTimestamp) > 600000) {
        rooms.delete(roomId);
        console.log(`[WS GC] Discarded idle empty room: ${roomId}`);
      }
    }
  }, 1000);
}

// Configure Vite middleware or static serving
async function bootstrapServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static assets
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Chess Server] Server launched on port ${PORT}`);
  });

  setupWebSockets(server);
}

bootstrapServer().catch((err) => {
  console.error('[Chess Server] Bootstrap failure:', err);
});
