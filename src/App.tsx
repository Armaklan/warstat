import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db/database';
import { Setup } from './components/Setup';
import { Game } from './components/Game';
import { GameDetails } from './components/GameDetails';
import { Statistics } from './components/Statistics';
import { Settings } from './components/Settings';
import { AddCategoryForm } from './components/AddCategoryForm';
import { History as HistoryIcon, PlusCircle, ChevronRight, PlayCircle, Trash2, Sun, Moon, BarChart3, Settings as SettingsIcon } from 'lucide-react';
import { formatDuration, cn } from './utils/utils';
import { useAutoSave } from './hooks/useAutoSave';

function App() {
  useAutoSave();
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [viewingSessionId, setViewingSessionId] = useState<number | null>(null);
  const [showStatistics, setShowStatistics] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const activeSession = useLiveQuery(
    () => activeSessionId ? db.sessions.get(activeSessionId) : undefined,
    [activeSessionId]
  );

  const viewingSession = useLiveQuery(
    () => viewingSessionId ? db.sessions.get(viewingSessionId) : undefined,
    [viewingSessionId]
  );

  const allSessions = useLiveQuery(
    () => db.sessions.orderBy('id').reverse().toArray()
  );

  const handleDeleteSession = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (confirm('Voulez-vous vraiment supprimer cette partie ?')) {
      await db.sessions.delete(id);
    }
  };

  if (activeSession) {
    if (isAddingCategory) {
      return (
        <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors">
          <AddCategoryForm session={activeSession} onBack={() => setIsAddingCategory(false)} />
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors">
        <Game session={activeSession} onAddCategory={() => setIsAddingCategory(true)} />
      </div>
    );
  }

  if (viewingSession) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors">
        <GameDetails session={viewingSession} onBack={() => setViewingSessionId(null)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-16 transition-colors">
      <header className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4 shadow-sm mb-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black italic tracking-tighter text-primary-600 dark:text-primary-400">WARSTAT</h1>
          <p className="text-[8px] opacity-60 uppercase font-black tracking-widest">Score & Time Tracker</p>
        </div>
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:ring-2 ring-primary-500 transition-all"
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      {showSettings ? (
        <Settings />
      ) : showStatistics ? (
        <Statistics />
      ) : showHistory ? (
        <div className="p-4 max-w-2xl mx-auto space-y-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white">Historique</h2>
            <button 
              onClick={() => setShowHistory(false)} 
              className="px-4 py-2 text-sm font-bold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
            >
              Retour
            </button>
          </div>
          <div className="grid gap-4">
            {allSessions?.map(s => (
              <div 
                key={s.id} 
                onClick={() => {
                  if (s.status === 'finished') {
                    setViewingSessionId(s.id!);
                  } else {
                    setActiveSessionId(s.id!);
                  }
                }}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex justify-between items-center cursor-pointer hover:border-primary-500 dark:hover:border-primary-500 transition-all group active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                    s.status !== 'finished' 
                      ? "bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400" 
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 group-hover:text-primary-500"
                  )}>
                    {s.status !== 'finished' ? <PlayCircle size={24} /> : <ChevronRight size={24} />}
                  </div>
                  <div>
                    <p className="font-black text-lg text-slate-800 dark:text-white leading-tight">{s.gameName}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider mt-1">
                      Créée le {new Date(s.createdAt || s.startTime).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                    s.result === 'victory' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                    s.result === 'defeat' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 
                    'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400'
                  )}>
                    {s.status !== 'finished' ? 'En Cours' : (s.result || 'Fini')}
                  </span>
                  {!s.isManual && (
                    <p className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                      {formatDuration((s.endTime ? new Date(s.endTime).getTime() : Date.now()) - new Date(s.startTime).getTime())}
                    </p>
                  )}
                  <button 
                    onClick={(e) => handleDeleteSession(e, s.id!)}
                    className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {(!allSessions || allSessions.length === 0) && (
            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
              <p className="text-slate-400 dark:text-slate-500 font-medium">Aucune partie enregistrée.</p>
            </div>
          )}
        </div>
      ) : (
        <Setup onStart={setActiveSessionId} />
      )}

      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[95%] max-w-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 flex justify-around py-2 rounded-2xl shadow-2xl z-50">
        <button 
          onClick={() => { setShowHistory(false); setActiveSessionId(null); setViewingSessionId(null); setShowStatistics(false); setShowSettings(false); }}
          className={`flex flex-col items-center gap-0.5 transition-all ${!showHistory && !viewingSessionId && !showStatistics && !showSettings ? 'text-primary-600 scale-105' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
        >
          <PlusCircle size={20} />
          <span className="text-[8px] font-black uppercase tracking-tighter">Nouvelle</span>
        </button>
        <button 
          onClick={() => { setShowHistory(true); setViewingSessionId(null); setShowStatistics(false); setShowSettings(false); }}
          className={`flex flex-col items-center gap-0.5 transition-all ${showHistory || viewingSessionId ? 'text-primary-600 scale-105' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
        >
          <HistoryIcon size={20} />
          <span className="text-[8px] font-black uppercase tracking-tighter">Historique</span>
        </button>
        <button 
          onClick={() => { setShowStatistics(true); setShowHistory(false); setViewingSessionId(null); setShowSettings(false); }}
          className={`flex flex-col items-center gap-0.5 transition-all ${showStatistics ? 'text-primary-600 scale-105' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
        >
          <BarChart3 size={20} />
          <span className="text-[8px] font-black uppercase tracking-tighter">Statistique</span>
        </button>
        <button 
          onClick={() => { setShowStatistics(false); setShowHistory(false); setViewingSessionId(null); setShowSettings(true); }}
          className={`flex flex-col items-center gap-0.5 transition-all ${showSettings ? 'text-primary-600 scale-105' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
        >
          <SettingsIcon size={20} />
          <span className="text-[8px] font-black uppercase tracking-tighter">Paramètres</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
