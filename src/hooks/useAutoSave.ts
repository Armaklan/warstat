import { useEffect } from 'react';
import { triggerAutoSave } from '../utils/export';

export const useAutoSave = () => {
  useEffect(() => {
    const handleAutoSave = async () => {
      // visibilityState === 'hidden' est déclenché quand on ferme l'onglet, change d'application, etc.
      if (document.visibilityState === 'hidden') {
        await triggerAutoSave();
      }
    };

    document.addEventListener('visibilitychange', handleAutoSave);
    
    // pagehide est aussi utile pour la fermeture
    window.addEventListener('pagehide', handleAutoSave);

    return () => {
      document.removeEventListener('visibilitychange', handleAutoSave);
      window.removeEventListener('pagehide', handleAutoSave);
    };
  }, []);
};
