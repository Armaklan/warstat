import React from 'react';
import type { GameSession, Turn } from '../types/game';
import { formatDuration, cn, formatSessionResults } from '../utils/utils';
import { Clock, History, ChevronLeft, Calendar, User, Trophy, Layout, Copy } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Typography } from './ui/Typography';

interface GameDetailsProps {
  session: GameSession;
  onBack: () => void;
}

export const GameDetails: React.FC<GameDetailsProps> = ({ session, onBack }) => {
  const [copied, setCopied] = React.useState(false);
  const globalElapsed = (session.endTime?.getTime() || Date.now()) - new Date(session.startTime).getTime();

  const handleCopyResult = () => {
    const resultText = formatSessionResults(session);
    navigator.clipboard.writeText(resultText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const calculateTotal = (playerId: string) => {
    const turnPoints = session.turns.reduce((sum, turn) => {
      const playerScores = turn.scores[playerId] || [];
      return sum + playerScores.reduce((s, e) => s + e.points, 0);
    }, 0);
    const globalPoints = (session.globalScores[playerId] || []).reduce((s, e) => s + e.points, 0);
    return turnPoints + globalPoints;
  };

  const getTurnDuration = (turn: Turn) => {
    if (!turn.startTime) return 0;
    const end = turn.endTime ? new Date(turn.endTime).getTime() : Date.now();
    return end - new Date(turn.startTime).getTime();
  };

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto pb-24">
      <div className="flex justify-between items-center">
        <Button 
          variant="ghost" 
          onClick={onBack} 
          className="gap-2 font-bold"
        >
          <ChevronLeft size={20} /> Retour
        </Button>
        <Button 
          variant="secondary"
          onClick={handleCopyResult}
          className="gap-2"
        >
          <Copy size={14} />
          {copied ? 'Copié !' : 'Copier'}
        </Button>
      </div>

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
                  <span className="text-3xl font-black">{calculateTotal(p.id)}</span>
                  <Typography variant="small-caps" className="opacity-30 tracking-tighter">pts</Typography>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <Typography variant="section-title" className="ml-2">
          <History size={16} /> Détail des tours
        </Typography>
        
        <div className="space-y-4">
          {session.turns.map((turn) => (
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
          ))}
        </div>
      </div>

      {(Object.keys(session.globalScores).length > 0) && (
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
                  {Array.from(new Set(Object.values(session.globalScores).flatMap(scores => scores.map(s => s.category)))).map(cat => (
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
      )}
    </div>
  );
};
