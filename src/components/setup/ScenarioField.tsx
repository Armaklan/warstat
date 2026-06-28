import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Label } from '../ui/Input';
import { Autocomplete } from '../Autocomplete';

interface ScenarioFieldProps {
  scenarios: string[];
  scenarioOptions: string[];
  onScenarioChange: (index: number, value: string) => void;
  onAddScenario: () => void;
  onRemoveScenario: (index: number) => void;
}

export const ScenarioField: React.FC<ScenarioFieldProps> = ({
  scenarios,
  scenarioOptions,
  onScenarioChange,
  onAddScenario,
  onRemoveScenario
}) => {
  return (
    <div className="space-y-3">
      <Label>Scénarios</Label>
      <div className="space-y-2">
        {scenarios.map((s, i) => (
          <div key={i} className="flex gap-2 group">
            <Autocomplete
              value={s}
              onChange={(val) => onScenarioChange(i, val)}
              options={scenarioOptions}
              placeholder={`Scénario ${i + 1}`}
              className="p-3 text-sm rounded-xl"
            />
            {scenarios.length > 1 && (
              <Button variant="ghost" size="icon" onClick={() => onRemoveScenario(i)} className="text-slate-300 hover:text-red-500">
                <Trash2 size={20} />
              </Button>
            )}
          </div>
        ))}
      </div>
      <Button 
        variant="ghost"
        size="sm"
        onClick={onAddScenario} 
        className="text-primary-600 dark:text-primary-400 lowercase normal-case font-bold"
      >
        <Plus size={16} /> Ajouter un scénario
      </Button>
    </div>
  );
};
