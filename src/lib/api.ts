const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE = isLocal ? 'http://localhost:3001/api' : '/api';

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export const api = {
  /** Register a new player profile on the server */
  async registerPlayer(username: string): Promise<{ success: boolean; message: string; uuid?: string }> {
    try {
      const res = await fetch(`${API_BASE}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const data: ApiResponse = await res.json();
      return {
        success: data.success,
        message: data.message,
        uuid: data.success && data.data ? (data.data as any).uuid : undefined,
      };
    } catch (err) {
      console.error('[API] registerPlayer error:', err);
      return { success: false, message: 'Could not connect to server.' };
    }
  },

  /** Fetch a player profile from the server */
  async fetchPlayerProfile(uuid: string): Promise<any | null> {
    try {
      const res = await fetch(`${API_BASE}/players/${uuid}`);
      const data: ApiResponse = await res.json();
      return data.success ? data.data : null;
    } catch (err) {
      console.error('[API] fetchPlayerProfile error:', err);
      return null;
    }
  },

  /** List all players (used to populate the leaderboard with real players) */
  async fetchLeaderboard(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/players`);
      const data: ApiResponse = await res.json();
      return data.success && Array.isArray(data.data) ? data.data : [];
    } catch (err) {
      console.error('[API] fetchLeaderboard error:', err);
      return [];
    }
  },

  /** Upload and sync the client game save to the cloud */
  async saveGame(uuid: string, saveState: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/players/${uuid}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saveState }),
      });
      const data: ApiResponse = await res.json();
      return data.success;
    } catch (err) {
      console.error('[API] saveGame error:', err);
      return false;
    }
  },

  /** Fetch the client game save from the cloud */
  async loadGame(uuid: string): Promise<any | null> {
    try {
      const res = await fetch(`${API_BASE}/players/${uuid}/save`);
      const data: ApiResponse = await res.json();
      return data.success ? data.data : null;
    } catch (err) {
      console.error('[API] loadGame error:', err);
      return null;
    }
  },

  /** Add a friend */
  async addFriend(playerUuid: string, targetUsername: string): Promise<ApiResponse> {
    try {
      const res = await fetch(`${API_BASE}/social/add-friend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerUuid, targetUsername }),
      });
      return await res.json();
    } catch (err) {
      console.error('[API] addFriend error:', err);
      return { success: false, message: 'Could not connect to server.' };
    }
  },

  /** Remove a friend */
  async removeFriend(playerUuid: string, targetUuid: string): Promise<ApiResponse> {
    try {
      const res = await fetch(`${API_BASE}/social/remove-friend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerUuid, targetUuid }),
      });
      return await res.json();
    } catch (err) {
      console.error('[API] removeFriend error:', err);
      return { success: false, message: 'Could not connect to server.' };
    }
  },

  /** Send a gift of money to another player */
  async donateMoney(senderUuid: string, recipientUuid: string, amount: number): Promise<ApiResponse> {
    try {
      const res = await fetch(`${API_BASE}/social/donate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderUuid, recipientUuid, amount }),
      });
      return await res.json();
    } catch (err) {
      console.error('[API] donateMoney error:', err);
      return { success: false, message: 'Could not connect to server.' };
    }
  },
};
