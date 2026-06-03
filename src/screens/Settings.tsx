import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useGameStore } from '../store/useGameStore';

export function Settings() {
  const companyName = useGameStore((s) => s.companyName);
  const cash = useGameStore((s) => s.cash);
  const month = useGameStore((s) => s.month);
  const day = useGameStore((s) => s.day);
  const totalUnitsSold = useGameStore((s) => s.totalUnitsSold);
  const releasedDevices = useGameStore((s) => s.releasedDevices);
  const employees = useGameStore((s) => s.employees);
  const factories = useGameStore((s) => s.factories);
  const unlockedTech = useGameStore((s) => s.unlockedTech);
  const companyValuation = useGameStore((s) => s.companyValuation);
  const marketShare = useGameStore((s) => s.marketShare);
  const reputation = useGameStore((s) => s.reputation);
  const fans = useGameStore((s) => s.fans);
  const resetGame = useGameStore((s) => s.resetGame);

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleExport = () => {
    const state = useGameStore.getState();
    const saveData = JSON.stringify(state, null, 2);
    const blob = new Blob([saveData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devices-tycoon-save-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportConfirm(false);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          useGameStore.setState(data);
          window.location.reload();
        } catch {
          alert('Invalid save file.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted">Manage your game, data, and preferences</p>
      </div>

      {/* Game Info */}
      <Card>
        <h3 className="mb-4 font-semibold text-fg">Game Information</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted">Company</p>
            <p className="font-mono text-lg font-bold text-fg">{companyName}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted">Cash</p>
            <p className="font-mono text-lg font-bold text-success">${cash.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted">Month / Day</p>
            <p className="font-mono text-lg font-bold text-fg">{month} / {day}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted">Valuation</p>
            <p className="font-mono text-lg font-bold text-accent">${companyValuation.toLocaleString()}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted">Total Sold</p>
            <p className="font-mono text-sm font-bold text-fg">{totalUnitsSold.toLocaleString()} units</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted">Devices</p>
            <p className="font-mono text-sm font-bold text-fg">{releasedDevices.length} released</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted">Employees</p>
            <p className="font-mono text-sm font-bold text-fg">{employees.length} / 50</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted">Factory Lines</p>
            <p className="font-mono text-sm font-bold text-fg">{factories.length}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted">Tech Unlocked</p>
            <p className="font-mono text-sm font-bold text-fg">{unlockedTech.length}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted">Market Share</p>
            <p className="font-mono text-sm font-bold text-fg">{marketShare.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted">Reputation</p>
            <p className="font-mono text-sm font-bold text-fg">{reputation}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted">Fans</p>
            <p className="font-mono text-sm font-bold text-fg">{fans.toLocaleString()}</p>
          </div>
        </div>
      </Card>

      {/* Data Management */}
      <Card>
        <h3 className="mb-4 font-semibold text-fg">Data Management</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-border/50 bg-surface-raised/40 p-4">
            <div>
              <p className="font-medium text-fg">Export Save</p>
              <p className="text-sm text-muted">Download your game save as a JSON file</p>
            </div>
            <Button variant="secondary" onClick={handleExport}>
              Export
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border/50 bg-surface-raised/40 p-4">
            <div>
              <p className="font-medium text-fg">Import Save</p>
              <p className="text-sm text-muted">Load a previously exported save file</p>
            </div>
            <Button variant="secondary" onClick={handleImport}>
              Import
            </Button>
          </div>
        </div>
      </Card>

      {/* Game Controls */}
      <Card>
        <h3 className="mb-4 font-semibold text-fg">Game Controls</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-border/50 bg-surface-raised/40 p-4">
            <div>
              <p className="font-medium text-fg">Return to Menu</p>
              <p className="text-sm text-muted">Go back to the main menu (progress is saved)</p>
            </div>
            <Button variant="secondary" onClick={() => useGameStore.getState().setScreen('menu')}>
              Menu
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-danger/20 bg-danger/5 p-4">
            <div>
              <p className="font-medium text-danger">Reset Game</p>
              <p className="text-sm text-muted">Erase all progress and start fresh</p>
            </div>
            <Button variant="ghost" onClick={() => setShowResetConfirm(true)}>
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <Card className="mx-4 w-full max-w-md" glow>
            <div className="text-center">
              <div className="mb-4 text-4xl">⚠️</div>
              <h3 className="mb-2 text-xl font-bold text-danger">Erase All Data?</h3>
              <p className="mb-6 text-sm text-muted">
                This will permanently delete your save data for <span className="font-semibold text-fg">{companyName}</span>. 
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={() => setShowResetConfirm(false)}>
                  Cancel
                </Button>
                <Button variant="danger" className="flex-1" onClick={() => {
                  resetGame();
                  setShowResetConfirm(false);
                }}>
                  Yes, Reset Everything
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
