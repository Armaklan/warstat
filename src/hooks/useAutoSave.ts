import { useEffect } from 'react';
import { db } from '../db/database';
import { saveToFileHandle } from '../utils/export';

export const useAutoSave = () => {
  useEffect(() => {
    const handleAutoSave = async () => {
      // visibilityState === 'hidden' est déclenché quand on ferme l'onglet, change d'application, etc.
      if (document.visibilityState === 'hidden') {
        try {
          const settings = await db.settings.get('main');
          if (settings?.autoSaveFileHandle) {
            await saveToFileHandle(settings.autoSaveFileHandle);
          }
        } catch (error) {
          console.error('Auto-save error during visibility change:', error);
        }
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
