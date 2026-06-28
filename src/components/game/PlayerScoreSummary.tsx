import React from 'react';
import type { GameSession } from '../../types/game';
import { cn, calculatePlayerTotal } from '../../utils/utils';
import { User } from 'lucide-react';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';

interface PlayerScoreSummaryProps {
  session: GameSession;
}

export const PlayerScoreSummary: React.FC<PlayerScoreSummaryProps> = ({ session }) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      {session.players.map(p => (
        <Card key={p.id} className={cn(
          "p-3 flex flex-col items-center justify-center transition-all border rounded-xl shadow-none",
          p.isMe 
            ? "border-blue-100 dark:border-blue-900/30" 
            : "border-red-100 dark:border-red-900/30"
        )}>
          <div className="flex items-center gap-1.5 mb-0.5">
             <User size={10} className={p.isMe ? "text-blue-500" : "text-red-500"} />
             <Typography variant="small-caps" className="text-slate-400 dark:text-slate-500 tracking-[0.1em]">{p.name}</Typography>
          </div>
          <p className="text-3xl font-black text-slate-800 dark:text-white leading-tight">{calculatePlayerTotal(session, p.id)}</p>
        </Card>
      ))}
    </div>
  );
};
