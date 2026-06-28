import React from 'react';
import { db } from '../db/database';
import { Trash2, Download, Upload, AlertTriangle } from 'lucide-react';

export const Settings: React.FC = () => {
  const handleExport = async () => {
    try {
      const sessions = await db.sessions.toArray();
      const gameModels = await db.gameModels.toArray();
      const data = {
        sessions,
        gameModels,
        exportDate: new Date().toISOString(),
        version: 1
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `warstat-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Erreur lors de l\'exportation des données.');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        if (!data.sessions || !Array.isArray(data.sessions)) {
          throw new Error('Format de fichier invalide');
        }

        if (confirm('L\'importation va fusionner les données avec vos données actuelles. Continuer ?')) {
          await db.transaction('rw', db.sessions, db.gameModels, async () => {
            // Import sessions
            for (const session of data.sessions) {
              const { id, ...sessionData } = session;
              await db.sessions.add(sessionData);
            }
            // Import game models if they exist in export
            if (data.gameModels && Array.isArray(data.gameModels)) {
              for (const model of data.gameModels) {
                const { id, ...modelData } = model;
                // Check if game already exists by name
                const existing = await db.gameModels.where('gameName').equals(modelData.gameName).first();
                if (!existing) {
                  await db.gameModels.add(modelData);
                }
              }
            }
          });
          alert('Données importées avec succès !');
          window.location.reload(); // Refresh to show new data
        }
      } catch (error) {
        console.error('Import failed:', error);
        alert('Erreur lors de l\'importation : ' + (error instanceof Error ? error.message : 'Format invalide'));
      }
    };
    reader.readAsText(file);
  };

  const handleClearAll = async () => {
    if (confirm('ÊTES-VOUS SÛR ? Cela supprimera DÉFINITIVEMENT toutes vos sessions et vos modèles de jeux.')) {
      if (confirm('Dernière confirmation : voulez-vous vraiment tout effacer ?')) {
        try {
          await db.sessions.clear();
          await db.gameModels.clear();
          alert('Toutes les données ont été supprimées.');
          window.location.reload();
        } catch (error) {
          console.error('Clear failed:', error);
          alert('Erreur lors de la suppression des données.');
        }
      }
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-6">Paramètres</h2>
      
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-primary-600 dark:text-primary-400">
            <Download size={24} />
            <h3 className="text-lg font-bold">Sauvegarde</h3>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
            Exportez toutes vos données dans un fichier JSON pour les sauvegarder ou les transférer vers un autre appareil.
          </p>
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors"
          >
            Exporter les données
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-primary-600 dark:text-primary-400">
            <Upload size={24} />
            <h3 className="text-lg font-bold">Restauration</h3>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
            Importez des données depuis un fichier JSON précédemment exporté.
          </p>
          <label className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold rounded-xl transition-colors cursor-pointer">
            <Upload size={20} />
            Importer un fichier
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-red-200 dark:border-red-900/30 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-red-600 dark:text-red-400">
            <AlertTriangle size={24} />
            <h3 className="text-lg font-bold">Zone de danger</h3>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
            Cette action supprimera irréversiblement toutes les données enregistrées dans l'application.
          </p>
          <button
            onClick={handleClearAll}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40 font-bold rounded-xl transition-colors"
          >
            <Trash2 size={20} />
            Supprimer toutes les données
          </button>
        </div>
      </div>
    </div>
  );
};
