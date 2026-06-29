import React from 'react';
import type { GameSession } from '../types/game';
import { formatSessionResults } from '../utils/utils';
import { History } from 'lucide-react';
import { Typography } from './ui/Typography';
import { GameDetailsHeader } from './game-details/GameDetailsHeader';
import { GameSessionSummary } from './game-details/GameSessionSummary';
import { TurnDetailCard } from './game-details/TurnDetailCard';
import { GlobalScoresCard } from './game-details/GlobalScoresCard';

interface GameDetailsProps {
  session: GameSession;
  onBack: () => void;
}

export const GameDetails: React.FC<GameDetailsProps> = ({ session, onBack }) => {
  const [copied, setCopied] = React.useState(false);
  const globalElapsed = (session.endTime ? new Date(session.endTime).getTime() : Date.now()) - new Date(session.startTime).getTime();

  const handleCopyResult = () => {
    const resultText = formatSessionResults(session);
    navigator.clipboard.writeText(resultText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto pb-24">
      <GameDetailsHeader 
        onBack={onBack} 
        onCopy={handleCopyResult} 
        copied={copied} 
      />

      <GameSessionSummary 
        session={session} 
        globalElapsed={globalElapsed} 
      />

      <div className="space-y-4">
        <Typography variant="section-title" className="ml-2">
          <History size={16} /> Détail des tours
        </Typography>
        
        <div className="space-y-4">
          {session.turns.map((turn) => (
            <TurnDetailCard 
              key={turn.number} 
              turn={turn} 
              session={session} 
            />
          ))}
        </div>
      </div>

      <GlobalScoresCard session={session} />
    </div>
  );
};
