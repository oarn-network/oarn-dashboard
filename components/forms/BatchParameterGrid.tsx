'use client';

import { useState, useCallback } from 'react';
import { Button, Input, Card, Badge } from '@/components/ui';

interface Parameter {
  id: string;
  name: string;
  type: 'range' | 'list' | 'boolean';
  values: string[];
  min?: number;
  max?: number;
  step?: number;
}

interface BatchParameterGridProps {
  onGridGenerated: (combinations: Record<string, unknown>[], totalCount: number) => void;
}

export function BatchParameterGrid({ onGridGenerated }: BatchParameterGridProps) {
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [newParam, setNewParam] = useState({
    name: '',
    type: 'range' as const,
    min: 0,
    max: 1,
    step: 0.1,
    listValues: '',
  });

  const addParameter = () => {
    if (!newParam.name.trim()) return;

    const param: Parameter = {
      id: Math.random().toString(36).slice(2),
      name: newParam.name.trim(),
      type: newParam.type,
      values: [],
    };

    if (newParam.type === 'range') {
      param.min = newParam.min;
      param.max = newParam.max;
      param.step = newParam.step;
      // Generate range values
      const values: string[] = [];
      for (let v = newParam.min; v <= newParam.max; v += newParam.step) {
        values.push(v.toFixed(6).replace(/\.?0+$/, ''));
      }
      param.values = values;
    } else if (newParam.type === 'list') {
      param.values = newParam.listValues
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v.length > 0);
    } else if (newParam.type === 'boolean') {
      param.values = ['true', 'false'];
    }

    setParameters([...parameters, param]);
    setNewParam({
      name: '',
      type: 'range',
      min: 0,
      max: 1,
      step: 0.1,
      listValues: '',
    });
  };

  const removeParameter = (id: string) => {
    setParameters(parameters.filter((p) => p.id !== id));
  };

  const calculateCombinations = useCallback(() => {
    if (parameters.length === 0) return 0;
    return parameters.reduce((total, param) => total * param.values.length, 1);
  }, [parameters]);

  const generateCombinations = useCallback((): Record<string, unknown>[] => {
    if (parameters.length === 0) return [];

    const combinations: Record<string, unknown>[] = [];

    const generate = (index: number, current: Record<string, unknown>) => {
      if (index === parameters.length) {
        combinations.push({ ...current });
        return;
      }

      const param = parameters[index];
      for (const value of param.values) {
        current[param.name] = param.type === 'boolean' ? value === 'true' :
                              param.type === 'range' ? parseFloat(value) : value;
        generate(index + 1, current);
      }
    };

    generate(0, {});
    return combinations;
  }, [parameters]);

  const handleGenerate = () => {
    const combinations = generateCombinations();
    onGridGenerated(combinations, combinations.length);
  };

  const totalCombinations = calculateCombinations();

  // Common parameter presets
  const presets = [
    {
      name: 'Learning Rate Sweep',
      params: [
        { name: 'learning_rate', type: 'list' as const, values: ['0.0001', '0.0005', '0.001', '0.005', '0.01', '0.05', '0.1'] },
      ],
    },
    {
      name: 'Hyperparameter Grid',
      params: [
        { name: 'learning_rate', type: 'list' as const, values: ['0.001', '0.01', '0.1'] },
        { name: 'batch_size', type: 'list' as const, values: ['16', '32', '64', '128'] },
        { name: 'dropout', type: 'list' as const, values: ['0.1', '0.2', '0.3', '0.5'] },
      ],
    },
    {
      name: 'Temperature Sampling',
      params: [
        { name: 'temperature', type: 'range' as const, min: 0.1, max: 2.0, step: 0.1, values: [] },
        { name: 'top_p', type: 'list' as const, values: ['0.9', '0.95', '1.0'] },
      ],
    },
  ];

  const applyPreset = (preset: typeof presets[0]) => {
    const newParams: Parameter[] = preset.params.map((p) => {
      if (p.type === 'range' && 'min' in p && 'max' in p && 'step' in p) {
        const values: string[] = [];
        for (let v = p.min!; v <= p.max!; v += p.step!) {
          values.push(v.toFixed(6).replace(/\.?0+$/, ''));
        }
        return { ...p, id: Math.random().toString(36).slice(2), values };
      }
      return { ...p, id: Math.random().toString(36).slice(2) };
    });
    setParameters(newParams);
  };

  return (
    <div className="space-y-6">
      {/* Presets */}
      <Card>
        <h4 className="text-sm font-medium text-text mb-3">Quick Presets</h4>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <Button
              key={preset.name}
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => applyPreset(preset)}
            >
              {preset.name}
            </Button>
          ))}
        </div>
      </Card>

      {/* Add Parameter */}
      <Card>
        <h4 className="text-sm font-medium text-text mb-4">Add Parameter</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            label="Parameter Name"
            placeholder="e.g., learning_rate"
            value={newParam.name}
            onChange={(e) => setNewParam({ ...newParam, name: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Type</label>
            <select
              className="w-full bg-background-light border border-border rounded-lg px-4 py-2.5 text-text"
              value={newParam.type}
              onChange={(e) =>
                setNewParam({ ...newParam, type: e.target.value as 'range' | 'list' | 'boolean' })
              }
            >
              <option value="range">Numeric Range</option>
              <option value="list">Value List</option>
              <option value="boolean">Boolean</option>
            </select>
          </div>

          {newParam.type === 'range' && (
            <>
              <div className="flex gap-2">
                <Input
                  label="Min"
                  type="number"
                  step="any"
                  value={newParam.min}
                  onChange={(e) => setNewParam({ ...newParam, min: parseFloat(e.target.value) || 0 })}
                />
                <Input
                  label="Max"
                  type="number"
                  step="any"
                  value={newParam.max}
                  onChange={(e) => setNewParam({ ...newParam, max: parseFloat(e.target.value) || 1 })}
                />
              </div>
              <Input
                label="Step"
                type="number"
                step="any"
                value={newParam.step}
                onChange={(e) => setNewParam({ ...newParam, step: parseFloat(e.target.value) || 0.1 })}
              />
            </>
          )}

          {newParam.type === 'list' && (
            <div className="md:col-span-2">
              <Input
                label="Values (comma-separated)"
                placeholder="value1, value2, value3"
                value={newParam.listValues}
                onChange={(e) => setNewParam({ ...newParam, listValues: e.target.value })}
              />
            </div>
          )}
        </div>

        <Button type="button" variant="secondary" className="mt-4" onClick={addParameter}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Parameter
        </Button>
      </Card>

      {/* Parameter List */}
      {parameters.length > 0 && (
        <Card>
          <h4 className="text-sm font-medium text-text mb-4">Parameters ({parameters.length})</h4>
          <div className="space-y-3">
            {parameters.map((param) => (
              <div
                key={param.id}
                className="flex items-center justify-between p-3 bg-background-light rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-text">{param.name}</span>
                    <Badge size="sm" variant="primary">
                      {param.type}
                    </Badge>
                    <Badge size="sm" variant="default">
                      {param.values.length} values
                    </Badge>
                  </div>
                  <p className="text-xs text-text-muted truncate max-w-xl">
                    {param.values.slice(0, 10).join(', ')}
                    {param.values.length > 10 && ` ... +${param.values.length - 10} more`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeParameter(param.id)}
                  className="p-2 text-text-muted hover:text-error transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Summary & Generate */}
      {parameters.length > 0 && (
        <Card className={totalCombinations > 100000 ? 'bg-warning/5 border-warning/20' : 'bg-primary/5 border-primary/20'}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h4 className="text-sm font-medium text-text">Grid Summary</h4>
              <p className="text-3xl font-bold gradient-text mt-1">
                {totalCombinations.toLocaleString()}
              </p>
              <p className="text-sm text-text-muted">total parameter combinations</p>
              {totalCombinations > 100000 && (
                <p className="text-xs text-warning mt-2">
                  Large grid detected. Consider reducing parameters for faster processing.
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Button type="button" onClick={handleGenerate} disabled={totalCombinations === 0}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Generate Grid
              </Button>
              <p className="text-xs text-text-muted text-center">
                {parameters.map((p) => p.values.length).join(' × ')} = {totalCombinations.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
