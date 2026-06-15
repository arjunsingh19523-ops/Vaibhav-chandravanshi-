/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Chess } from 'chess.js';

// Piece valuation for scoring
const PIECE_VALUES: { [key: string]: number } = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Piece-Square Tables (PST) from the perspective of white.
// Negative values are mirrored for black, with indices adjusted.
const PAWN_PST = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5,  5, 10, 25, 25, 10,  5,  5],
  [0,  0,  0, 20, 20,  0,  0,  0],
  [5, -5,-10,  0,  0,-10, -5,  5],
  [5, 10, 10,-20,-20, 10, 10,  5],
  [0,  0,  0,  0,  0,  0,  0,  0]
];

const KNIGHT_PST = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50]
];

const BISHOP_PST = [
  [-20,-10,-10,-10,-10,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5, 10, 10,  5,  0,-10],
  [-10,  5,  5, 10, 10,  5,  5,-10],
  [-10,  0, 10, 10, 10, 10,  0,-10],
  [-10, 10, 10, 10, 10, 10, 10,-10],
  [-10,  5,  0,  0,  0,  0,  5,-10],
  [-20,-10,-10,-10,-10,-10,-10,-20]
];

const ROOK_PST = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [5, 10, 10, 10, 10, 10, 10,  5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [0,  0,  0,  5,  5,  0,  0,  0]
];

const QUEEN_PST = [
  [-20,-10,-10, -5, -5,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5,  5,  5,  5,  0,-10],
  [-5,  0,  5,  5,  5,  5,  0, -5],
  [0,  0,  5,  5,  5,  5,  0, -5],
  [-10,  5,  5,  5,  5,  5,  0,-10],
  [-10,  0,  5,  0,  0,  5,  0,-10],
  [-20,-10,-10, -5, -5,-10,-10,-20]
];

const KING_MIDGAME_PST = [
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-20,-30,-30,-40,-40,-30,-30,-20],
  [-10,-20,-20,-20,-20,-20,-20,-10],
  [20, 20,  0,  0,  0,  0, 20, 20],
  [20, 30, 10,  0,  0, 10, 30, 20]
];

const KING_ENDGAME_PST = [
  [-50,-40,-30,-20,-20,-30,-40,-50],
  [-30,-20,-10,  0,  0,-10,-20,-30],
  [-30,-10, 20, 30, 30, 20,-10,-30],
  [-30,-10, 30, 40, 40, 30,-10,-30],
  [-30,-10, 30, 40, 40, 30,-10,-30],
  [-30,-10, 20, 30, 30, 20,-10,-30],
  [-30,-30,  0,  0,  0,  0,-30,-30],
  [-50,-30,-30,-30,-30,-30,-30,-50]
];

/**
 * Checks if we are in an endgame phase (fewer major pieces)
 */
function isEndgame(game: Chess): boolean {
  const board = game.board();
  let majorPiecesCount = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.type !== 'p' && piece.type !== 'k') {
        majorPiecesCount++;
      }
    }
  }
  return majorPiecesCount <= 6;
}

/**
 * Static evaluation function for the board
 */
