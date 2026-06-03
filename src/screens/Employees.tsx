import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useGameStore } from '../store/useGameStore';
import type { Employee } from '../types';

const DEPT_INFO: Record<Employee['department'], { label: string; icon: string; color: string }> = {
  rd: { label: 'R&D', icon: '🔬', color: 'text-purple-400' },
  marketing: { label: 'Marketing', icon: '📣', color: 'text-pink-400' },
  manufacturing: { label: 'Manufacturing', icon: '🏭', color: 'text-amber-400' },
  executive: { label: 'Executive', icon: '👔', color: 'text-cyan-400' },
};

const TRAIT_INFO: Record<Employee['trait'], { label: string; color: string; description: string }> = {
  efficient: { label: 'Efficient', color: 'text-green-400', description: '+10% production speed' },
  expensive: { label: 'Expensive', color: 'text-red-400', description: '+20% salary requirement' },
  unstable: { label: 'Unstable', color: 'text-orange-400', description: '5% chance to pause production' },
  diligent: { label: 'Diligent', color: 'text-blue-400', description: '+15% XP gain rate' },
  resilient: { label: 'Resilient', color: 'text-teal-400', description: '-50% device durability loss' },
  lazy: { label: 'Lazy', color: 'text-gray-400', description: '-10% production speed' },
  veteran: { label: 'Veteran', color: 'text-yellow-400', description: '+5% efficiency per level' },
  trainee: { label: 'Trainee', color: 'text-purple-400', description: '-15% salary, +20% XP gain' },
};

