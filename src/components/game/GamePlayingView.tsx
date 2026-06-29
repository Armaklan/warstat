import React from 'react';
import type { GameSession, Turn } from '../../types/game';
import { cn, formatDuration } from '../../utils/utils';
import { History, Plus, SkipForward, CheckCircle, Edit2, ScrollText } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';

interface GamePlayingViewProps {
  session: GameSession;
  isFinishing: boolean;
  turnElapsed: number;
  editingTurnNumber: number | null;
  setEditingTurnNumber: (num: number | null) => void;
  onAddCategory: () => void;
  onNextTurn: () => void;
  onFinishGame: () => void;
  onConfirmFinish: () => void;
  onQuickScore: (playerId: string, category: string, delta: number, turnNumber?: number) => void;
  onGlobalQuickScore: (playerId: string, category: string, delta: number) => void;
}

export const GamePlayingView: React.FC<GamePlayingViewProps> = ({
  session,
  isFinishing,
  turnElapsed,
  editingTurnNumber,
  setEditingTurnNumber,
  onAddCategory,
  onNextTurn,
  onFinishGame,
  onConfirmFinish,
  onQuickScore,
  onGlobalQuickScore,
}) => {
  const currentTurn = session.turns[session.turns.length - 1];

  const getCategories = (turn?: Turn, isGlobal: boolean = false) => {
    if (isGlobal) {
      return (session.globalScores[session.players[0].id] || []).map(s => s.category);
    }
    const targetTurn = turn || currentTurn;
    if (!targetTurn) return [];
    return (targetTurn.scores[session.players[0].id] || []).map(s => s.category);
  };

  const getScoreValue = (playerId: string, category: string, turn?: Turn, isGlobal: boolean = false) => {
    if (isGlobal) {
      return (session.globalScores[playerId] || []).find(s => s.category === category)?.points || 0;
    }
    const targetTurn = turn || currentTurn;
    if (!targetTurn) return 0;
    return (targetTurn.scores[playerId] || []).find(s => s.category === category)?.points || 0;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end px-1">
        <div>
          <Typography variant="small-caps" className="text-slate-400 dark:text-slate-500 mb-0.5 block">Phase Actuelle</Typography>
          <h3 className="text-3xl font-black text-slate-800 dark:text-white leading-none">
            {isFinishing ? 'Fin de partie' : `Tour ${currentTurn?.number || 1}`}
          </h3>
        </div>
        {!session.isManual && (
          <div className="text-right">
            <Typography variant="small-caps" className="text-slate-400 dark:text-slate-500 mb-0.5 block">Temps du tour</Typography>
            <p className="font-mono text-xl font-black text-slate-700 dark:text-slate-300 leading-none">{formatDuration(turnElapsed)}</p>
          </div>
        )}
      </div>

      {session.scenarioDetails && (
        <Card className="p-3 bg-primary-50/50 dark:bg-primary-900/10 border-primary-100 dark:border-primary-900/20 space-y-3">
          {typeof session.scenarioDetails === 'string' ? (
            <div className="flex items-start gap-2">
              <ScrollText size={16} className="text-primary-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <Typography variant="small-caps" className="text-primary-600 dark:text-primary-400 mb-1 block text-[10px]">Détails du Scénario</Typography>
                <div className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">
                  {session.scenarioDetails}
                </div>
              </div>
            </div>
          ) : (
            Object.entries(session.scenarioDetails)
              .filter(([_, details]) => details?.trim())
              .map(([sName, details], idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <ScrollText size={16} className="text-primary-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <Typography variant="small-caps" className="text-primary-600 dark:text-primary-400 mb-1 block text-[10px]">
                      {sName}
                    </Typography>
                    <div className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">
                      {details}
                    </div>
                  </div>
                </div>
              ))
          )}
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="p-3">
                  <div className="flex items-center gap-2">
                    <Typography variant="small-caps" className="text-slate-400 dark:text-slate-500">Joueur</Typography>
                    {!isFinishing && (
                      <button 
                        onClick={onAddCategory}
                        className="p-1 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                      >
                        <Plus size={10} strokeWidth={4} />
                      </button>
                    )}
                  </div>
                </th>
                {getCategories(undefined, isFinishing).map(cat => (
                  <th key={cat} className="p-3 text-center">
                    <Typography variant="small-caps" className="text-slate-400 dark:text-slate-500">{cat}</Typography>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {session.players.map(p => (
                <tr key={p.id}>
                  <td className="p-3 font-black text-xs text-slate-700 dark:text-slate-300">{p.name}</td>
                  {getCategories(undefined, isFinishing).map(cat => (
                    <td key={cat} className="p-2">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => isFinishing ? onGlobalQuickScore(p.id, cat, -1) : onQuickScore(p.id, cat, -1)}
                          className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-black text-lg hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-90 transition-all shadow-sm"
                        >
                          -
                        </button>
                        <span className="text-xl font-black min-w-[1.5rem] text-center text-slate-800 dark:text-white">
                          {getScoreValue(p.id, cat, undefined, isFinishing)}
                        </span>
                        <button 
                          onClick={() => isFinishing ? onGlobalQuickScore(p.id, cat, 1) : onQuickScore(p.id, cat, 1)}
                          className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-black text-lg hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-90 transition-all shadow-sm"
                        >
                          +
                        </button>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
              {isFinishing && getCategories(undefined, true).length === 0 && (
                <tr>
                  <td colSpan={getCategories(undefined, true).length + 1} className="p-6 text-center">
                    <Typography variant="small-caps" className="text-slate-400 dark:text-slate-500 italic font-medium lowercase normal-case">Aucune catégorie de fin de partie définie</Typography>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex gap-3 pt-1">
        {isFinishing ? (
          <Button 
            onClick={onConfirmFinish} 
            size="lg"
            className="w-full bg-green-600 hover:bg-green-700 shadow-green-500/20"
          >
            <CheckCircle size={24} /> Valider le résultat
          </Button>
        ) : (
          <>
            <Button 
              onClick={onNextTurn} 
              className="flex-1 shadow-lg shadow-primary-500/20 active:scale-95"
            >
              <SkipForward size={18} fill="currentColor" /> Tour suivant
            </Button>
            <Button 
              onClick={onFinishGame} 
              variant="secondary"
              className="flex-1 hover:bg-red-500 hover:text-white active:scale-95"
            >
              <CheckCircle size={18} /> Fin
            </Button>
          </>
        )}
      </div>

      <div className="space-y-3 pt-2">
        <Typography variant="section-title" className="ml-1">
          <History size={14} /> Historique
        </Typography>
        <div className="space-y-3">
          {[...session.turns].reverse().slice(1).map(turn => (
            <Card key={turn.number} className="overflow-hidden">
              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                   <span className="bg-slate-900 dark:bg-slate-700 text-white w-5 h-5 rounded flex items-center justify-center text-[9px] font-black">T{turn.number}</span>
                   <Typography variant="small-caps" className="text-slate-700 dark:text-slate-300">Tour {turn.number}</Typography>
                </div>
                <Button 
                  variant={editingTurnNumber === turn.number ? 'primary' : 'ghost'}
                  size="icon"
                  onClick={() => setEditingTurnNumber(editingTurnNumber === turn.number ? null : turn.number)}
                  className={cn(
                    "p-1.5 rounded-lg",
                    editingTurnNumber === turn.number && "shadow-lg"
                  )}
                >
                  <Edit2 size={14} />
                </Button>
              </div>
              
              {editingTurnNumber === turn.number ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-50 dark:border-slate-800">
                        <th className="p-2 text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Joueur</th>
                        {getCategories(turn).map(cat => (
                          <th key={cat} className="p-2 text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 text-center">
                            {cat.substring(0, 3)}.
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/30">
                      {session.players.map(p => (
                        <tr key={p.id}>
                          <td className="p-2 font-bold text-[10px] text-slate-700 dark:text-slate-400">{p.name}</td>
                          {getCategories(turn).map(cat => (
                            <td key={cat} className="p-2 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button 
                                  onClick={() => onQuickScore(p.id, cat, -1, turn.number)}
                                  className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center font-black text-[10px] hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-90 transition-all"
                                >
                                  -
                                </button>
                                <span className="text-[11px] font-black min-w-[0.8rem] dark:text-white">
                                  {getScoreValue(p.id, cat, turn)}
                                </span>
                                <button 
                                  onClick={() => onQuickScore(p.id, cat, 1, turn.number)}
                                  className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center font-black text-[10px] hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-90 transition-all"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-3 grid grid-cols-2 gap-3 bg-white dark:bg-slate-900/50">
                  {session.players.map(p => (
                    <div key={p.id} className="flex flex-col gap-0.5">
                      <Typography variant="small-caps" className="text-slate-400 dark:text-slate-500">{p.name}</Typography>
                      <span className="font-black text-base text-slate-800 dark:text-white">{(turn.scores[p.id] || []).reduce((s, e) => s + e.points, 0)} <span className="text-[9px] opacity-30">pts</span></span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
          {session.turns.length <= 1 && (
            <div className="p-6 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl text-center">
               <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest italic">Aucun tour précédent</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
