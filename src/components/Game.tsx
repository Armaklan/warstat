import React, {useState} from 'react';
import {db} from '../db/database';
import type {GameSession, Turn} from '../types/game';
import {cn, formatDuration, formatSessionResults} from '../utils/utils';
import {useTimer} from '../hooks/useTimer';
import {CheckCircle, Clock, Copy, Edit2, History, Play, Plus, SkipForward, User} from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Typography } from './ui/Typography';
import { Badge } from './ui/Badge';

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
  const [isFinishing, setIsFinishing] = useState(session.isManual && session.status === 'playing');
  const [copied, setCopied] = useState(false);

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

  return (
    <div className="p-3 space-y-4 max-w-2xl mx-auto pb-28">
      {/* Header Info */}
      <Card variant="dark" className="p-4">
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <Typography variant="h2" className="text-xl">{session.gameName}</Typography>
            <div className="flex flex-col gap-1 mt-1">
              <Typography variant="small-caps" className="opacity-40 tracking-[0.2em]">{session.scenarios.join(' • ')}</Typography>
            </div>
          </div>
          <div className="text-right">
            {!session.isManual && (
              <div className="flex items-center gap-1.5 text-base font-mono font-black text-primary-400 leading-none mb-1">
                <Clock size={16} /> {formatDuration(globalElapsed)}
              </div>
            )}
            <Badge className="bg-white/10 opacity-60">
              {session.status}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Player Scores Summary */}
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
            <p className="text-3xl font-black text-slate-800 dark:text-white leading-tight">{calculateTotal(p.id)}</p>
          </Card>
        ))}
      </div>

      {session.status === 'setup' && (
        <Button 
          onClick={handleStartDeployment} 
          size="lg"
          className="w-full"
        >
          <Play size={24} fill="currentColor" /> Lancer le déploiement
        </Button>
      )}

      {session.status === 'deployment' && (
        <div className="space-y-6 text-center py-6">
          <div className="p-10 border-2 border-dashed border-primary-300 dark:border-primary-900/50 rounded-3xl bg-primary-50 dark:bg-primary-950/20">
            <Typography variant="small-caps" className="text-primary-600 dark:text-primary-400 tracking-[0.2em] mb-4 block">Temps de déploiement</Typography>
            <p className="text-6xl font-mono font-black text-slate-800 dark:text-white">{formatDuration(deploymentElapsed)}</p>
          </div>
          <Button 
            onClick={handleStartTurns} 
            size="lg"
            className="w-full bg-green-600 hover:bg-green-700 shadow-green-500/20"
          >
            <Play size={24} fill="currentColor" /> Lancer les tours
          </Button>
        </div>
      )}

      {session.status === 'playing' && (
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
                onClick={confirmFinishGame} 
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700 shadow-green-500/20"
              >
                <CheckCircle size={24} /> Valider le résultat
              </Button>
            ) : (
              <>
                <Button 
                  onClick={handleNextTurn} 
                  className="flex-1 shadow-lg shadow-primary-500/20 active:scale-95"
                >
                  <SkipForward size={18} fill="currentColor" /> Tour suivant
                </Button>
                <Button 
                  onClick={handleFinishGame} 
                  variant="secondary"
                  className="flex-1 hover:bg-red-500 hover:text-white active:scale-95"
                >
                  <CheckCircle size={18} /> Fin
                </Button>
              </>
            )}
          </div>

          {/* Previous Turns History */}
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
      )}

      {session.status === 'finished' && (
        <div className="text-center space-y-8 py-10 px-2 animate-in fade-in zoom-in duration-500">
          <Card 
            className={cn(
              "p-12 shadow-2xl relative overflow-hidden",
              session.result === 'victory' ? "bg-green-600 text-white border-none" :
              session.result === 'defeat' ? "bg-red-600 text-white border-none" : "bg-slate-700 text-white border-none"
            )}
          >
            <div className="absolute top-0 left-0 w-full h-full bg-white/10 opacity-20 -rotate-12 translate-y-20 translate-x-20 rounded-3xl pointer-events-none"></div>
            <div className="relative z-10">
              <Typography variant="small-caps" className="mb-4 opacity-70 tracking-[0.3em] block">Résultat de la Partie</Typography>
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
              <Button 
                onClick={handleCopyResult}
                className="mt-6 mx-auto bg-white/20 hover:bg-white/30 border-none text-[10px] py-2 px-4"
              >
                <Copy size={12} />
                {copied ? 'Copié !' : 'Copier le résultat'}
              </Button>
            </div>
          </Card>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
            size="lg"
            className="w-full py-5 text-slate-900 dark:text-white border-slate-800 dark:border-slate-700 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 shadow-xl"
          >
            Retour à l'accueil
          </Button>
        </div>
      )}
    </div>
  );
};

