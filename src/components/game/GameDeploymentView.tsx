import React from 'react';
import { Play } from 'lucide-react';
import { Button } from '../ui/Button';
import { Typography } from '../ui/Typography';
import { formatDuration } from '../../utils/utils';

interface GameDeploymentViewProps {
  deploymentElapsed: number;
  onStartTurns: () => void;
}

export const GameDeploymentView: React.FC<GameDeploymentViewProps> = ({ deploymentElapsed, onStartTurns }) => {
  return (
    <div className="space-y-6 text-center py-6">
      <div className="p-10 border-2 border-dashed border-primary-300 dark:border-primary-900/50 rounded-3xl bg-primary-50 dark:bg-primary-950/20">
        <Typography variant="small-caps" className="text-primary-600 dark:text-primary-400 tracking-[0.2em] mb-4 block">Temps de déploiement</Typography>
        <p className="text-6xl font-mono font-black text-slate-800 dark:text-white">{formatDuration(deploymentElapsed)}</p>
      </div>
      <Button 
        onClick={onStartTurns} 
        size="lg"
        className="w-full bg-green-600 hover:bg-green-700 shadow-green-500/20"
      >
        <Play size={24} fill="currentColor" /> Lancer les tours
      </Button>
    </div>
  );
};
