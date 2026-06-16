import React from 'react';

/**
 * Renders a standard vertical evaluation bar alongside the chessboard.
 */
interface EvalBarProps {
  score: number; // positive = white advantage
  orientation: 'white' | 'black';
}

export const EvalBar: React.FC<EvalBarProps> = ({ score, orientation }) => {
  // Clamp score between -10 and +10 for display purposes
  const clampedScore = Math.max(-10, Math.min(10, score));
  
  // Calculate percentage of the bar that should be filled by White (0% to 100%)
  // At score 0, white fill is 50%.
  // Non-linear mapping to exaggerate small advantages
  const winProbability = 50 + (50 * (2 / Math.PI) * Math.atan(clampedScore / 2.5));

  // Determine top/bottom fill based on board orientation
  // If orientation is white, White is at the bottom, so White fills from the bottom up.
  const whiteFillsFromBottom = orientation === 'white';
  
  const whitePercent = Math.round(winProbability);
  const blackPercent = 100 - whitePercent;

  const topColor = whiteFillsFromBottom ? 'bg-gray-800' : 'bg-gray-200';
  const bottomColor = whiteFillsFromBottom ? 'bg-gray-200' : 'bg-gray-800';

  const topPercent = whiteFillsFromBottom ? blackPercent : whitePercent;
  
  const displayScore = score > 0 ? `+${score.toFixed(1)}` : score < 0 ? score.toFixed(1) : '0.0';
  
  return (
    <div className="w-5 md:w-6 h-full flex flex-col items-center bg-gray-900 border-2 border-white/10 rounded-lg overflow-hidden shadow-inner relative select-none">
      {/* Top Section */}
      <div 
        className={`w-full transition-all duration-700 ease-in-out ${topColor}`}
        style={{ height: `${topPercent}%` }}
      />
      {/* Bottom Section */}
      <div 
        className={`w-full flex-grow transition-all duration-700 ease-in-out ${bottomColor}`}
      />
      
      {/* Score Label placement */}
      <div 
        className={`absolute text-[8px] md:text-[10px] font-mono font-bold px-0.5 w-full text-center tracking-tighter ${
          whiteFillsFromBottom
            ? (score >= 0 ? 'bottom-1 text-gray-800' : 'top-1 text-gray-200')
            : (score >= 0 ? 'top-1 text-gray-800' : 'bottom-1 text-gray-200')
        }`}
      >
        {displayScore}
      </div>
    </div>
  );
};
