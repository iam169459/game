import { useMemo } from 'react';
import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { useGameStore } from '../store/useGameStore';
import { calcMarketShares } from '../lib/botAI';
import type { Friend } from '../types';

function FriendRow({ friend, onRemove, onGift }: { friend: Friend; onRemove: () => void; onGift: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/40 bg-surface-card/60 p-3 transition hover:border-border-bright">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 to-glow/20 text-sm font-bold text-accent-soft">
          {friend.username.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-fg">{friend.username}</p>
          <div className="flex items-center gap-2 text-[10px] text-muted">
            <span>Rank #{friend.rank}</span>
            <span>·</span>
            <span>{friend.devicesReleased} devices</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onGift}
          className="rounded-lg bg-success/15 px-2.5 py-1.5 text-[10px] font-medium text-success transition hover:bg-success/25"
        >
          Gift $50K
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-lg bg-danger/10 px-2 py-1.5 text-[10px] text-danger/70 transition hover:bg-danger/15 hover:text-danger"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export function SocialTab() {
  const friends = useGameStore((s) => s.friends);
  const cash = useGameStore((s) => s.cash);
  const reputation = useGameStore((s) => s.reputation);
  const companyName = useGameStore((s) => s.companyName);
  const releasedDevices = useGameStore((s) => s.releasedDevices);
  const companyValuation = useGameStore((s) => s.companyValuation);
  const marketShare = useGameStore((s) => s.marketShare);
  const botCompanies = useGameStore((s) => s.botCompanies);
  const fans = useGameStore((s) => s.fans);

  const [friendInput, setFriendInput] = useState('');
  const [notification, setNotification] = useState('');

  const totalRevenue = releasedDevices.reduce((sum, d) => sum + d.totalRevenue, 0);
  const shares = useMemo(
    () => calcMarketShares(botCompanies, totalRevenue, reputation, fans),
    [botCompanies, totalRevenue, reputation, fans],
  );
  const playerShare = shares.find((s) => s.id === 'player')?.share ?? marketShare;

  const addFriend = () => {
    if (!friendInput.trim()) return;
    if (friends.some((f) => f.username.toLowerCase() === friendInput.trim().toLowerCase())) {
      setNotification('Already friends with this player!');
      setTimeout(() => setNotification(''), 2000);
      return;
    }
    const newFriend: Friend = {
      id: `friend-${Date.now()}`,
      username: friendInput.trim(),
      rank: Math.floor(Math.random() * 5) + 1,
      cash: Math.floor(Math.random() * 500000),
      devicesReleased: Math.floor(Math.random() * 8),
      addedMonth: useGameStore.getState().month,
    };
    useGameStore.setState((s) => ({
      friends: [...s.friends, newFriend],
    }));
    setFriendInput('');
    setNotification(`Added ${newFriend.username} as a friend!`);
    setTimeout(() => setNotification(''), 2000);
  };

  const removeFriend = (id: string) => {
    const friend = friends.find((f) => f.id === id);
    useGameStore.setState((s) => ({
      friends: s.friends.filter((f) => f.id !== id),
    }));
    setNotification(`Removed ${friend?.username} from friends.`);
    setTimeout(() => setNotification(''), 2000);
  };

  const sendGift = (id: string) => {
    if (cash < 50000) {
      setNotification('Not enough cash to send gift!');
      setTimeout(() => setNotification(''), 2000);
      return;
    }
    const friend = friends.find((f) => f.id === id);
    useGameStore.setState((s) => ({
      cash: s.cash - 50000,
      friends: s.friends.map((f) => f.id === id ? { ...f, cash: f.cash + 50000 } : f),
      reputation: Math.min(100, s.reputation + 2),
    }));
    setNotification(`Sent $50K gift to ${friend?.username}! +2 Reputation`);
    setTimeout(() => setNotification(''), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Notification */}
      {notification && (
        <div className="rounded-lg bg-accent/15 px-3 py-2 text-center text-xs text-accent-soft">
          {notification}
        </div>
      )}

      {/* Your Profile Card */}
      <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-glow text-lg font-bold text-white shadow-lg shadow-accent/20">
            {companyName.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-bold text-fg">{companyName}</p>
            <p className="text-[10px] text-muted">Your Company Profile</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-surface-card/60 p-2 text-center">
            <p className="text-[8px] uppercase text-muted">Devices</p>
            <p className="font-mono text-sm font-bold text-fg">{releasedDevices.length}</p>
          </div>
          <div className="rounded-lg bg-surface-card/60 p-2 text-center">
            <p className="text-[8px] uppercase text-muted">Valuation</p>
            <p className="font-mono text-sm font-bold text-success">${companyValuation >= 1000000 ? `${(companyValuation / 1000000).toFixed(1)}M` : `${(companyValuation / 1000).toFixed(0)}K`}</p>
          </div>
          <div className="rounded-lg bg-surface-card/60 p-2 text-center">
            <p className="text-[8px] uppercase text-muted">Market</p>
            <p className="font-mono text-sm font-bold text-accent-soft">{marketShare.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Market Share Chart */}
      <div className="rounded-xl border border-border/40 bg-surface-card/60 p-4">
        <p className="text-[10px] uppercase tracking-wider text-muted mb-3">Market Share</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-fg w-20 truncate">{companyName}</span>
            <div className="flex-1 h-4 overflow-hidden rounded-full bg-surface-hover">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-glow"
                style={{ width: `${playerShare}%` }}
              />
            </div>
            <span className="font-mono text-[10px] text-accent-soft w-12 text-right">{playerShare.toFixed(1)}%</span>
          </div>
          {shares.filter((s) => s.id !== 'player').slice(0, 4).map((entry) => (
            <div key={entry.id} className="flex items-center gap-2">
              <span className="text-[10px] text-muted w-20 truncate">{entry.name}</span>
              <div className="flex-1 h-4 overflow-hidden rounded-full bg-surface-hover">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${entry.share}%`, backgroundColor: entry.color }}
                />
              </div>
              <span className="font-mono text-[10px] text-muted w-12 text-right">{entry.share.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Add Friend Input */}
      <div className="rounded-xl border border-border/40 bg-surface-card/60 p-3">
        <label className="text-[10px] uppercase tracking-wider text-muted">Add Friend by ID Code</label>
        <div className="mt-2 flex gap-2">
          <input
            value={friendInput}
            onChange={(e) => setFriendInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addFriend()}
            className="flex-1 rounded-lg border border-border bg-surface-hover px-3 py-2 text-sm text-fg outline-none placeholder:text-muted/50 focus:border-accent"
            placeholder="Enter friend username..."
          />
          <Button variant="glow" onClick={addFriend} disabled={!friendInput.trim()}>
            Add
          </Button>
        </div>
      </div>

      {/* Friends List */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] uppercase tracking-wider text-muted">Friends ({friends.length})</p>
        </div>
        {friends.length > 0 ? (
          <div className="space-y-2">
            {friends.map((friend) => (
              <FriendRow
                key={friend.id}
                friend={friend}
                onRemove={() => removeFriend(friend.id)}
                onGift={() => sendGift(friend.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 text-4xl opacity-40">🌐</div>
            <p className="text-sm font-medium text-fg">No friends yet</p>
            <p className="mt-1 text-xs text-muted">Add friends using their username above</p>
          </div>
        )}
      </div>

      {/* Leaderboard Preview */}
      <div className="border-t border-border/40 pt-4">
        <p className="mb-2 text-[10px] uppercase tracking-wider text-muted">Top Companies</p>
        <div className="space-y-1.5">
          {[
            { name: companyName, devices: releasedDevices.length, valuation: companyValuation, isYou: true },
            ...friends.map((f) => ({ name: f.username, devices: f.devicesReleased, valuation: f.cash, isYou: false }))
          ]
            .sort((a, b) => b.valuation - a.valuation)
            .slice(0, 5)
            .map((company, i) => (
              <div
                key={company.name + i}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs ${
                  company.isYou ? 'bg-accent/10 ring-1 ring-accent/20' : 'bg-surface-card/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-5 text-center font-mono font-bold ${i === 0 ? 'text-warning' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-muted'}`}>
                    #{i + 1}
                  </span>
                  <span className={`font-medium ${company.isYou ? 'text-accent-soft' : 'text-fg'}`}>
                    {company.name} {company.isYou && '(You)'}
                  </span>
                </div>
                <span className="font-mono text-muted">${company.valuation >= 1000000 ? `${(company.valuation / 1000000).toFixed(1)}M` : `${(company.valuation / 1000).toFixed(0)}K`}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