export function evaluateBoard(game: Chess): number {
  let score = 0;
  const board = game.board();
  const endgame = isEndgame(game);

  // Counts and arrays for advanced evaluation
  let whiteBishops = 0;
  let blackBishops = 0;
  const whitePawnFiles = new Array(8).fill(0);
  const blackPawnFiles = new Array(8).fill(0);
  const whitePawns: { r: number; c: number }[] = [];
  const blackPawns: { r: number; c: number }[] = [];
  const whiteRooks: { r: number; c: number }[] = [];
  const blackRooks: { r: number; c: number }[] = [];
  const whiteKnights: { r: number; c: number }[] = [];
  const blackKnights: { r: number; c: number }[] = [];
  let whiteKing = { r: 7, c: 4 };
  let blackKing = { r: 0, c: 4 };

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const type = piece.type;
      const color = piece.color;
      
      // Base piece value
      let baseVal = PIECE_VALUES[type] || 0;
      
      // PST offsets
      let pstVal = 0;
      const pstRow = color === 'w' ? 7 - r : r;
      const pstCol = color === 'w' ? c : 7 - c;

      switch (type) {
        case 'p':
          pstVal = PAWN_PST[pstRow][pstCol];
          if (color === 'w') {
            whitePawnFiles[c]++;
            whitePawns.push({ r, c });
          } else {
            blackPawnFiles[c]++;
            blackPawns.push({ r, c });
          }
          break;
        case 'n':
          pstVal = KNIGHT_PST[pstRow][pstCol];
          if (color === 'w') {
            whiteKnights.push({ r, c });
            if (r !== 7) pstVal += 15;
          } else {
            blackKnights.push({ r, c });
            if (r !== 0) pstVal += 15;
          }
          break;
        case 'b':
          pstVal = BISHOP_PST[pstRow][pstCol];
          if (color === 'w') {
            whiteBishops++;
            whitePawns.push({ r, c }); // Add for chain support
            if (r !== 7) pstVal += 15;
          } else {
            blackBishops++;
            blackPawns.push({ r, c }); // Add for chain support
            if (r !== 0) pstVal += 15;
          }
          break;
        case 'r':
          pstVal = ROOK_PST[pstRow][pstCol];
          if (color === 'w') whiteRooks.push({ r, c });
          else blackRooks.push({ r, c });
          break;
        case 'q':
          pstVal = QUEEN_PST[pstRow][pstCol];
          break;
        case 'k':
          pstVal = endgame ? KING_ENDGAME_PST[pstRow][pstCol] : KING_MIDGAME_PST[pstRow][pstCol];
          if (color === 'w') {
            whiteKing = { r, c };
            if (!endgame && (c === 6 || c === 2 || c === 1 || c === 7) && r === 7) {
              pstVal += 45;
            }
          } else {
            blackKing = { r, c };
            if (!endgame && (c === 6 || c === 2 || c === 1 || c === 7) && r === 0) {
              pstVal += 45;
            }
          }
          break;
      }

      // Center control bonus for minor pieces/pawns
      if ((type === 'p' || type === 'n' || type === 'b') && (r === 3 || r === 4) && (c === 3 || c === 4)) {
        pstVal += 20;
      }

      const totalVal = baseVal + pstVal;
      if (color === 'w') {
        score += totalVal;
      } else {
        score -= totalVal;
      }
    }
  }

  // 1. Bishop Pair Bonus
  if (whiteBishops >= 2) score += 30;
  if (blackBishops >= 2) score -= 30;

  // 2. Penalize doubled pawns
  for (let c = 0; c < 8; c++) {
    if (whitePawnFiles[c] > 1) {
      score -= (whitePawnFiles[c] - 1) * 15;
    }
    if (blackPawnFiles[c] > 1) {
      score += (blackPawnFiles[c] - 1) * 15;
    }
  }

  // 3. Isolated Pawns
  whitePawns.forEach(({ c }) => {
    const hasLeftNeighbor = c > 0 && whitePawnFiles[c - 1] > 0;
    const hasRightNeighbor = c < 7 && whitePawnFiles[c + 1] > 0;
    if (!hasLeftNeighbor && !hasRightNeighbor) {
      score -= 15;
    }
  });
  blackPawns.forEach(({ c }) => {
    const hasLeftNeighbor = c > 0 && blackPawnFiles[c - 1] > 0;
    const hasRightNeighbor = c < 7 && blackPawnFiles[c + 1] > 0;
    if (!hasLeftNeighbor && !hasRightNeighbor) {
      score += 15;
    }
  });

  // 4. Pawn Support Chains
  whitePawns.forEach(({ r, c }) => {
    const hasLeftDefender = r < 7 && c > 0 && board[r + 1][c - 1]?.type === 'p' && board[r + 1][c - 1]?.color === 'w';
    const hasRightDefender = r < 7 && c < 7 && board[r + 1][c + 1]?.type === 'p' && board[r + 1][c + 1]?.color === 'w';
    if (hasLeftDefender || hasRightDefender) {
      score += 6;
    }
  });
  blackPawns.forEach(({ r, c }) => {
    const hasLeftDefender = r > 0 && c > 0 && board[r - 1][c - 1]?.type === 'p' && board[r - 1][c - 1]?.color === 'b';
    const hasRightDefender = r > 0 && c < 7 && board[r - 1][c + 1]?.type === 'p' && board[r - 1][c + 1]?.color === 'b';
    if (hasLeftDefender || hasRightDefender) {
      score -= 6;
    }
  });

  // 5. Passed Pawns
  whitePawns.forEach(({ r, c }) => {
    let isPassed = true;
    for (let fileToCheck = Math.max(0, c - 1); fileToCheck <= Math.min(7, c + 1); fileToCheck++) {
      for (let rankToCheck = 0; rankToCheck < r; rankToCheck++) {
        const opposingPiece = board[rankToCheck][fileToCheck];
        if (opposingPiece && opposingPiece.type === 'p' && opposingPiece.color === 'b') {
          isPassed = false;
          break;
        }
      }
      if (!isPassed) break;
    }
    if (isPassed) {
      const rankBonus = [0, 80, 50, 25, 10, 5, 0, 0];
      score += rankBonus[r] || 0;
    }
  });
  blackPawns.forEach(({ r, c }) => {
    let isPassed = true;
    for (let fileToCheck = Math.max(0, c - 1); fileToCheck <= Math.min(7, c + 1); fileToCheck++) {
      for (let rankToCheck = r + 1; rankToCheck < 8; rankToCheck++) {
        const opposingPiece = board[rankToCheck][fileToCheck];
        if (opposingPiece && opposingPiece.type === 'p' && opposingPiece.color === 'w') {
          isPassed = false;
          break;
        }
      }
      if (!isPassed) break;
    }
    if (isPassed) {
      const rankBonus = [0, 0, 5, 10, 25, 50, 80, 0];
      score -= rankBonus[r] || 0;
    }
  });

  // 6. Rooks on Open / Semi-Open Files
  whiteRooks.forEach(({ c }) => {
    if (whitePawnFiles[c] === 0) {
      if (blackPawnFiles[c] === 0) {
        score += 25;
      } else {
        score += 12;
      }
    }
  });
  blackRooks.forEach(({ c }) => {
    if (blackPawnFiles[c] === 0) {
      if (whitePawnFiles[c] === 0) {
        score -= 25;
      } else {
        score -= 12;
      }
    }
  });

  // 7. Knight Outposts
  whiteKnights.forEach(({ r, c }) => {
    if (r >= 2 && r <= 4 && c >= 1 && c <= 6) {
      const isDefendedByPawn = (r < 7 && board[r + 1][c - 1]?.type === 'p' && board[r + 1][c - 1]?.color === 'w') ||
                               (r < 7 && board[r + 1][c + 1]?.type === 'p' && board[r + 1][c + 1]?.color === 'w');
      if (isDefendedByPawn) score += 25;
    }
  });
  blackKnights.forEach(({ r, c }) => {
    if (r >= 3 && r <= 5 && c >= 1 && c <= 6) {
      const isDefendedByPawn = (r > 0 && board[r - 1][c - 1]?.type === 'p' && board[r - 1][c - 1]?.color === 'b') ||
                               (r > 0 && board[r - 1][c + 1]?.type === 'p' && board[r - 1][c + 1]?.color === 'b');
      if (isDefendedByPawn) score -= 25;
    }
  });

  // 8. King Safety Shield
  if (!endgame) {
    if (whiteKing.r === 7) {
      let shieldStrength = 0;
      for (let tc = Math.max(0, whiteKing.c - 1); tc <= Math.min(7, whiteKing.c + 1); tc++) {
        if (board[6][tc]?.type === 'p' && board[6][tc]?.color === 'w') shieldStrength++;
      }
      score += shieldStrength * 10;
    }
    if (blackKing.r === 0) {
      let shieldStrength = 0;
      for (let tc = Math.max(0, blackKing.c - 1); tc <= Math.min(7, blackKing.c + 1); tc++) {
        if (board[1][tc]?.type === 'p' && board[1][tc]?.color === 'b') shieldStrength++;
      }
      score -= shieldStrength * 10;
    }
  }

  return score;
}

