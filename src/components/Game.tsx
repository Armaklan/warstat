import React, { useState } from 'react';
import { db } from '../db/database';
import type { GameSession, ScoreEntry, Turn } from '../types/game';
import { formatDuration } from '../utils/utils';
import { useTimer } from '../hooks/useTimer';
import { Play, SkipForward, CheckCircle, Plus, Clock, History, Edit2, User, Trophy, Layout, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../utils/utils';

interface GameProps {
  session: GameSession;
  onAddCategory: () => void;
}

export const Game: React.FC<GameProps> = ({ session, onAddCategory }) => {
  const globalElapsed = useTimer(session.startTime, session.endTime);
  const currentTurn = session.turns[session.turns.length - 1];
  const turnElapsed = useTimer(currentTurn?.startTime, currentTurn?.endTime);
  const deploymentElapsed = useTimer(session.deploymentStartTime, session.deploymentEndTime);

  const [editingTurnNumber, setEditingTurnNumber] = useState<number | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);

  const calculateTotal = (playerId: string) => {
    const turnPoints = session.turns.reduce((sum, turn) => {
      const playerScores = turn.scores[playerId] || [];
      return sum + playerScores.reduce((s, e) => s + e.points, 0);
    }, 0);
    const globalPoints = (session.globalScores[playerId] || []).reduce((s, e) => s + e.points, 0);
    return turnPoints + globalPoints;
  };

  const handleStartDeployment = async () => {
    await db.sessions.update(session.id!, {
      status: 'deployment',
      deploymentStartTime: new Date()
    });
  };

  const handleStartTurns = async () => {
    const firstTurn: Turn = {
      number: 1,
      startTime: new Date(),
      scores: session.players.reduce((acc, p) => ({ ...acc, [p.id]: [{ category: 'Scoring', points: 0 }] }), {})
    };
    await db.sessions.update(session.id!, {
      status: 'playing',
      deploymentEndTime: new Date(),
      turns: [firstTurn]
    });
  };

  const handleNextTurn = async () => {
    const lastTurn = session.turns[session.turns.length - 1];
    lastTurn.endTime = new Date();

    // Récupérer les catégories du tour précédent pour les reporter
    const lastCategories = Object.values(lastTurn.scores)[0]?.map(s => s.category) || ['Scoring'];

    const nextTurn: Turn = {
      number: lastTurn.number + 1,
      startTime: new Date(),
      scores: session.players.reduce((acc, p) => ({ 
        ...acc, 
        [p.id]: lastCategories.map(cat => ({ category: cat, points: 0 }))
      }), {})
    };

    await db.sessions.update(session.id!, {
      turns: [...session.turns, nextTurn]
    });
  };

  const handleFinishGame = async () => {
    setIsFinishing(true);
  };

  const confirmFinishGame = async () => {
    const lastTurn = session.turns[session.turns.length - 1];
    if (lastTurn) lastTurn.endTime = new Date();

    const myScore = calculateTotal('me');
    const opponents = session.players.filter(p => !p.isMe);
    const maxOpponentScore = Math.max(...opponents.map(p => calculateTotal(p.id)));

    let result: 'victory' | 'defeat' | 'draw' = 'draw';
    if (myScore > maxOpponentScore) result = 'victory';
    else if (myScore < maxOpponentScore) result = 'defeat';

    await db.sessions.update(session.id!, {
      status: 'finished',
      endTime: new Date(),
      result
    });
  };

  const handleQuickScore = async (playerId: string, category: string, delta: number, turnNumber?: number) => {
    const updatedTurns = [...session.turns];
    const targetTurn = turnNumber 
      ? updatedTurns.find(t => t.number === turnNumber)
      : updatedTurns[updatedTurns.length - 1];
      
    if (targetTurn) {
      const playerScores = [...(targetTurn.scores[playerId] || [])];
      const categoryIndex = playerScores.findIndex(s => s.category === category);

      if (categoryIndex !== -1) {
        playerScores[categoryIndex] = {
          ...playerScores[categoryIndex],
          points: playerScores[categoryIndex].points + delta
        };
      } else {
        playerScores.push({ category: category, points: delta });
      }

      targetTurn.scores[playerId] = playerScores;
      await db.sessions.update(session.id!, { turns: updatedTurns });
    }
  };

  const handleGlobalQuickScore = async (playerId: string, category: string, delta: number) => {
    const updatedGlobalScores = { ...session.globalScores };
    const playerScores = [...(updatedGlobalScores[playerId] || [])];
    const categoryIndex = playerScores.findIndex(s => s.category === category);

    if (categoryIndex !== -1) {
      playerScores[categoryIndex] = {
        ...playerScores[categoryIndex],
        points: playerScores[categoryIndex].points + delta
      };
    } else {
      playerScores.push({ category: category, points: delta });
    }

    updatedGlobalScores[playerId] = playerScores;
    await db.sessions.update(session.id!, { globalScores: updatedGlobalScores });
  };


  const getCategories = (turn?: Turn, isGlobal: boolean = false) => {
    if (isGlobal) {
      return (session.globalScores[session.players[0].id] || []).map(s => s.category);
    }
    const targetTurn = turn || currentTurn;
    if (!targetTurn) return [];
    // On prend les catégories du premier joueur du tour cible
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

  const calculateTurnTotal = (playerId: string) => {
    const lastTurn = session.turns[session.turns.length - 1];
    if (!lastTurn) return 0;
    return (lastTurn.scores[playerId] || []).reduce((s, e) => s + e.points, 0);
  };

  return (
    <div className="p-3 space-y-4 max-w-2xl mx-auto pb-28">
      {/* Header Info */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black italic tracking-tighter leading-none">{session.gameName}</h2>
            <div className="flex flex-col gap-1 mt-1">
              <p className="text-[9px] opacity-40 font-black uppercase tracking-[0.2em]">{session.scenarios.join(' • ')}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5 text-base font-mono font-black text-primary-400 leading-none mb-1">
              <Clock size={16} /> {formatDuration(globalElapsed)}
            </div>
            <div className="px-1.5 py-0.5 bg-white/10 rounded font-black text-[8px] uppercase tracking-widest inline-block opacity-60">
              {session.status}
            </div>
          </div>
        </div>
      </div>

      {/* Player Scores Summary */}
      <div className="grid grid-cols-2 gap-3">
        {session.players.map(p => (
          <div key={p.id} className={cn(
            "p-3 rounded-xl border flex flex-col items-center justify-center transition-all",
            p.isMe 
              ? "bg-white dark:bg-slate-900 border-blue-100 dark:border-blue-900/30" 
              : "bg-white dark:bg-slate-900 border-red-100 dark:border-red-900/30"
          )}>
            <div className="flex items-center gap-1.5 mb-0.5">
               <User size={10} className={p.isMe ? "text-blue-500" : "text-red-500"} />
               <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">{p.name}</p>
            </div>
            <p className="text-3xl font-black text-slate-800 dark:text-white leading-tight">{calculateTotal(p.id)}</p>
          </div>
        ))}
      </div>

      {session.status === 'setup' && (
        <button 
          onClick={handleStartDeployment} 
          className="w-full py-5 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-primary-500/20 active:scale-[0.98] transition-all"
        >
          <Play size={24} fill="currentColor" /> Lancer le déploiement
        </button>
      )}

      {session.status === 'deployment' && (
        <div className="space-y-6 text-center py-6">
          <div className="p-10 border-2 border-dashed border-primary-300 dark:border-primary-900/50 rounded-3xl bg-primary-50 dark:bg-primary-950/20">
            <p className="text-xs text-primary-600 dark:text-primary-400 font-black uppercase tracking-[0.2em] mb-4">Temps de déploiement</p>
            <p className="text-6xl font-mono font-black text-slate-800 dark:text-white">{formatDuration(deploymentElapsed)}</p>
          </div>
          <button 
            onClick={handleStartTurns} 
            className="w-full py-5 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-green-500/20 active:scale-[0.98] transition-all"
          >
            <Play size={24} fill="currentColor" /> Lancer les tours
          </button>
        </div>
      )}

      {session.status === 'playing' && (
        <div className="space-y-4">
          <div className="flex justify-between items-end px-1">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">Phase Actuelle</p>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white leading-none">
                {isFinishing ? 'Fin de partie' : `Tour ${currentTurn.number}`}
              </h3>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">Temps du tour</p>
              <p className="font-mono text-xl font-black text-slate-700 dark:text-slate-300 leading-none">{formatDuration(turnElapsed)}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2">
                      Joueur
                      {!isFinishing && (
                        <button 
                          onClick={onAddCategory}
                          className="p-1 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                        >
                          <Plus size={10} strokeWidth={4} />
                        </button>
                      )}
                    </th>
                    {getCategories(undefined, isFinishing).map(cat => (
                      <th key={cat} className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 text-center">
                        {cat}
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
                              onClick={() => isFinishing ? handleGlobalQuickScore(p.id, cat, -1) : handleQuickScore(p.id, cat, -1)}
                              className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-black text-lg hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-90 transition-all shadow-sm"
                            >
                              -
                            </button>
                            <span className="text-xl font-black min-w-[1.5rem] text-center text-slate-800 dark:text-white">
                              {getScoreValue(p.id, cat, undefined, isFinishing)}
                            </span>
                            <button 
                              onClick={() => isFinishing ? handleGlobalQuickScore(p.id, cat, 1) : handleQuickScore(p.id, cat, 1)}
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
                      <td colSpan={getCategories(undefined, true).length + 1} className="p-6 text-center text-[10px] text-slate-400 dark:text-slate-500 italic font-medium">
                        Aucune catégorie de fin de partie définie
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>


          <div className="flex gap-3 pt-1">
            {isFinishing ? (
              <button 
                onClick={confirmFinishGame} 
                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-green-500/20 active:scale-[0.98] transition-all"
              >
                <CheckCircle size={24} /> Valider le résultat
              </button>
            ) : (
              <>
                <button 
                  onClick={handleNextTurn} 
                  className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 active:scale-95 transition-all"
                >
                  <SkipForward size={18} fill="currentColor" /> Tour suivant
                </button>
                <button 
                  onClick={handleFinishGame} 
                  className="flex-1 py-3 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-black text-xs flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all active:scale-95"
                >
                  <CheckCircle size={18} /> Fin
                </button>
              </>
            )}
          </div>

          {/* Previous Turns History */}
          <div className="space-y-3 pt-2">
            <h3 className="font-black text-[9px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 flex items-center gap-2 ml-1">
              <History size={14} /> Historique
            </h3>
            <div className="space-y-3">
              {[...session.turns].reverse().slice(1).map(turn => (
                <div key={turn.number} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                       <span className="bg-slate-900 dark:bg-slate-700 text-white w-5 h-5 rounded flex items-center justify-center text-[9px] font-black">T{turn.number}</span>
                       <span className="font-black text-[10px] text-slate-700 dark:text-slate-300 uppercase tracking-widest">Tour {turn.number}</span>
                    </div>
                    <button 
                      onClick={() => setEditingTurnNumber(editingTurnNumber === turn.number ? null : turn.number)}
                      className={cn(
                        "p-1.5 rounded-lg transition-all",
                        editingTurnNumber === turn.number ? "bg-primary-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300"
                      )}
                    >
                      <Edit2 size={14} />
                    </button>
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
                                      onClick={() => handleQuickScore(p.id, cat, -1, turn.number)}
                                      className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center font-black text-[10px] hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-90 transition-all"
                                    >
                                      -
                                    </button>
                                    <span className="text-[11px] font-black min-w-[0.8rem] dark:text-white">
                                      {getScoreValue(p.id, cat, turn)}
                                    </span>
                                    <button 
                                      onClick={() => handleQuickScore(p.id, cat, 1, turn.number)}
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
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{p.name}</span>
                          <span className="font-black text-base text-slate-800 dark:text-white">{(turn.scores[p.id] || []).reduce((s, e) => s + e.points, 0)} <span className="text-[9px] opacity-30">pts</span></span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {session.turns.length <= 1 && (
                <div className="p-6 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl text-center">
                   <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest italic">Aucun tour précédent</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {session.status === 'finished' && (
        <div className="text-center space-y-8 py-10 px-2 animate-in fade-in zoom-in duration-500">
          <div className={cn(
            "p-12 rounded-3xl shadow-2xl relative overflow-hidden",
            session.result === 'victory' ? "bg-green-600 text-white" :
            session.result === 'defeat' ? "bg-red-600 text-white" : "bg-slate-700 text-white"
          )}>
            <div className="absolute top-0 left-0 w-full h-full bg-white/10 opacity-20 -rotate-12 translate-y-20 translate-x-20 rounded-3xl"></div>
            <p className="text-xs uppercase font-black tracking-[0.3em] mb-4 opacity-70">Résultat de la Partie</p>
            <h2 className="text-6xl font-black mb-4 tracking-tighter italic">
              {session.result === 'victory' ? 'VICTOIRE' :
               session.result === 'defeat' ? 'DÉFAITE' : 'MATCH NUL'}
            </h2>
            <div className="h-px bg-white/20 w-24 mx-auto mb-6"></div>
            <p className="text-4xl font-mono font-black flex items-center justify-center gap-4">
              <span>{calculateTotal('me')}</span>
              <span className="text-lg opacity-40">vs</span>
              <span>{Math.max(...session.players.filter(p => !p.isMe).map(p => calculateTotal(p.id)))}</span>
            </p>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full py-5 bg-white dark:bg-slate-900 border-2 border-slate-800 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl font-black text-lg hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all shadow-xl active:scale-95"
          >
            Retour à l'accueil
          </button>
        </div>
      )}
    </div>
  );
};

// Helper for cn (already imported at the top)
