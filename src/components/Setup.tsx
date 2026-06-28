import React, { useState, useEffect } from 'react';
import { db } from '../db/database';
import type { GameSession, Player, GameModel } from '../types/game';
import { Plus, Trash2, Play, Save } from 'lucide-react';
import { Autocomplete } from './Autocomplete';
import { useLiveQuery } from 'dexie-react-hooks';

interface SetupProps {
  onStart: (sessionId: number) => void;
}

export const Setup: React.FC<SetupProps> = ({ onStart }) => {
  const [gameName, setGameName] = useState('');
  const [scenarios, setScenarios] = useState<string[]>(['']);
  const [opponents, setOpponents] = useState<string[]>(['']);
  
  // Model state
  const [turnCategories, setTurnCategories] = useState<string[]>(['Scoring']);
  const [globalCategories, setGlobalCategories] = useState<string[]>([]);
  const [showModelConfig, setShowModelConfig] = useState(false);

  const sessions = useLiveQuery(() => db.sessions.toArray()) || [];
  const models = useLiveQuery(() => db.gameModels.toArray()) || [];

  const gameOptions = Array.from(new Set(sessions.map(s => s.gameName)));
  const scenarioOptions = Array.from(new Set(sessions.flatMap(s => s.scenarios)));
  const opponentOptions = Array.from(new Set(sessions.flatMap(s => s.players).filter(p => !p.isMe).map(p => p.name)));

  useEffect(() => {
    const model = models.find(m => m.gameName === gameName);
    if (model) {
      setTurnCategories(model.turnCategories);
      setGlobalCategories(model.globalCategories);
    }
  }, [gameName, models]);

  const handleAddScenario = () => setScenarios([...scenarios, '']);
  const handleRemoveScenario = (index: number) => setScenarios(scenarios.filter((_, i) => i !== index));
  const handleScenarioChange = (index: number, value: string) => {
    const newScenarios = [...scenarios];
    newScenarios[index] = value;
    setScenarios(newScenarios);
  };

  const handleAddOpponent = () => setOpponents([...opponents, '']);
  const handleRemoveOpponent = (index: number) => setOpponents(opponents.filter((_, i) => i !== index));
  const handleOpponentChange = (index: number, value: string) => {
    const newOpponents = [...opponents];
    newOpponents[index] = value;
    setOpponents(newOpponents);
  };

  const handleSaveModel = async () => {
    if (!gameName.trim()) return;
    const existingModel = await db.gameModels.where('gameName').equalsIgnoreCase(gameName).first();
    const modelData: GameModel = {
      gameName,
      turnCategories: turnCategories.filter(c => c.trim()),
      globalCategories: globalCategories.filter(c => c.trim())
    };
    if (existingModel) {
      await db.gameModels.update(existingModel.id!, modelData);
    } else {
      await db.gameModels.add(modelData);
    }
    setShowModelConfig(false);
  };

  const handleStartGame = async () => {
    if (!gameName.trim()) return;

    const players: Player[] = [
      { id: 'me', name: 'Moi', isMe: true },
      ...opponents
        .filter(name => name.trim())
        .map((name, i) => ({ id: `opp-${i}`, name, isMe: false }))
    ];

    const model = models.find(m => m.gameName === gameName);
    
    // Initial scores based on model if it exists
    const tCats = model?.turnCategories || turnCategories.filter(c => c.trim());
    const gCats = model?.globalCategories || globalCategories.filter(c => c.trim());

    const initialTurnScores = players.reduce((acc, p) => ({ 
      ...acc, 
      [p.id]: (tCats.length > 0 ? tCats : ['Scoring']).map(cat => ({ category: cat, points: 0 }))
    }), {});

    const initialGlobalScores = players.reduce((acc, p) => ({ 
      ...acc, 
      [p.id]: gCats.map(cat => ({ category: cat, points: 0 }))
    }), {});

    const hasCategories = tCats.length > 0 || gCats.length > 0;

    const newSession: GameSession = {
      gameName,
      scenarios: scenarios.filter(s => s.trim()),
      players,
      startTime: new Date(),
      turns: hasCategories ? [{
        number: 1,
        startTime: new Date(),
        scores: initialTurnScores
      }] : [],
      globalScores: initialGlobalScores,
      status: hasCategories ? 'playing' : 'setup'
    };

    const id = await db.sessions.add(newSession);
    onStart(id as number);
  };

  return (
    <div className="p-4 max-w-md mx-auto space-y-8 pb-32">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-slate-800 dark:text-white">Nouvelle Partie</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Configurez votre session de jeu</p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Nom du jeu</label>
          <Autocomplete
            value={gameName}
            onChange={setGameName}
            options={gameOptions}
            placeholder="ex: Warhammer 40k"
          />
          <button 
            onClick={() => setShowModelConfig(!showModelConfig)}
            className="text-[10px] font-black uppercase text-primary-600 dark:text-primary-400 hover:underline ml-1"
          >
            {showModelConfig ? "Masquer la configuration du modèle" : "Configurer les catégories par défaut (Modèle)"}
          </button>
        </div>

        {showModelConfig && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Catégories par tour</label>
              {turnCategories.map((cat, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={cat}
                    onChange={(e) => {
                      const newCats = [...turnCategories];
                      newCats[i] = e.target.value;
                      setTurnCategories(newCats);
                    }}
                    className="flex-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-white"
                  />
                  <button onClick={() => setTurnCategories(turnCategories.filter((_, idx) => idx !== i))} className="text-red-500"><Trash2 size={16}/></button>
                </div>
              ))}
              <button onClick={() => setTurnCategories([...turnCategories, ''])} className="text-[10px] font-bold text-primary-500 flex items-center gap-1"><Plus size={14}/> Ajouter une catégorie</button>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Catégories de fin de partie</label>
              {globalCategories.map((cat, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={cat}
                    onChange={(e) => {
                      const newCats = [...globalCategories];
                      newCats[i] = e.target.value;
                      setGlobalCategories(newCats);
                    }}
                    className="flex-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-white"
                  />
                  <button onClick={() => setGlobalCategories(globalCategories.filter((_, idx) => idx !== i))} className="text-red-500"><Trash2 size={16}/></button>
                </div>
              ))}
              <button onClick={() => setGlobalCategories([...globalCategories, ''])} className="text-[10px] font-bold text-primary-500 flex items-center gap-1"><Plus size={14}/> Ajouter une catégorie de fin de partie</button>
            </div>
            <button 
              onClick={handleSaveModel}
              className="w-full py-2 bg-slate-800 text-white rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2"
            >
              <Save size={16}/> Enregistrer le modèle
            </button>
          </div>
        )}

        <div className="space-y-3">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Scénarios</label>
          <div className="space-y-2">
            {scenarios.map((s, i) => (
              <div key={i} className="flex gap-2 group">
                <Autocomplete
                  value={s}
                  onChange={(val) => handleScenarioChange(i, val)}
                  options={scenarioOptions}
                  placeholder={`Scénario ${i + 1}`}
                  className="p-3 text-sm rounded-xl"
                />
                {scenarios.length > 1 && (
                  <button onClick={() => handleRemoveScenario(i)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button 
            onClick={handleAddScenario} 
            className="flex items-center gap-2 text-primary-600 dark:text-primary-400 text-xs font-bold hover:opacity-80 transition-opacity ml-1"
          >
            <Plus size={16} /> Ajouter un scénario
          </button>
        </div>

        <div className="space-y-3 pt-2">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Adversaires</label>
          <div className="space-y-2">
            {opponents.map((o, i) => (
              <div key={i} className="flex gap-2 group">
                <Autocomplete
                  value={o}
                  onChange={(val) => handleOpponentChange(i, val)}
                  options={opponentOptions}
                  placeholder={`Nom de l'adversaire ${i + 1}`}
                  className="p-3 text-sm rounded-xl"
                />
                {opponents.length > 1 && (
                  <button onClick={() => handleRemoveOpponent(i)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button 
            onClick={handleAddOpponent} 
            className="flex items-center gap-2 text-primary-600 dark:text-primary-400 text-xs font-bold hover:opacity-80 transition-opacity ml-1"
          >
            <Plus size={16} /> Ajouter un adversaire
          </button>
        </div>
      </div>

      <button
        onClick={handleStartGame}
        disabled={!gameName.trim()}
        className="w-full py-5 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 transition-all shadow-xl shadow-primary-500/20 active:scale-[0.98]"
      >
        <Play size={24} fill="currentColor" /> Lancer la partie
      </button>
    </div>
  );
};
