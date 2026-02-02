import { useState, useEffect } from 'react';
import { User, Party, Vote, ElectionSettings } from '../types';

interface ElectionDB {
  admin: User;
  users: User[];
  parties: Party[];
  votes: Vote[];
  electionSettings: ElectionSettings;
}

const DEFAULT_DB: ElectionDB = {
  admin: { username: '', password: '', voterId: '', role: 'admin' },
  users: [],
  parties: [],
  votes: [],
  electionSettings: {
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
    isActive: true,
    registrationOpen: true,
    minVotingAge: 18,
    boothLocations: ['Chennai', 'Madurai', 'Coimbatore', 'Trichy']
  }
};

export function useElection() {
  const [db, setDb] = useState<ElectionDB | null>(null);

  /* 
   * Supabase Migration: Sync & Actions 
   */
  const refreshDb = () => {
    fetch('http://localhost:8000/api/get-db')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          // Ensure all arrays exist even if DB returns nulls
          const cleanData = {
            ...data,
            users: data.users || [],
            parties: data.parties || [],
            votes: data.votes || [],
            electionSettings: data.electionSettings || DEFAULT_DB.electionSettings
          };
          setDb(cleanData);
        }
        else {
          console.error("API Error or Empty Data:", data);
          setDb(DEFAULT_DB);
        }
      })
      .catch((err) => {
        console.error("Fetch Error:", err);
        setDb(DEFAULT_DB);
      });
  };

  useEffect(() => {
    refreshDb();
    // Start polling every 5 seconds to sync state (important for scheduler)
    const interval = setInterval(refreshDb, 5000);
    return () => clearInterval(interval);
  }, []);

  // Actions
  const registerUser = async (user: Partial<User> & { photoBase64?: string }) => {
    const res = await fetch('http://localhost:8000/api/register-voter', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(user)
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    if (data.detail) throw new Error(data.detail);
    refreshDb();
    return data;
  };

  const addParty = async (party: Partial<Party>) => {
    const res = await fetch('http://localhost:8000/api/add-party', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(party)
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    if (data.detail) throw new Error(data.detail);
    refreshDb();
    return data;
  };

  const castVote = async (vote: any) => {
    const res = await fetch('http://localhost:8000/api/cast-vote', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(vote)
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    if (data.detail) throw new Error(data.detail);
    refreshDb();
    return data;
  }

  const updateSettings = async (settings: any) => {
    await fetch('http://localhost:8000/api/update-settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings)
    });
    refreshDb();
  }

  // Deprecated generic update (kept to prevent crashes if used elsewhere temporarily)
  const updateDb = (newDb: ElectionDB) => {
    // console.warn("Generic updateDb is deprecated. Use specific actions.");
  };

  const isElectionActive = () => {
    if (!db?.electionSettings.isActive) return false;
    const now = new Date();
    const start = db.electionSettings.startTime ? new Date(db.electionSettings.startTime) : null;
    const end = db.electionSettings.endTime ? new Date(db.electionSettings.endTime) : null;

    return start && end && now >= start && now <= end;
  };

  const hasVoted = (userId: string) => {
    return db?.votes.some(vote => vote.userId === userId) ?? false;
  };

  const getResults = () => {
    return db?.parties.map(party => ({
      name: party.name,
      votes: party.votes,
      percentage: (party.votes / ((db?.votes?.length) || 1)) * 100
    })) ?? [];
  };

  const getVoterTurnout = () => {
    const totalVoters = db?.users.length ?? 0;
    const totalVotes = db?.votes.length ?? 0;
    return {
      total: totalVoters,
      voted: totalVotes,
      percentage: totalVoters ? (totalVotes / totalVoters) * 100 : 0
    };
  };

  return {
    db,
    updateDb,
    registerUser,
    addParty,
    castVote,
    updateSettings,
    isElectionActive,
    hasVoted,
    getResults,
    getVoterTurnout
  };
}