/**
 * Quiescence Search for captures ONLY
 * Prevents the horizon effect, where the engine evaluates a position as winning,
 * not realizing it hangs an important piece on the very next ply.
 */
function quiescence(
  game: Chess,
  alpha: number,
  beta: number,
  isMaximizingPlayer: boolean
): number {
  const standPat = evaluateBoard(game);

  if (isMaximizingPlayer) {
    if (standPat >= beta) {
      return beta;
    }
    if (standPat > alpha) {
      alpha = standPat;
    }

    const moves = game.moves({ verbose: true }).filter(m => m.captured);
    // MVV-LVA Sorting (Most Valuable Victim - Least Valuable Aggressor)
    moves.sort((a, b) => {
      const aVic = PIECE_VALUES[a.captured || 'p'] || 100;
      const bVic = PIECE_VALUES[b.captured || 'p'] || 100;
      const aAtt = PIECE_VALUES[a.piece] || 100;
      const bAtt = PIECE_VALUES[b.piece] || 100;
      return (bVic * 10 - bAtt) - (aVic * 10 - aAtt);
    });

    for (const move of moves) {
      game.move({ from: move.from, to: move.to, promotion: move.promotion || 'q' });
      const score = quiescence(game, alpha, beta, false);
      game.undo();

      if (score >= beta) {
        return beta;
      }
      if (score > alpha) {
        alpha = score;
      }
    }
    return alpha;
  } else {
    if (standPat <= alpha) {
      return alpha;
    }
    if (standPat < beta) {
      beta = standPat;
    }

    const moves = game.moves({ verbose: true }).filter(m => m.captured);
    moves.sort((a, b) => {
      const aVic = PIECE_VALUES[a.captured || 'p'] || 100;
      const bVic = PIECE_VALUES[b.captured || 'p'] || 100;
      const aAtt = PIECE_VALUES[a.piece] || 100;
      const bAtt = PIECE_VALUES[b.piece] || 100;
      return (bVic * 10 - bAtt) - (aVic * 10 - aAtt);
    });

    for (const move of moves) {
      game.move({ from: move.from, to: move.to, promotion: move.promotion || 'q' });
      const score = quiescence(game, alpha, beta, true);
      game.undo();

      if (score <= alpha) {
        return alpha;
      }
      if (score < beta) {
        beta = score;
      }
    }
    return beta;
  }
}

