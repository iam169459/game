import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { useGameStore } from '../store/useGameStore';
import type { Employee } from '../types';

const DEPT_INFO: Record<Employee['department'], { label: string; icon: string; color: string }> = {
  rd: { label: 'R&D', icon: '🔬', color: 'text-purple-400' },
  marketing: { label: 'Marketing', icon: '📣', color: 'text-pink-400' },
  manufacturing: { label: 'Manufacturing', icon: '🏭', color: 'text-amber-400' },
  executive: { label: 'Executive', icon: '👔', color: 'text-cyan-400' },
};

const TRAIT_INFO: Record<Employee['trait'], { label: string; color: string; desc: string }> = {
  efficient: { label: 'Efficient', color: 'text-green-400', desc: '+10% speed' },
  expensive: { label: 'Expensive', color: 'text-red-400', desc: '+20% salary' },
  unstable: { label: 'Unstable', color: 'text-orange-400', desc: '5% pause' },
  diligent: { label: 'Diligent', color: 'text-blue-400', desc: '+15% XP' },
  resilient: { label: 'Resilient', color: 'text-teal-400', desc: '-50% wear' },
  lazy: { label: 'Lazy', color: 'text-gray-400', desc: '-10% speed' },
  veteran: { label: 'Veteran', color: 'text-yellow-400', desc: '+5%/lvl' },
  trainee: { label: 'Trainee', color: 'text-purple-400', desc: '-15% pay' },
};

function EmployeeRow({ emp }: { emp: Employee }) {
  const trait = TRAIT_INFO[emp.trait];
  const dept = DEPT_INFO[emp.department];
  const xpPercent = (emp.xp / emp.xpToNextLevel) * 100;

  return (
    <div className="rounded-xl border border-border/40 bg-surface-card/60 p-3 transition hover:border-border-bright">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-hover text-lg">
            {dept.icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold text-fg">{emp.name}</p>
              <span className={`rounded px-1 py-0.5 text-[8px] font-medium ${trait.color} bg-surface-hover`}>
                {trait.label}
              </span>
            </div>
            <p className="text-[10px] text-muted">{dept.label} · Lvl {emp.level}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="font-mono text-xs font-bold text-warning">${emp.salary.toLocaleString()}</p>
          <p className="text-[9px] text-muted">/month</p>
        </div>
      </div>

      {/* Skill & XP Bars */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <div className="flex justify-between text-[9px] text-muted mb-0.5">
            <span>Skill</span>
            <span className="font-mono">{emp.skill}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-hover">
            <div className="h-full rounded-full bg-accent" style={{ width: `${emp.skill}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[9px] text-muted mb-0.5">
            <span>XP</span>
            <span className="font-mono">{emp.xp}/{emp.xpToNextLevel}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-hover">
            <div className="h-full rounded-full bg-purple-500" style={{ width: `${xpPercent}%` }} />
          </div>
        </div>
      </div>

      {/* Morale */}
      <div className="mt-2">
        <div className="flex justify-between text-[9px] text-muted mb-0.5">
          <span>Morale</span>
          <span className="font-mono">{emp.morale}%</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-surface-hover">
          <div
            className={`h-full rounded-full ${emp.morale > 70 ? 'bg-success' : emp.morale > 40 ? 'bg-warning' : 'bg-danger'}`}
            style={{ width: `${emp.morale}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function EmployeesTab() {
  const employees = useGameStore((s) => s.employees);
  const cash = useGameStore((s) => s.cash);
  const hireEmployee = useGameStore((s) => s.hireEmployee);
  const fireEmployee = useGameStore((s) => s.fireEmployee);
  const departments = useGameStore((s) => s.departments);

  const [filter, setFilter] = useState<Employee['department'] | 'all'>('all');
  const hireCost = 2000 + employees.length * 200;
  const totalSalary = employees.reduce((sum, e) => sum + e.salary, 0);

  const filtered = filter === 'all' ? employees : employees.filter((e) => e.department === filter);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-border/40 bg-surface-card/60 p-3 text-center">
          <p className="text-[9px] uppercase text-muted">Team Size</p>
          <p className="font-mono text-xl font-bold text-fg">{employees.length}<span className="text-xs text-muted">/50</span></p>
        </div>
        <div className="rounded-xl border border-border/40 bg-surface-card/60 p-3 text-center">
          <p className="text-[9px] uppercase text-muted">Monthly Payroll</p>
          <p className="font-mono text-xl font-bold text-warning">${totalSalary >= 1000 ? `${(totalSalary / 1000).toFixed(1)}K` : totalSalary}</p>
        </div>
        <div className="rounded-xl border border-border/40 bg-surface-card/60 p-3 text-center">
          <p className="text-[9px] uppercase text-muted">Avg Skill</p>
          <p className="font-mono text-xl font-bold text-accent-soft">
            {employees.length > 0 ? Math.round(employees.reduce((s, e) => s + e.skill, 0) / employees.length) : 0}
          </p>
        </div>
      </div>

      {/* Hire Button */}
      <Button
        variant="glow"
        className="w-full"
        disabled={cash < hireCost || employees.length >= 50}
        onClick={() => hireEmployee(filter === 'all' ? 'rd' : filter)}
      >
        + Hire Employee (${hireCost.toLocaleString()})
      </Button>

      {/* Department Filter */}
      <div className="flex gap-1.5 overflow-x-auto">
        {(['all', 'rd', 'marketing', 'manufacturing', 'executive'] as const).map((dept) => {
          const info = dept === 'all' ? null : DEPT_INFO[dept];
          const count = dept === 'all' ? employees.length : employees.filter((e) => e.department === dept).length;
          return (
            <button
              key={dept}
              type="button"
              onClick={() => setFilter(dept)}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition ${
                filter === dept
                  ? 'bg-accent/20 text-accent-soft ring-1 ring-accent/30'
                  : 'bg-surface-card/60 text-muted hover:text-fg'
              }`}
            >
              {info ? `${info.icon} ${info.label}` : 'All'} ({count})
            </button>
          );
        })}
      </div>

      {/* Employee List */}
      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((emp) => (
            <div key={emp.id}>
              <EmployeeRow emp={emp} />
              <div className="mt-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => fireEmployee(emp.id)}
                  className="rounded-md px-2 py-1 text-[10px] text-danger/70 transition hover:bg-danger/10 hover:text-danger"
                >
                  Fire
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 text-5xl opacity-40">👥</div>
          <p className="text-sm font-medium text-fg">No employees in this department</p>
          <p className="mt-1 text-xs text-muted">Hire your first team member above</p>
        </div>
      )}

      {/* Department Stats */}
      <div className="border-t border-border/40 pt-4">
        <p className="mb-2 text-[10px] uppercase tracking-wider text-muted">Department Overview</p>
        <div className="space-y-2">
          {departments.map((dept) => {
            const info = DEPT_INFO[dept.id];
            const deptEmps = employees.filter((e) => e.department === dept.id);
            const deptSalary = deptEmps.reduce((s, e) => s + e.salary, 0);
            return (
              <div key={dept.id} className="flex items-center justify-between rounded-lg border border-border/30 bg-surface-card/40 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span>{info.icon}</span>
                  <span className="text-xs font-medium text-fg">{info.label}</span>
                </div>
                <div className="flex items-center gap-4 text-[10px] text-muted">
                  <span>{deptEmps.length} staff</span>
                  <span className="font-mono">${deptSalary.toLocaleString()}/mo</span>
                  <span className="text-accent-soft">+{dept.bonus} bonus</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
