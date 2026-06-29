import React, {useState} from 'react';
import {db} from '../db/database';
import type {GameSession, Turn} from '../types/game';
import {formatSessionResults, calculatePlayerTotal} from '../utils/utils';
import {useTimer} from '../hooks/useTimer';
import { GameHeader } from './game/GameHeader';
import { PlayerScoreSummary } from './game/PlayerScoreSummary';
import { GameSetupView } from './game/GameSetupView';
import { GameDeploymentView } from './game/GameDeploymentView';
import { GamePlayingView } from './game/GamePlayingView';
import { GameFinishedView } from './game/GameFinishedView';
import { GameNotesView } from './game/GameNotesView';
import { GameScenarioView } from './game/GameScenarioView';

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
  const [isFinishing, setIsFinishing] = useState(!!session.isManual && session.status === 'playing');
  const [copied, setCopied] = useState(false);
  const [isShowingNotes, setIsShowingNotes] = useState(false);
  const [isShowingScenario, setIsShowingScenario] = useState(false);

  const handleUpdateNotes = async (notes: string) => {
    await db.sessions.update(session.id!, { notes });
  };

  const handleUpdateScenario = async (scenarioDetails: Record<string, string>) => {
    await db.sessions.update(session.id!, { scenarioDetails });

    // Also update global scenario details
    for (const [sName, details] of Object.entries(scenarioDetails)) {
      const existing = await db.scenarios.where({ gameName: session.gameName, name: sName }).first();
      if (existing) {
        await db.scenarios.update(existing.id!, { details });
      } else {
        await db.scenarios.add({
          gameName: session.gameName,
          name: sName,
          details
        });
      }
    }
  };

  const handleCopyResult = () => {
    const resultText = formatSessionResults(session);
    navigator.clipboard.writeText(resultText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartDeployment = async () => {
    await db.sessions.update(session.id!, {
      status: 'deployment',
      deploymentStartTime: new Date()
    });
  };

  const handleStartTurns = async () => {
    let updatedTurns = [...session.turns];
    
    if (updatedTurns.length > 0) {
      // Si on a déjà des tours (initialisés au setup), on met à jour le startTime du premier tour
      updatedTurns[0] = {
        ...updatedTurns[0],
        startTime: new Date()
      };
    } else {
      // Sinon on crée le premier tour à partir du modèle ou par défaut
      const model = await db.gameModels.where('gameName').equalsIgnoreCase(session.gameName).first();
      const tCats = model?.turnCategories || ['Scoring'];
      
      updatedTurns = [{
        number: 1,
        startTime: new Date(),
        scores: session.players.reduce((acc, p) => ({ 
          ...acc, 
          [p.id]: tCats.map(cat => ({ category: cat, points: 0 }))
        }), {})
      }];
    }

    await db.sessions.update(session.id!, {
      status: 'playing',
      deploymentEndTime: new Date(),
      turns: updatedTurns
    });
  };

  const handleNextTurn = async () => {
    const lastTurn = session.turns[session.turns.length - 1];
    lastTurn.endTime = new Date();

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

    const myScore = calculatePlayerTotal(session, 'me');
    const opponents = session.players.filter(p => !p.isMe);
    const maxOpponentScore = Math.max(...opponents.map(p => calculatePlayerTotal(session, p.id)));

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

  return (
    <div className="p-3 space-y-4 max-w-2xl mx-auto pb-28">
      <GameHeader 
        session={session} 
        globalElapsed={globalElapsed} 
        onOpenNotes={() => setIsShowingNotes(true)}
        onOpenScenario={() => setIsShowingScenario(true)}
      />

      {isShowingNotes && (
        <GameNotesView 
          notes={session.notes || ''} 
          onClose={() => setIsShowingNotes(false)}
          onChange={handleUpdateNotes}
        />
      )}

      {isShowingScenario && (
        <GameScenarioView 
          scenarios={session.scenarios}
          details={typeof session.scenarioDetails === 'object' && session.scenarioDetails !== null ? session.scenarioDetails : {}} 
          onClose={() => setIsShowingScenario(false)}
          onChange={handleUpdateScenario}
        />
      )}
      
      <PlayerScoreSummary session={session} />

      {session.status === 'setup' && (
        <GameSetupView onStartDeployment={handleStartDeployment} />
      )}

      {session.status === 'deployment' && (
        <GameDeploymentView 
          deploymentElapsed={deploymentElapsed} 
          onStartTurns={handleStartTurns} 
        />
      )}

      {session.status === 'playing' && (
        <GamePlayingView 
          session={session}
          isFinishing={isFinishing}
          turnElapsed={turnElapsed}
          editingTurnNumber={editingTurnNumber}
          setEditingTurnNumber={setEditingTurnNumber}
          onAddCategory={onAddCategory}
          onNextTurn={handleNextTurn}
          onFinishGame={handleFinishGame}
          onConfirmFinish={confirmFinishGame}
          onQuickScore={handleQuickScore}
          onGlobalQuickScore={handleGlobalQuickScore}
        />
      )}

      {session.status === 'finished' && (
        <GameFinishedView 
          session={session} 
          copied={copied} 
          onCopyResult={handleCopyResult} 
        />
      )}
    </div>
  );
};