/**
 * Minimax with Alpha-Beta pruning, MVV-LVA move ordering, and Quiescence Search
 */
function minimax(
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizingPlayer: boolean
): { score: number; move: string | null } {
  // Base case: game over or depth limit reached
  if (game.isGameOver()) {
    if (game.isCheckmate()) {
      const winningColor = game.turn() === 'w' ? 'b' : 'w';
      return { score: winningColor === 'w' ? (99999 + depth) : (-99999 - depth), move: null };
    }
    return { score: 0, move: null };
  }
  if (depth === 0) {
    return { score: quiescence(game, alpha, beta, isMaximizingPlayer), move: null };
  }

  const moves = game.moves({ verbose: true });
  
  // Advanced Move Ordering to accelerate Alpha-Beta Pruning cutoffs
  moves.sort((a, b) => {
    // 1. MVV-LVA values if capture
    let scoreA = 0;
    let scoreB = 0;
    
    if (a.captured) {
      const victimVal = PIECE_VALUES[a.captured] || 100;
      const attackerVal = PIECE_VALUES[a.piece] || 100;
      scoreA += (victimVal * 10) - attackerVal + 10000;
    }
    if (b.captured) {
      const victimVal = PIECE_VALUES[b.captured] || 100;
      const attackerVal = PIECE_VALUES[b.piece] || 100;
      scoreB += (victimVal * 10) - attackerVal + 10000;
    }

    // 2. Promotion bonus
    if (a.promotion) scoreA += 9000;
    if (b.promotion) scoreB += 9000;

    // 3. Castling bonus
    if (a.flags.includes('k') || a.flags.includes('q')) scoreA += 1000;
    if (b.flags.includes('k') || b.flags.includes('q')) scoreB += 1000;

    // 4. Center control push bonus
    if ((a.piece === 'p' || a.piece === 'n' || a.piece === 'b') && a.to.match(/[d-e][4-5]/)) {
      scoreA += 200;
    }
    if ((b.piece === 'p' || b.piece === 'n' || b.piece === 'b') && b.to.match(/[d-e][4-5]/)) {
      scoreB += 200;
    }

    return scoreB - scoreA;
  });

  let bestMove: string | null = null;

  if (isMaximizingPlayer) {
    let maxEval = -Infinity;
    for (const move of moves) {
      game.move({ from: move.from, to: move.to, promotion: move.promotion || 'q' });
      const evaluation = minimax(game, depth - 1, alpha, beta, false).score;
      game.undo();

      if (evaluation > maxEval) {
        maxEval = evaluation;
        bestMove = move.lan || `${move.from}${move.to}${move.promotion || ''}`;
      }
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) {
        break; // Beta cut-off
      }
    }
    return { score: maxEval, move: bestMove };
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      game.move({ from: move.from, to: move.to, promotion: move.promotion || 'q' });
      const evaluation = minimax(game, depth - 1, alpha, beta, true).score;
      game.undo();

      if (evaluation < minEval) {
        minEval = evaluation;
        bestMove = move.lan || `${move.from}${move.to}${move.promotion || ''}`;
      }
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) {
        break; // Alpha cut-off
      }
    }
    return { score: minEval, move: bestMove };
  }
}

