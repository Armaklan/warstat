import React from 'react';
import type { GameSession } from '../../types/game';
import { formatDuration } from '../../utils/utils';
import { Clock, MessageSquare } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Typography } from '../ui/Typography';
import { Badge } from '../ui/Badge';

interface GameHeaderProps {
  session: GameSession;
  globalElapsed: number;
  onOpenNotes: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({ session, globalElapsed, onOpenNotes }) => {
  return (
    <Card variant="dark" className="p-4 overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none"></div>
      <div className="relative z-10 flex justify-between items-center">
        <div>
          <Typography variant="h2" className="text-xl">{session.gameName}</Typography>
          <div className="flex flex-col gap-1 mt-1">
            <Typography variant="small-caps" className="opacity-40 tracking-[0.2em]">{session.scenarios.join(' • ')}</Typography>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onOpenNotes}
              className="hover:bg-white/10 text-primary-400 z-20"
              aria-label="Commentaires"
            >
              <MessageSquare size={18} />
            </Button>
            {!session.isManual && (
              <div className="flex items-center gap-1.5 text-base font-mono font-black text-primary-400 leading-none">
                <Clock size={16} /> {formatDuration(globalElapsed)}
              </div>
            )}
          </div>
          <Badge className="bg-white/10 opacity-60">
            {session.status}
          </Badge>
        </div>
      </div>
    </Card>
  );
};
