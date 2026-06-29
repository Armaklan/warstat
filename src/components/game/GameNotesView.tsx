import React from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Typography } from '../ui/Typography';

interface GameNotesViewProps {
  notes: string;
  onClose: () => void;
  onChange: (notes: string) => void;
}

export const GameNotesView: React.FC<GameNotesViewProps> = ({ notes, onClose, onChange }) => {
  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-slate-950 flex flex-col p-4 animate-in fade-in slide-in-from-bottom duration-300">
      <div className="flex justify-between items-center mb-4">
        <Typography variant="h2" className="text-xl">Commentaires</Typography>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X size={24} />
        </Button>
      </div>
      
      <textarea
        className="flex-1 w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-lg outline-none focus:ring-4 ring-primary-500/10 transition-all dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 resize-none font-medium"
        placeholder="Saisissez vos notes de partie ici..."
        value={notes || ''}
        onChange={(e) => onChange(e.target.value)}
        autoFocus
      />
      
      <div className="mt-4">
        <Button className="w-full py-4 text-sm" onClick={onClose}>
          Retour au jeu
        </Button>
      </div>
    </div>
  );
};