/**
 * Get the next AI move based on difficulty
 * @param fen current board FEN code
 * @param difficulty level of bot
 */
export function getBotMove(fen: string, difficulty: 'beginner' | 'intermediate' | 'master' | 'grandmaster'): { from: string; to: string; promotion?: string } {
  const game = new Chess(fen);
  const moves = game.moves({ verbose: true });

  if (moves.length === 0) {
    throw new Error('No legal moves available');
  }

  // Active color
  const isWhite = game.turn() === 'w';

  // 1. Beginner: Simple move, depth 1 search, with a 30% chance of a completely random move
  if (difficulty === 'beginner') {
    if (Math.random() < 0.35) {
      // Random move
      const randomMove = moves[Math.floor(Math.random() * moves.length)];
      return { from: randomMove.from, to: randomMove.to, promotion: randomMove.promotion };
    }
    // Otherwise clean Minimax depth 1
    const result = minimax(game, 1, -Infinity, Infinity, isWhite);
    return parseResultMove(result.move, moves);
  }

  // 2. Intermediate: Depth 2, solid but with occasional slight structural inaccuracies
  if (difficulty === 'intermediate') {
    if (Math.random() < 0.1) {
      // Slight blunder rating check (10% chance to play 3rd-best move)
      const rankedMoves = moves.map(m => {
        game.move({ from: m.from, to: m.to, promotion: m.promotion || 'q' });
        const evalScore = evaluateBoard(game);
        game.undo();
        return { move: m, score: evalScore };
      });
      // Sort in descending order if White, ascending if Black
      rankedMoves.sort((a, b) => isWhite ? b.score - a.score : a.score - b.score);
      const chosenIdx = Math.min(rankedMoves.length - 1, 2); // 3rd best
      const chosenMove = rankedMoves[chosenIdx].move;
      return { from: chosenMove.from, to: chosenMove.to, promotion: chosenMove.promotion };
    }
    const result = minimax(game, 2, -Infinity, Infinity, isWhite);
    return parseResultMove(result.move, moves);
  }

  // 3. Master: Depth 3 Minimax search
  if (difficulty === 'master') {
    const result = minimax(game, 3, -Infinity, Infinity, isWhite);
    return parseResultMove(result.move, moves);
  }

  // 4. Grandmaster: Depth 4 search (optimized Alpha-Beta)
  // Highly tactical, center-pawn focus, instant response
  const result = minimax(game, 4, -Infinity, Infinity, isWhite);
  return parseResultMove(result.move, moves);
}

