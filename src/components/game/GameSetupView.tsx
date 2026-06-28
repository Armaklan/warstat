import React from 'react';
import { Play } from 'lucide-react';
import { Button } from '../ui/Button';

interface GameSetupViewProps {
  onStartDeployment: () => void;
}

export const GameSetupView: React.FC<GameSetupViewProps> = ({ onStartDeployment }) => {
  return (
    <Button 
      onClick={onStartDeployment} 
      size="lg"
      className="w-full"
    >
      <Play size={24} fill="currentColor" /> Lancer le déploiement
    </Button>
  );
};
