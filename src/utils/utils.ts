import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { GameSession } from '../types/game';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(ms: number): string {
  if (isNaN(ms) || ms < 0) return '00:00';
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));

  const parts = [
    hours > 0 ? hours.toString().padStart(2, '0') : null,
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0')
  ].filter(Boolean);

  return parts.join(':');
}

export function formatSessionResults(session: GameSession): string {
  const results: string[] = [];
  results.push(`Résultats Warstat - ${session.gameName}`);
  results.push(`Date : ${new Date(session.startTime).toLocaleDateString()}`);
  results.push('');

  session.players.forEach(player => {
    results.push(`${player.name} :`);
    
    const categories: Record<string, number> = {};
    
    // Points des tours
    if (session.turns) {
      session.turns.forEach(turn => {
        const playerScores = turn.scores[player.id] || [];
        playerScores.forEach(score => {
          categories[score.category] = (categories[score.category] || 0) + score.points;
        });
      });
    }
    
    // Points globaux (hors tours)
    const globalScores = (session.globalScores && session.globalScores[player.id]) || [];
    globalScores.forEach(score => {
      categories[score.category] = (categories[score.category] || 0) + score.points;
    });

    let total = 0;
    Object.entries(categories).forEach(([category, points]) => {
      results.push(`  - ${category} : ${points}`);
      total += points;
    });
    
    results.push(`  TOTAL : ${total}`);
    results.push('');
  });

  if (session.result) {
    const resultText = session.result === 'victory' ? 'VICTOIRE' : 
                       session.result === 'defeat' ? 'DÉFAITE' : 'MATCH NUL';
    results.push(`Résultat final : ${resultText}`);
  }

  return results.join('\n');
}

export function calculatePlayerTotal(session: GameSession, playerId: string): number {
  const turnPoints = (session.turns || []).reduce((sum, turn) => {
    const playerScores = turn.scores[playerId] || [];
    return sum + playerScores.reduce((s, e) => s + e.points, 0);
  }, 0);
  const globalPoints = (session.globalScores?.[playerId] || []).reduce((s, e) => s + e.points, 0);
  return turnPoints + globalPoints;
}
