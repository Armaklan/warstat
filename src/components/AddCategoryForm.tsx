import React, { useState } from 'react';
import { db } from '../db/database';
import type { GameSession } from '../types/game';
import { X, Check } from 'lucide-react';
import { Button } from './ui/Button';
import { Input, Label } from './ui/Input';
import { Typography } from './ui/Typography';

interface AddCategoryFormProps {
  session: GameSession;
  onBack: () => void;
}

export const AddCategoryForm: React.FC<AddCategoryFormProps> = ({ session, onBack }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'turn' | 'global'>('turn');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const categoryName = name.trim();

    if (type === 'global') {
      const updatedGlobalScores = { ...session.globalScores };
      session.players.forEach(p => {
        if (!updatedGlobalScores[p.id]) updatedGlobalScores[p.id] = [];
        if (!updatedGlobalScores[p.id].some(s => s.category === categoryName)) {
          updatedGlobalScores[p.id].push({ category: categoryName, points: 0 });
        }
      });
      await db.sessions.update(session.id!, { globalScores: updatedGlobalScores });
    } else {
      const updatedTurns = [...session.turns];
      const lastTurn = updatedTurns[updatedTurns.length - 1];
      if (lastTurn) {
        session.players.forEach(p => {
          if (!lastTurn.scores[p.id]) lastTurn.scores[p.id] = [];
          if (!lastTurn.scores[p.id].some(s => s.category === categoryName)) {
            lastTurn.scores[p.id].push({ category: categoryName, points: 0 });
          }
        });
        await db.sessions.update(session.id!, { turns: updatedTurns });
      }
    }

    // Update model
    const existingModel = await db.gameModels.where('gameName').equalsIgnoreCase(session.gameName).first();
    const turnCats = (session.turns[session.turns.length - 1]?.scores[session.players[0].id] || []).map(s => s.category);
    const globalCats = (session.globalScores[session.players[0].id] || []).map(s => s.category);
    
    if (type === 'turn') turnCats.push(categoryName);
    else globalCats.push(categoryName);

    const modelData = {
      gameName: session.gameName,
      turnCategories: Array.from(new Set(turnCats)),
      globalCategories: Array.from(new Set(globalCats))
    };

    if (existingModel) {
      await db.gameModels.update(existingModel.id!, {
        gameName: modelData.gameName,
        turnCategories: modelData.turnCategories,
        globalCategories: modelData.globalCategories
      });
    } else {
      await db.gameModels.add(modelData);
    }

    onBack();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-md mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <Typography variant="h3">Nouvelle catégorie</Typography>
          <Button 
            variant="secondary"
            size="icon"
            onClick={onBack}
          >
            <X size={24} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="category-name">
              Nom de la catégorie
            </Label>
            <Input
              id="category-name"
              autoFocus
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Primaire, Assassinat..."
            />
          </div>

          <div className="space-y-2">
            <Label>
              Type de scoring
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant={type === 'turn' ? 'primary' : 'outline'}
                size="lg"
                onClick={() => setType('turn')}
                className="py-4"
              >
                Par tour
              </Button>
              <Button
                type="button"
                variant={type === 'global' ? 'primary' : 'outline'}
                size="lg"
                onClick={() => setType('global')}
                className="py-4"
              >
                Global
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={!name.trim()}
            className="w-full mt-8"
          >
            <Check size={24} strokeWidth={3} /> Valider
          </Button>
        </form>
      </div>
    </div>
  );
};