export function Employees() {
  const employees = useGameStore((s) => s.employees);
  const departments = useGameStore((s) => s.departments);
  const factories = useGameStore((s) => s.factories);
  const cash = useGameStore((s) => s.cash);
  const hireEmployee = useGameStore((s) => s.hireEmployee);
  const fireEmployee = useGameStore((s) => s.fireEmployee);
  const setDepartmentBudget = useGameStore((s) => s.setDepartmentBudget);
  const assignEmployeeToLine = useGameStore((s) => s.assignEmployeeToLine);
  const [selectedDept, setSelectedDept] = useState<Employee['department'] | 'all'>('all');

  const filteredEmployees = selectedDept === 'all' ? employees : employees.filter((e) => e.department === selectedDept);
  const totalSalary = employees.reduce((sum, e) => sum + e.salary, 0);
  const hireCost = 2000 + employees.length * 200;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Company Workforce</h2>
          <p className="mt-1 text-sm text-muted">{employees.length}/50 employees · ${totalSalary.toLocaleString()}/month payroll</p>
        </div>
        <Button
          variant="glow"
          onClick={() => hireEmployee(selectedDept === 'all' ? 'rd' : selectedDept)}
          disabled={cash < hireCost || employees.length >= 50}
        >
          + Hire (${hireCost.toLocaleString()})
        </Button>
      </div>

      {/* Department Overview */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {departments.map((dept) => {
          const info = DEPT_INFO[dept.id];
          const deptEmployees = employees.filter((e) => e.department === dept.id);
          const avgSkill = deptEmployees.length > 0
            ? Math.round(deptEmployees.reduce((sum, e) => sum + e.skill, 0) / deptEmployees.length)
            : 0;

          return (
            <Card key={dept.id} className="relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted">{info.icon} {info.label}</p>
                  <p className="mt-1 text-2xl font-bold">{dept.headcount}</p>
                  <p className="text-[10px] text-muted/60">employees</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted">Bonus</p>
                  <p className={`text-lg font-bold ${dept.bonus > 0 ? 'text-success' : 'text-muted'}`}>+{dept.bonus}</p>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted">Avg Skill</span>
                  <span className="text-fg">{avgSkill}</span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-surface-hover">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${avgSkill}%` }} />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[10px] text-muted">Budget:</span>
                <input
                  type="number"
                  value={dept.budget}
                  onChange={(e) => setDepartmentBudget(dept.id, Number(e.target.value))}
                  className="w-16 rounded border border-border bg-surface-raised px-1 py-0.5 font-mono text-[10px] text-fg outline-none focus:border-accent"
                />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Employee Filter */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setSelectedDept('all')}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            selectedDept === 'all' ? 'bg-accent/20 text-accent-soft' : 'text-muted hover:text-fg'
          }`}
        >
          All ({employees.length})
        </button>
        {(Object.keys(DEPT_INFO) as Employee['department'][]).map((dept) => (
          <button
            key={dept}
            type="button"
            onClick={() => setSelectedDept(dept)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              selectedDept === dept ? 'bg-accent/20 text-accent-soft' : 'text-muted hover:text-fg'
            }`}
          >
            {DEPT_INFO[dept].icon} {DEPT_INFO[dept].label} ({employees.filter((e) => e.department === dept).length})
          </button>
        ))}
      </div>

      {/* Employee List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/50 text-[10px] uppercase tracking-wider text-muted">
                <th className="pb-3 pr-4">Name</th>
                <th className="pb-3 pr-4">Department</th>
                <th className="pb-3 pr-4">Trait</th>
                <th className="pb-3 pr-4">Level</th>
                <th className="pb-3 pr-4">Skill</th>
                <th className="pb-3 pr-4">XP</th>
                <th className="pb-3 pr-4">Salary</th>
                <th className="pb-3 pr-4">Morale</th>
                <th className="pb-3 pr-4">Assigned Line</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => {
                const info = DEPT_INFO[emp.department];
                const traitInfo = TRAIT_INFO[emp.trait];
                const assignedLine = factories.find((f) => f.assignedEmployeeId === emp.id);
                return (
                  <tr key={emp.id} className="border-b border-border/30 transition hover:bg-surface-hover/50">
                    <td className="py-3 pr-4 font-medium">{emp.name}</td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs ${info.color}`}>{info.icon} {info.label}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs ${traitInfo.color}`} title={traitInfo.description}>
                        {traitInfo.label}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-accent">{emp.level}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-hover">
                          <div className="h-full rounded-full bg-accent" style={{ width: `${emp.skill}%` }} />
                        </div>
                        <span className="font-mono text-xs">{emp.skill}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-hover">
                          <div className="h-full rounded-full bg-purple-500" style={{ width: `${(emp.xp / emp.xpToNextLevel) * 100}%` }} />
                        </div>
                        <span className="font-mono text-[10px] text-muted">{emp.xp}/{emp.xpToNextLevel}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-warning">${emp.salary.toLocaleString()}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-hover">
                          <div
                            className={`h-full rounded-full ${emp.morale > 70 ? 'bg-success' : emp.morale > 40 ? 'bg-yellow-500' : 'bg-danger'}`}
                            style={{ width: `${emp.morale}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs">{emp.morale}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <select
                        value={assignedLine?.id ?? ''}
                        onChange={(e) => assignEmployeeToLine(emp.id, e.target.value || null)}
                        className="rounded border border-border bg-surface-raised px-2 py-1 text-xs text-fg outline-none focus:border-accent"
                      >
                        <option value="">Unassigned</option>
                        {factories.map((f) => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3">
                      <button
                        type="button"
                        onClick={() => fireEmployee(emp.id)}
                        className="rounded-lg border border-danger/30 px-2 py-1 text-[10px] text-danger transition hover:bg-danger/10"
                      >
                        Fire
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredEmployees.length === 0 && (
            <p className="py-8 text-center text-sm text-muted">No employees in this department.</p>
          )}
        </div>
      </Card>

      {/* Financial Summary */}
      <Card>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Monthly Payroll</h3>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {departments.map((dept) => {
            const deptSalary = employees.filter((e) => e.department === dept.id).reduce((sum, e) => sum + e.salary, 0);
            return (
              <div key={dept.id}>
                <p className="text-[10px] text-muted">{DEPT_INFO[dept.id].icon} {DEPT_INFO[dept.id].label}</p>
                <p className="font-mono text-lg font-bold text-warning">${deptSalary.toLocaleString()}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-4 border-t border-border/50 pt-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted">Total Monthly Payroll</span>
            <span className="font-mono text-lg font-bold text-warning">${totalSalary.toLocaleString()}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
