import React from 'react';
import type { GameSession } from '../../types/game';
import { Trophy } from 'lucide-react';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';

interface GlobalScoresCardProps {
  session: GameSession;
}

export const GlobalScoresCard: React.FC<GlobalScoresCardProps> = ({ session }) => {
  const globalCategories = Array.from(new Set(Object.values(session.globalScores).flatMap(scores => scores.map(s => s.category))));

  if (globalCategories.length === 0) return null;

  return (
    <div className="space-y-4 pt-4">
      <Typography variant="section-title" className="ml-2">
        <Trophy size={16} /> Points de fin de partie
      </Typography>
      <Card className="p-5">
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
              {globalCategories.map(cat => (
                <tr key={cat}>
                  <td className="py-3 text-xs font-bold text-slate-600 dark:text-slate-300">{cat}</td>
                  {session.players.map(p => {
                    const points = (session.globalScores[p.id] || []).find(s => s.category === cat)?.points || 0;
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
            </tbody>
         </table>
      </Card>
    </div>
  );
};
