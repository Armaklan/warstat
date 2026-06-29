import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../db/database';
import type { GameSession, Player, GameModel } from '../types/game';
import { Play, CheckCircle2 } from 'lucide-react';
import { Autocomplete } from './Autocomplete';
import { useLiveQuery } from 'dexie-react-hooks';
import { Button } from './ui/Button';
import { Input, Label } from './ui/Input';
import { Typography } from './ui/Typography';
import { ModelConfigCard } from './setup/ModelConfigCard';
import { ScenarioField } from './setup/ScenarioField';
import { OpponentField } from './setup/OpponentField';

interface SetupProps {
  onStart: (sessionId: number) => void;
}

export const Setup: React.FC<SetupProps> = ({ onStart }) => {
  const [gameName, setGameName] = useState('');
  const [myArmy, setMyArmy] = useState('');
  const [scenarios, setScenarios] = useState<string[]>(['']);
  const [opponents, setOpponents] = useState<string[]>(['']);
  const [opponentArmies, setOpponentArmies] = useState<string[]>(['']);
  
  const [isFinished, setIsFinished] = useState(false);
  const [gameDate, setGameDate] = useState(new Date().toISOString().split('T')[0]);

  // Model state
  const [turnCategories, setTurnCategories] = useState<string[]>(['Scoring']);
  const [globalCategories, setGlobalCategories] = useState<string[]>([]);
  const [showModelConfig, setShowModelConfig] = useState(false);

  const sessions = useLiveQuery(() => db.sessions.toArray()) || [];
  const models = useLiveQuery(() => db.gameModels.toArray()) || [];

  const gameOptions = useMemo(() => Array.from(new Set(sessions.map(s => s.gameName))), [sessions]);
  
  const scenarioOptions = useMemo(() => {
    const relevantSessions = gameName ? sessions.filter(s => s.gameName === gameName) : sessions;
    return Array.from(new Set(relevantSessions.flatMap(s => s.scenarios)));
  }, [sessions, gameName]);

  const opponentOptions = useMemo(() => {
    const relevantSessions = gameName ? sessions.filter(s => s.gameName === gameName) : sessions;
    return Array.from(new Set(relevantSessions.flatMap(s => s.players).filter(p => !p.isMe).map(p => p.name)));
  }, [sessions, gameName]);

  const armyOptions = useMemo(() => {
    const relevantSessions = gameName ? sessions.filter(s => s.gameName === gameName) : sessions;
    return Array.from(new Set(relevantSessions.flatMap(s => s.players).map(p => p.army).filter(Boolean) as string[]));
  }, [sessions, gameName]);

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

  const handleAddOpponent = () => {
    setOpponents([...opponents, '']);
    setOpponentArmies([...opponentArmies, '']);
  };
  const handleRemoveOpponent = (index: number) => {
    setOpponents(opponents.filter((_, i) => i !== index));
    setOpponentArmies(opponentArmies.filter((_, i) => i !== index));
  };
  const handleOpponentChange = (index: number, value: string) => {
    const newOpponents = [...opponents];
    newOpponents[index] = value;
    setOpponents(newOpponents);
  };
  const handleOpponentArmyChange = (index: number, value: string) => {
    const newArmies = [...opponentArmies];
    newArmies[index] = value;
    setOpponentArmies(newArmies);
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
      await db.gameModels.update(existingModel.id!, {
        gameName,
        turnCategories: modelData.turnCategories,
        globalCategories: modelData.globalCategories
      });
    } else {
      await db.gameModels.add(modelData);
    }
    setShowModelConfig(false);
  };

  const handleStartGame = async () => {
    if (!gameName.trim()) return;

    const activeScenarios = scenarios.filter(s => s.trim());
    const scenarioDetails: Record<string, string> = {};
    for (const sName of activeScenarios) {
      const scenario = await db.scenarios.where({ gameName, name: sName }).first();
      if (scenario) {
        scenarioDetails[sName] = scenario.details;
      }
    }

    const players: Player[] = [
      { id: 'me', name: 'Moi', isMe: true, army: myArmy },
      ...opponents
        .filter(name => name.trim())
        .map((name, i) => ({ id: `opp-${i}`, name, isMe: false, army: opponentArmies[i] }))
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
      [p.id]: (gCats.length > 0 ? gCats : (isFinished ? ['Score Final'] : [])).map(cat => ({ category: cat, points: 0 }))
    }), {});

    const hasCategories = tCats.length > 0 || gCats.length > 0;

    const newSession: GameSession = {
      gameName,
      scenarios: activeScenarios,
      players,
      startTime: isFinished ? new Date(gameDate) : new Date(),
      createdAt: isFinished ? new Date(gameDate) : new Date(),
      turns: isFinished ? [] : (hasCategories ? [{
        number: 1,
        startTime: new Date(),
        scores: initialTurnScores
      }] : []),
      globalScores: initialGlobalScores,
      status: isFinished ? 'playing' : (hasCategories ? 'playing' : 'setup'),
      isManual: isFinished,
      scenarioDetails
    };

    const id = await db.sessions.add(newSession);
    onStart(id as number);
  };

  return (
    <div className="p-4 max-w-md mx-auto space-y-8 pb-32">
      <div className="text-center space-y-2">
        <Typography variant="h3">Nouvelle Partie</Typography>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Configurez votre session de jeu</p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Nom du jeu</Label>
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

        <div className="space-y-2">
          <Label>Mon armée</Label>
          <Autocomplete
            value={myArmy}
            onChange={setMyArmy}
            options={armyOptions}
            placeholder="ex: Space Marines"
          />
        </div>

        {showModelConfig && (
          <ModelConfigCard 
            turnCategories={turnCategories}
            setTurnCategories={setTurnCategories}
            globalCategories={globalCategories}
            setGlobalCategories={setGlobalCategories}
            onSaveModel={handleSaveModel}
          />
        )}

        <ScenarioField 
          scenarios={scenarios}
          scenarioOptions={scenarioOptions}
          onScenarioChange={handleScenarioChange}
          onAddScenario={handleAddScenario}
          onRemoveScenario={handleRemoveScenario}
        />

        <OpponentField 
          opponents={opponents}
          opponentArmies={opponentArmies}
          opponentOptions={opponentOptions}
          armyOptions={armyOptions}
          onOpponentChange={handleOpponentChange}
          onOpponentArmyChange={handleOpponentArmyChange}
          onAddOpponent={handleAddOpponent}
          onRemoveOpponent={handleRemoveOpponent}
        />
      </div>

      <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <input 
              type="checkbox" 
              checked={isFinished}
              onChange={(e) => setIsFinished(e.target.checked)}
              className="sr-only"
            />
            <div className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center ${
              isFinished 
                ? 'bg-primary-500 border-primary-500' 
                : 'border-slate-300 dark:border-slate-700 group-hover:border-primary-400'
            }`}>
              {isFinished && <CheckCircle2 size={16} className="text-white" />}
            </div>
          </div>
          <span className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">Partie terminée</span>
        </label>

        {isFinished && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-2">
              <Label>Date de la partie</Label>
              <Input 
                type="date"
                value={gameDate}
                onChange={(e) => setGameDate(e.target.value)}
                className="p-3 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      <Button
        onClick={handleStartGame}
        disabled={!gameName.trim()}
        size="lg"
        className="w-full"
      >
        <Play size={24} fill="currentColor" /> {isFinished ? 'Enregistrer la partie' : 'Lancer la partie'}
      </Button>
    </div>
  );
};
