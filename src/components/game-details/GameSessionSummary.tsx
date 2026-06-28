import React from 'react';
import type { GameSession } from '../../types/game';
import { formatDuration, calculatePlayerTotal } from '../../utils/utils';
import { Clock, Calendar, User, Layout } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Typography } from '../ui/Typography';

interface GameSessionSummaryProps {
  session: GameSession;
  globalElapsed: number;
}

export const GameSessionSummary: React.FC<GameSessionSummaryProps> = ({ session, globalElapsed }) => {
  return (
    <Card variant="dark" className="p-6">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
      <div className="relative z-10 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <Typography variant="h2" className="text-white">{session.gameName}</Typography>
            <div className="flex flex-col gap-1 mt-3">
              <Typography variant="small-caps" className="opacity-50 flex items-center gap-1">
                <Calendar size={12} /> {new Date(session.startTime).toLocaleDateString()}
              </Typography>
              <Typography variant="small-caps" className="opacity-50 flex items-center gap-1">
                <Layout size={12} /> {session.scenarios.join(', ')}
              </Typography>
            </div>
          </div>
          <div className="text-right">
            <Badge 
              variant={
                session.result === 'victory' ? 'success' :
                session.result === 'defeat' ? 'danger' : 'neutral'
              }
            >
              {session.result || 'Terminé'}
            </Badge>
            {!session.isManual && (
              <div className="flex items-center justify-end gap-1 text-2xl font-mono font-black mt-2 text-primary-400">
                <Clock size={20} /> {formatDuration(globalElapsed)}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
          {session.players.map(p => (
            <Card key={p.id} variant="glass" className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <User size={12} className={p.isMe ? "text-blue-400" : "text-red-400"} />
                <div className="flex flex-col">
                  <Typography variant="small-caps" className="opacity-40 leading-none">{p.name}</Typography>
                  {p.army && <span className="text-[8px] font-bold opacity-30 uppercase tracking-tighter mt-0.5">{p.army}</span>}
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black">{calculatePlayerTotal(session, p.id)}</span>
                <Typography variant="small-caps" className="opacity-30 tracking-tighter">pts</Typography>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Card>
  );
};
