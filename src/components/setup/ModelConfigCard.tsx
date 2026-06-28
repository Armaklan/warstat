import React from 'react';
import { Trash2, Plus, Save } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input, Label } from '../ui/Input';
import { Card } from '../ui/Card';

interface ModelConfigCardProps {
  turnCategories: string[];
  setTurnCategories: (cats: string[]) => void;
  globalCategories: string[];
  setGlobalCategories: (cats: string[]) => void;
  onSaveModel: () => void;
}

export const ModelConfigCard: React.FC<ModelConfigCardProps> = ({
  turnCategories,
  setTurnCategories,
  globalCategories,
  setGlobalCategories,
  onSaveModel
}) => {
  return (
    <Card className="p-4 bg-slate-50 dark:bg-slate-800/50 space-y-4">
      <div className="space-y-2">
        <Label>Catégories par tour</Label>
        {turnCategories.map((cat, i) => (
          <div key={i} className="flex gap-2">
            <Input
              type="text"
              value={cat}
              onChange={(e) => {
                const newCats = [...turnCategories];
                newCats[i] = e.target.value;
                setTurnCategories(newCats);
              }}
              className="flex-1 p-2 text-xs"
            />
            <Button variant="danger" size="icon" onClick={() => setTurnCategories(turnCategories.filter((_, idx) => idx !== i))}>
              <Trash2 size={16}/>
            </Button>
          </div>
        ))}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setTurnCategories([...turnCategories, ''])}
          className="text-primary-500 lowercase normal-case font-bold"
        >
          <Plus size={14}/> Ajouter une catégorie
        </Button>
      </div>
      <div className="space-y-2">
        <Label>Catégories de fin de partie</Label>
        {globalCategories.map((cat, i) => (
          <div key={i} className="flex gap-2">
            <Input
              type="text"
              value={cat}
              onChange={(e) => {
                const newCats = [...globalCategories];
                newCats[i] = e.target.value;
                setGlobalCategories(newCats);
              }}
              className="flex-1 p-2 text-xs"
            />
            <Button variant="danger" size="icon" onClick={() => setGlobalCategories(globalCategories.filter((_, idx) => idx !== i))}>
              <Trash2 size={16}/>
            </Button>
          </div>
        ))}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setGlobalCategories([...globalCategories, ''])}
          className="text-primary-500 lowercase normal-case font-bold"
        >
          <Plus size={14}/> Ajouter une catégorie de fin de partie
        </Button>
      </div>
      <Button 
        onClick={onSaveModel}
        className="w-full text-xs"
        variant="primary"
      >
        <Save size={16}/> Enregistrer le modèle
      </Button>
    </Card>
  );
};
