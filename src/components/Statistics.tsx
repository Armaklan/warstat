import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { formatDuration, cn } from '../utils/utils';
import { BarChart2, PieChart, Users, Clock, Hash, ChevronLeft } from 'lucide-react';

interface StatisticsProps {
  onBack: () => void;
}

export const Statistics: React.FC<StatisticsProps> = ({ onBack }) => {
  const allSessions = useLiveQuery(() => db.sessions.toArray());
  const [selectedGame, setSelectedGame] = useState<string>('all');
  const [selectedOpponent, setSelectedOpponent] = useState<string>('all');

  const stats = useMemo(() => {
    if (!allSessions) return null;

    let filtered = allSessions.filter(s => s.status === 'finished');
    
    // Get unique games for the selector
    const games = Array.from(new Set(filtered.map(s => s.gameName)));

    if (selectedGame !== 'all') {
      filtered = filtered.filter(s => s.gameName === selectedGame);
    }

    // Get unique opponents for the selected game(s)
    const opponents = Array.from(new Set(filtered.flatMap(s => 
      s.players.filter(p => !p.isMe).map(p => p.name)
    )));

    if (selectedOpponent !== 'all') {
      filtered = filtered.filter(s => 
        s.players.some(p => !p.isMe && p.name === selectedOpponent)
      );
    }

    const totalGames = filtered.length;
    let totalTime = 0;
    let wins = 0;
    let losses = 0;
    let draws = 0;

    // Turn breakdown: { turnNumber: { totalDuration, count, max } }
    // turnNumber 0 = deployment
    const turnBreakdown: Record<number, { total: number; count: number; max: number }> = {};

    const addDurationToBreakdown = (num: number, duration: number) => {
      if (!turnBreakdown[num]) {
        turnBreakdown[num] = { total: 0, count: 0, max: 0 };
      }
      turnBreakdown[num].total += duration;
      turnBreakdown[num].count += 1;
      if (duration > turnBreakdown[num].max) turnBreakdown[num].max = duration;
    };

    filtered.forEach(s => {
      if (s.endTime && s.startTime) {
        totalTime += new Date(s.endTime).getTime() - new Date(s.startTime).getTime();
      }
      if (s.result === 'victory') wins++;
      else if (s.result === 'defeat') losses++;
      else draws++;

      // Deployment duration
      if (s.deploymentStartTime && s.deploymentEndTime) {
        const duration = new Date(s.deploymentEndTime).getTime() - new Date(s.deploymentStartTime).getTime();
        addDurationToBreakdown(0, duration);
      }

      // Turns duration
      s.turns.forEach(t => {
        if (t.startTime && t.endTime) {
          const duration = new Date(t.endTime).getTime() - new Date(t.startTime).getTime();
          addDurationToBreakdown(t.number, duration);
        }
      });
    });

    const averageTime = totalGames > 0 ? totalTime / totalGames : 0;

    const formattedBreakdown = Object.entries(turnBreakdown)
      .map(([num, data]) => ({
        number: parseInt(num),
        average: data.total / data.count,
        max: data.max
      }))
      .sort((a, b) => a.number - b.number);

    return {
      totalGames,
      totalTime,
      averageTime,
      wins,
      losses,
      draws,
      winRate: totalGames > 0 ? (wins / totalGames) * 100 : 0,
      lossRate: totalGames > 0 ? (losses / totalGames) * 100 : 0,
      drawRate: totalGames > 0 ? (draws / totalGames) * 100 : 0,
      games,
      opponents,
      turnBreakdown: formattedBreakdown,
      globalMaxTurnDuration: Math.max(0, ...formattedBreakdown.map(b => b.max))
    };
  }, [allSessions, selectedGame, selectedOpponent]);

  if (!stats) return <div className="p-8 text-center">Chargement...</div>;

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white">Statistiques</h2>
        <button 
          onClick={onBack} 
          className="px-4 py-2 text-sm font-bold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
        >
          Retour
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
            <PieChart size={12} /> Jeu
          </label>
          <select 
            value={selectedGame}
            onChange={(e) => { setSelectedGame(e.target.value); setSelectedOpponent('all'); }}
            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-2 font-bold text-slate-800 dark:text-white focus:ring-2 ring-primary-500 transition-all outline-none"
          >
            <option value="all">Tous les jeux</option>
            {stats.games.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
            <Users size={12} /> Adversaire
          </label>
          <select 
            value={selectedOpponent}
            onChange={(e) => setSelectedOpponent(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-2 font-bold text-slate-800 dark:text-white focus:ring-2 ring-primary-500 transition-all outline-none"
          >
            <option value="all">Tous les adversaires</option>
            {stats.opponents.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <Hash className="mx-auto text-primary-500 mb-2" size={20} />
          <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Parties</p>
          <p className="text-xl font-black text-slate-800 dark:text-white">{stats.totalGames}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <Clock className="mx-auto text-primary-500 mb-2" size={20} />
          <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Temps Moyen</p>
          <p className="text-sm font-black text-slate-800 dark:text-white mt-1">{formatDuration(stats.averageTime)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <BarChart2 className="mx-auto text-primary-500 mb-2" size={20} />
          <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Temps Total</p>
          <p className="text-sm font-black text-slate-800 dark:text-white mt-1">{formatDuration(stats.totalTime)}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-center font-black uppercase tracking-widest text-slate-400 text-xs mb-8">Répartition des résultats</h3>
        
        {stats.totalGames > 0 ? (
          <div className="space-y-8">
            <div className="relative h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div 
                style={{ width: `${stats.winRate}%` }} 
                className="h-full bg-green-500 transition-all duration-500"
                title={`Victoires: ${stats.wins}`}
              />
              <div 
                style={{ width: `${stats.drawRate}%` }} 
                className="h-full bg-slate-400 transition-all duration-500"
                title={`Nuls: ${stats.draws}`}
              />
              <div 
                style={{ width: `${stats.lossRate}%` }} 
                className="h-full bg-red-500 transition-all duration-500"
                title={`Défaites: ${stats.losses}`}
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <div className="inline-block w-3 h-3 bg-green-500 rounded-sm mr-1"></div>
                <span className="text-[10px] font-black uppercase text-slate-500">Victoires</span>
                <p className="text-lg font-black text-slate-800 dark:text-white">{Math.round(stats.winRate)}%</p>
                <p className="text-[10px] font-bold text-slate-400">{stats.wins} partie(s)</p>
              </div>
              <div className="text-center">
                <div className="inline-block w-3 h-3 bg-slate-400 rounded-sm mr-1"></div>
                <span className="text-[10px] font-black uppercase text-slate-500">Nuls</span>
                <p className="text-lg font-black text-slate-800 dark:text-white">{Math.round(stats.drawRate)}%</p>
                <p className="text-[10px] font-bold text-slate-400">{stats.draws} partie(s)</p>
              </div>
              <div className="text-center">
                <div className="inline-block w-3 h-3 bg-red-500 rounded-sm mr-1"></div>
                <span className="text-[10px] font-black uppercase text-slate-500">Défaites</span>
                <p className="text-lg font-black text-slate-800 dark:text-white">{Math.round(stats.lossRate)}%</p>
                <p className="text-[10px] font-bold text-slate-400">{stats.losses} partie(s)</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-slate-400 font-medium">Aucune donnée pour cette sélection.</p>
          </div>
        )}
      </div>

      {selectedGame !== 'all' && stats.turnBreakdown.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <h3 className="text-center font-black uppercase tracking-widest text-slate-400 text-xs">Durée par phase</h3>
          
          <div className="space-y-4">
            {stats.turnBreakdown.map((phase) => (
              <div key={phase.number} className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {phase.number === 0 ? 'Déploiement' : `Tour ${phase.number}`}
                  </span>
                  <div className="flex gap-4">
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Moyen</p>
                      <p className="text-xs font-black text-slate-800 dark:text-white">{formatDuration(phase.average)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Max</p>
                      <p className="text-xs font-black text-slate-800 dark:text-white">{formatDuration(phase.max)}</p>
                    </div>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${(phase.average / stats.globalMaxTurnDuration) * 100}%` }} 
                    className="h-full bg-primary-500 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
