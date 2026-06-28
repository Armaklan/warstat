import React, { useState } from 'react';
import { db } from '../db/database';
import type { GameSession } from '../types/game';
import { X, Check } from 'lucide-react';

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
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">Nouvelle catégorie</h2>
          <button 
            onClick={onBack}
            className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
              Nom de la catégorie
            </label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Primaire, Assassinat..."
              className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-lg font-bold focus:ring-4 ring-primary-500/10 outline-none transition-all dark:text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
              Type de scoring
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setType('turn')}
                className={`p-4 rounded-2xl border-2 font-bold transition-all ${
                  type === 'turn' 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' 
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400'
                }`}
              >
                Par tour
              </button>
              <button
                type="button"
                onClick={() => setType('global')}
                className={`p-4 rounded-2xl border-2 font-bold transition-all ${
                  type === 'global' 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' 
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400'
                }`}
              >
                Global
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-5 bg-primary-600 disabled:opacity-50 hover:bg-primary-700 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-primary-500/20 active:scale-[0.98] transition-all mt-8"
          >
            <Check size={24} strokeWidth={3} /> Valider
          </button>
        </form>
      </div>
    </div>
  );
};
