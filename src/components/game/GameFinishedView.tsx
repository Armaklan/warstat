import React from 'react';
import type { GameSession } from '../../types/game';
import { cn, calculatePlayerTotal } from '../../utils/utils';
import { Copy } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';

interface GameFinishedViewProps {
  session: GameSession;
  copied: boolean;
  onCopyResult: () => void;
}

export const GameFinishedView: React.FC<GameFinishedViewProps> = ({ session, copied, onCopyResult }) => {
  const myScore = calculatePlayerTotal(session, 'me');
  const maxOpponentScore = Math.max(...session.players.filter(p => !p.isMe).map(p => calculatePlayerTotal(session, p.id)));

  return (
    <div className="text-center space-y-8 py-10 px-2 animate-in fade-in zoom-in duration-500">
      <Card 
        className={cn(
          "p-12 shadow-2xl relative overflow-hidden",
          session.result === 'victory' ? "bg-green-600 text-white border-none" :
          session.result === 'defeat' ? "bg-red-600 text-white border-none" : "bg-slate-700 text-white border-none"
        )}
      >
        <div className="absolute top-0 left-0 w-full h-full bg-white/10 opacity-20 -rotate-12 translate-y-20 translate-x-20 rounded-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <Typography variant="small-caps" className="mb-4 opacity-70 tracking-[0.3em] block">Résultat de la Partie</Typography>
          <h2 className="text-6xl font-black mb-4 tracking-tighter italic">
            {session.result === 'victory' ? 'VICTOIRE' :
             session.result === 'defeat' ? 'DÉFAITE' : 'MATCH NUL'}
          </h2>
          <div className="h-px bg-white/20 w-24 mx-auto mb-6"></div>
          <p className="text-4xl font-mono font-black flex items-center justify-center gap-4">
            <span>{myScore}</span>
            <span className="text-lg opacity-40">vs</span>
            <span>{maxOpponentScore}</span>
          </p>
          <Button 
            onClick={onCopyResult}
            className="mt-6 mx-auto bg-white/20 hover:bg-white/30 border-none text-[10px] py-2 px-4"
          >
            <Copy size={12} />
            {copied ? 'Copié !' : 'Copier le résultat'}
          </Button>
        </div>
      </Card>
      <Button 
        onClick={() => window.location.reload()} 
        variant="outline"
        size="lg"
        className="w-full py-5 text-slate-900 dark:text-white border-slate-800 dark:border-slate-700 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 shadow-xl"
      >
        Retour à l'accueil
      </Button>
    </div>
  );
};
