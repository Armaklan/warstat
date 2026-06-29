import React, { useState, useEffect } from 'react';
import { db } from '../db/database';
import { Trash2, Download, Upload, AlertTriangle, FileCheck, ShieldAlert } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Typography } from './ui/Typography';
import { exportToJSON, saveToFileHandle } from '../utils/export';
import { useLiveQuery } from 'dexie-react-hooks';

export const Settings: React.FC = () => {
  const settings = useLiveQuery(() => db.settings.get('main'));
  const [isFileSystemApiSupported] = useState(() => 'showSaveFilePicker' in window);

  const handleExport = async () => {
    try {
      await exportToJSON();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Erreur lors de l\'exportation des données.');
    }
  };

  const handleSetupAutoSave = async () => {
    try {
      // @ts-ignore
      const handle = await window.showSaveFilePicker({
        suggestedName: `warstat-autosave.json`,
        types: [{
          description: 'JSON Files',
          accept: { 'application/json': ['.json'] },
        }],
      });

      await db.settings.put({ id: 'main', autoSaveFileHandle: handle });
      
      // Test immédiat de sauvegarde pour valider les permissions
      await saveToFileHandle(handle);
      alert('Sauvegarde automatique configurée avec succès !');
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Auto-save setup failed:', error);
        alert('Erreur lors de la configuration de la sauvegarde automatique.');
      }
    }
  };

  const handleDisableAutoSave = async () => {
    await db.settings.update('main', { autoSaveFileHandle: null });
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
          await db.transaction('rw', db.sessions, db.gameModels, db.scenarios, async () => {
            // Import sessions
            for (const session of data.sessions) {
              const { id, ...sessionData } = session;
              if (!sessionData.createdAt) {
                sessionData.createdAt = sessionData.startTime || new Date();
              }
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
            // Import scenarios if they exist
            if (data.scenarios && Array.isArray(data.scenarios)) {
              for (const scenario of data.scenarios) {
                const { id, ...scenarioData } = scenario;
                const existing = await db.scenarios.where({ gameName: scenarioData.gameName, name: scenarioData.name }).first();
                if (!existing) {
                  await db.scenarios.add(scenarioData);
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
          await db.scenarios.clear();
          await db.settings.clear();
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
      <Typography variant="h3" className="mb-6">Paramètres</Typography>
      
      <div className="space-y-4">
        {isFileSystemApiSupported && (
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4 text-primary-600 dark:text-primary-400">
              <FileCheck size={24} />
              <h3 className="text-lg font-bold">Sauvegarde automatique</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
              Sélectionnez un fichier local qui sera mis à jour à chaque fermeture de l'application.
            </p>
            {settings?.autoSaveFileHandle ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl border border-green-100 dark:border-green-900/30">
                  <FileCheck size={18} />
                  <span className="text-sm font-bold truncate flex-1">
                    {settings.autoSaveFileHandle.name}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSetupAutoSave} variant="secondary" className="flex-1 py-2 text-xs">
                    Changer le fichier
                  </Button>
                  <Button onClick={handleDisableAutoSave} variant="danger" className="py-2 px-3" size="sm">
                    Désactiver
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={handleSetupAutoSave}
                className="w-full py-3"
                variant="secondary"
                size="lg"
              >
                Configurer le fichier de sauvegarde
              </Button>
            )}
            <div className="mt-4 flex items-start gap-2 text-[10px] text-slate-500 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg">
              <ShieldAlert size={14} className="flex-shrink-0 mt-0.5" />
              <p>Note: Le navigateur pourra demander une autorisation d'écriture lors de la première sauvegarde de chaque session.</p>
            </div>
          </Card>
        )}

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4 text-primary-600 dark:text-primary-400">
            <Download size={24} />
            <h3 className="text-lg font-bold">Sauvegarde</h3>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
            Exportez toutes vos données dans un fichier JSON pour les sauvegarder ou les transférer vers un autre appareil.
          </p>
          <Button
            onClick={handleExport}
            className="w-full py-3"
            size="lg"
          >
            Exporter les données
          </Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4 text-primary-600 dark:text-primary-400">
            <Upload size={24} />
            <h3 className="text-lg font-bold">Restauration</h3>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
            Importez des données depuis un fichier JSON précédemment exporté.
          </p>
          <label className="cursor-pointer">
            <Button
              as="div"
              variant="secondary"
              className="w-full py-3"
              size="lg"
            >
              <Upload size={20} />
              Importer un fichier
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </Button>
          </label>
        </Card>

        <Card className="p-6 border-red-200 dark:border-red-900/30">
          <div className="flex items-center gap-3 mb-4 text-red-600 dark:text-red-400">
            <AlertTriangle size={24} />
            <h3 className="text-lg font-bold">Zone de danger</h3>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
            Cette action supprimera irréversiblement toutes les données enregistrées dans l'application.
          </p>
          <Button
            onClick={handleClearAll}
            variant="danger"
            className="w-full py-3 font-bold"
            size="lg"
          >
            <Trash2 size={20} />
            Supprimer toutes les données
          </Button>
        </Card>
      </div>
    </div>
  );
};
