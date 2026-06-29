import { db } from '../db/database';

export const getExportData = async () => {
  const sessions = await db.sessions.toArray();
  const gameModels = await db.gameModels.toArray();
  const scenarios = await db.scenarios.toArray();
  
  return {
    sessions,
    gameModels,
    scenarios,
    exportDate: new Date().toISOString(),
    version: 2
  };
};

export const exportToJSON = async () => {
  const data = await getExportData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `warstat-export-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const saveToFileHandle = async (handle: any) => {
  try {
    // Vérifier si nous avons la permission d'écrire
    const options = { mode: 'readwrite' };
    // @ts-ignore
    if ((await handle.queryPermission(options)) !== 'granted') {
      // @ts-ignore
      if ((await handle.requestPermission(options)) !== 'granted') {
        throw new Error('Permission refusée pour écrire dans le fichier');
      }
    }

    const data = await getExportData();
    // @ts-ignore
    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
    console.log('Sauvegarde automatique réussie');
  } catch (error) {
    console.error('Échec de la sauvegarde automatique:', error);
  }
};

export const triggerAutoSave = async () => {
  try {
    const settings = await db.settings.get('main');
    if (settings?.autoSaveFileHandle) {
      await saveToFileHandle(settings.autoSaveFileHandle);
    }
  } catch (error) {
    console.error('Auto-save error:', error);
  }
};