/**
 * Map Minimax output string or verbose move structures
 */
function parseResultMove(moveStr: string | null, legalMoves: any[]): { from: string; to: string; promotion?: string } {
  if (!moveStr) {
    const fallback = legalMoves[0];
    return { from: fallback.from, to: fallback.to, promotion: fallback.promotion };
  }

  // Parse LAN (long algebraic notation) e.g., 'e2e4' or 'f7f8q'
  const from = moveStr.substring(0, 2);
  const to = moveStr.substring(2, 4);
  const promotion = moveStr.length > 4 ? moveStr.substring(4, 5) : undefined;
  
  // Verify it is in legal move list
  const valid = legalMoves.find(m => m.from === from && m.to === to);
  if (valid) {
    return { from, to, promotion: promotion || valid.promotion };
  }

  // Fallback
  const fallback = legalMoves[0];
  return { from: fallback.from, to: fallback.to, promotion: fallback.promotion };
}

/**
 * Calculates Captured Pieces & Material Difference
 */
export function getCapturedCountAndDiff(fen: string): { captured: { w: string[]; b: string[] }; diff: number } {
  // Start pieces
  const startCount: { [key: string]: number } = { p: 8, n: 2, b: 2, r: 2, q: 1 };
  
  // Current pieces
  const currentCountW: { [key: string]: number } = { p: 0, n: 0, b: 0, r: 0, q: 0 };
  const currentCountB: { [key: string]: number } = { p: 0, n: 0, b: 0, r: 0, q: 0 };
  
  const game = new Chess(fen);
  const board = game.board();
  
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.type !== 'k') {
        if (piece.color === 'w') {
          currentCountW[piece.type] = (currentCountW[piece.type] || 0) + 1;
        } else {
          currentCountB[piece.type] = (currentCountB[piece.type] || 0) + 1;
        }
      }
    }
  }

  const capturedW: string[] = []; // Pieces captured by Black (originally White)
  const capturedB: string[] = []; // Pieces captured by White (originally Black)
  
  // Material evaluation scale
  const WEIGHTS: { [key: string]: number } = { p: 1, n: 3, b: 3, r: 5, q: 9 };
  let whiteVal = 0;
  let blackVal = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p) {
        const wt = WEIGHTS[p.type] || 0;
        if (p.color === 'w') whiteVal += wt;
        else blackVal += wt;
      }
    }
  }

  // Determine captured lists
  for (const type of ['p', 'n', 'b', 'r', 'q']) {
    const defaultQty = startCount[type];
    
    const missingW = Math.max(0, defaultQty - (currentCountW[type] || 0));
    for (let i = 0; i < missingW; i++) {
      capturedW.push(type);
    }
    
    const missingB = Math.max(0, defaultQty - (currentCountB[type] || 0));
    for (let i = 0; i < missingB; i++) {
      capturedB.push(type);
    }
  }

  return {
    captured: {
      w: capturedW, // captured white pieces
      b: capturedB, // captured black pieces
    },
    diff: whiteVal - blackVal // positive means White leads, negative Black leads
  };
}
