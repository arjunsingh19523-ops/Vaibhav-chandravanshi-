/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BotDifficulty = 'beginner' | 'intermediate' | 'master' | 'grandmaster';
export type BoardTheme = 'classic' | 'cosmic' | 'wood' | 'dark';
export type PieceTheme = 'classic' | 'red' | 'blue' | 'green' | 'cyan' | 'purple' | 'gold';
export type GameFormat = 'bullet' | 'blitz' | 'rapid' | 'classical' | 'infinite';

export interface BotPersona {
  id: string;
  name: string;
  title: string;
  rating: number;
  difficulty: BotDifficulty;
  avatarGradient: string;
  avatarEmoji: string;
  description: string;
  greeting: string;
  trashTalkProb: number;
  systemInstruction: string;
}

export type GameMode = 'play' | 'multiplayer' | 'analysis' | 'pass_and_play' | 'bluetooth';
export type ChessVariant = 'standard' | 'king_of_the_hill' | '360_chess' | '4_player';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'opponent' | 'coach' | 'system';
  text: string;
  timestamp: string;
  moveSan?: string; // Optional: what moves prompted this
}

export interface CapturedPieces {
  w: { [key: string]: number }; // e.g. p: 3, n: 1, etc.
  b: { [key: string]: number };
}

export type MoveClassification = 
  | 'brilliant' 
  | 'best' 
  | 'excellent' 
  | 'good' 
  | 'book' 
  | 'inaccuracy' 
  | 'mistake' 
  | 'blunder' 
  | 'normal';

export interface MoveAnalysis {
  moveNumber: number;
  player: 'white' | 'black';
  san: string;
  from: string;
  to: string;
  fen: string;
  classification: MoveClassification;
  explanation: string;
  alternative?: {
    san: string;
    explanation: string;
  };
}

export interface SavedGame {
  id: string;
  opponentName: string;
  difficulty: BotDifficulty;
  date: string;
  pgn: string;
  result: 'won' | 'lost' | 'draw' | 'active';
  movesCount: number;
}
