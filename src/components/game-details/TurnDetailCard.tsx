import React from 'react';
import type { GameSession, Turn } from '../../types/game';
import { formatDuration } from '../../utils/utils';
import { Clock } from 'lucide-react';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';

interface TurnDetailCardProps {
  turn: Turn;
  session: GameSession;
}

export const TurnDetailCard: React.FC<TurnDetailCardProps> = ({ turn, session }) => {
  const getTurnDuration = (turn: Turn) => {
    if (!turn.startTime) return 0;
    const end = turn.endTime ? new Date(turn.endTime).getTime() : Date.now();
    return end - new Date(turn.startTime).getTime();
  };

  return (
    <Card key={turn.number} className="overflow-hidden">
      <div className="px-5 py-4 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="bg-slate-900 dark:bg-slate-700 text-white w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black">
            T{turn.number}
          </span>
          <span className="font-black text-slate-800 dark:text-white">Tour {turn.number}</span>
        </div>
        {!session.isManual && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono font-bold">
            <Clock size={14} /> {formatDuration(getTurnDuration(turn))}
          </div>
        )}
      </div>
      
      <div className="p-5 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-50 dark:border-slate-800">
              <th className="pb-3"><Typography variant="small-caps" className="text-slate-400">Catégorie</Typography></th>
              {session.players.map(p => (
                <th key={p.id} className="pb-3 text-center">
                  <Typography variant="small-caps" className="text-slate-400">{p.name}</Typography>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
            {Object.values(turn.scores)[0]?.map(s => s.category).map(cat => (
              <tr key={cat} className="group">
                <td className="py-3 text-xs font-bold text-slate-600 dark:text-slate-300">{cat}</td>
                {session.players.map(p => {
                  const points = (turn.scores[p.id] || []).find(s => s.category === cat)?.points || 0;
                  return (
                    <td key={p.id} className="py-3 text-center font-black text-sm dark:text-white">
                      {points > 0 ? (
                        <span className="text-green-600 dark:text-green-400">+{points}</span>
                      ) : points < 0 ? (
                        <span className="text-red-600 dark:text-red-400">{points}</span>
                      ) : (
                        <span className="opacity-20">0</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="bg-slate-50/30 dark:bg-slate-800/20">
              <td className="py-3"><Typography variant="small-caps" className="text-slate-400">Total Tour</Typography></td>
              {session.players.map(p => (
                <td key={p.id} className="py-3 text-center font-black text-sm text-slate-900 dark:text-white">
                  {(turn.scores[p.id] || []).reduce((s, e) => s + e.points, 0)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
};
