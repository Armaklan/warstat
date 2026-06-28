import React from 'react';
import { ChevronLeft, Copy } from 'lucide-react';
import { Button } from '../ui/Button';

interface GameDetailsHeaderProps {
  onBack: () => void;
  onCopy: () => void;
  copied: boolean;
}

export const GameDetailsHeader: React.FC<GameDetailsHeaderProps> = ({ onBack, onCopy, copied }) => {
  return (
    <div className="flex justify-between items-center">
      <Button 
        variant="ghost" 
        onClick={onBack} 
        className="gap-2 font-bold"
      >
        <ChevronLeft size={20} /> Retour
      </Button>
      <Button 
        variant="secondary"
        onClick={onCopy}
        className="gap-2"
      >
        <Copy size={14} />
        {copied ? 'Copié !' : 'Copier'}
      </Button>
    </div>
  );
};
