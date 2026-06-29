import React from 'react';
import { X, ScrollText } from 'lucide-react';
import { Button } from '../ui/Button';
import { Typography } from '../ui/Typography';

interface GameScenarioViewProps {
  scenarios: string[];
  details: Record<string, string>;
  onClose: () => void;
  onChange: (details: Record<string, string>) => void;
}

export const GameScenarioView: React.FC<GameScenarioViewProps> = ({ scenarios, details, onClose, onChange }) => {
  const activeScenarios = scenarios.length > 0 ? scenarios : ['Général'];

  const handleTextChange = (sName: string, value: string) => {
    onChange({
      ...details,
      [sName]: value
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-slate-950 flex flex-col p-4 animate-in fade-in slide-in-from-bottom duration-300">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <ScrollText className="text-primary-500" size={24} />
          <Typography variant="h2" className="text-xl">Détails du Scénario</Typography>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X size={24} />
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-6 pr-2">
        {activeScenarios.map((sName, index) => (
          <div key={index} className="space-y-2">
            <Typography variant="small-caps" className="text-primary-600 dark:text-primary-400 font-bold ml-1">
              {sName || `Scénario ${index + 1}`}
            </Typography>
            <textarea
              className="w-full h-64 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-lg outline-none focus:ring-4 ring-primary-500/10 transition-all dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 resize-none font-medium"
              placeholder={`Décrivez les détails pour ${sName || 'ce scénario'}...`}
              value={details[sName] || ''}
              onChange={(e) => handleTextChange(sName, e.target.value)}
              autoFocus={index === 0}
            />
          </div>
        ))}
      </div>
      
      <div className="mt-4">
        <Button className="w-full py-4 text-sm" onClick={onClose}>
          Retour au jeu
        </Button>
      </div>
    </div>
  );
};
