import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Label } from '../ui/Input';
import { Card } from '../ui/Card';
import { Autocomplete } from '../Autocomplete';

interface OpponentFieldProps {
  opponents: string[];
  opponentArmies: string[];
  opponentOptions: string[];
  armyOptions: string[];
  onOpponentChange: (index: number, value: string) => void;
  onOpponentArmyChange: (index: number, value: string) => void;
  onAddOpponent: () => void;
  onRemoveOpponent: (index: number) => void;
}

export const OpponentField: React.FC<OpponentFieldProps> = ({
  opponents,
  opponentArmies,
  opponentOptions,
  armyOptions,
  onOpponentChange,
  onOpponentArmyChange,
  onAddOpponent,
  onRemoveOpponent
}) => {
  return (
    <div className="space-y-3 pt-2">
      <Label>Adversaires</Label>
      <div className="space-y-3">
        {opponents.map((o, i) => (
          <Card key={i} className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/30 relative group rounded-2xl">
            {opponents.length > 1 && (
              <button 
                onClick={() => onRemoveOpponent(i)} 
                className="absolute -top-2 -right-2 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-slate-300 hover:text-red-500 transition-colors shadow-sm z-10 opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Autocomplete
                value={o}
                onChange={(val) => onOpponentChange(i, val)}
                options={opponentOptions}
                placeholder="Nom"
                className="p-3 text-sm rounded-xl"
              />
              <Autocomplete
                value={opponentArmies[i] || ''}
                onChange={(val) => onOpponentArmyChange(i, val)}
                options={armyOptions}
                placeholder="Armée"
                className="p-3 text-sm rounded-xl"
              />
            </div>
          </Card>
        ))}
      </div>
      <Button 
        variant="ghost"
        size="sm"
        onClick={onAddOpponent} 
        className="text-primary-600 dark:text-primary-400 lowercase normal-case font-bold"
      >
        <Plus size={16} /> Ajouter un adversaire
      </Button>
    </div>
  );
};
