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
  admin: { username: 'admin', password: 'admin123', voterId: 'ADMIN001', role: 'admin' },
  users: [
    { username: 'admin', password: 'admin123', voterId: 'ADMIN001', role: 'admin' }
  ],
  parties: [
    {
      name: "Dravida Munnetra Kazhagam (DMK)",
      symbol: "☀️",
      description: "Dravidian model of governance focused on Social Justice, Equality, and State Autonomy. Leading the Secular Progressive Alliance.",
      manifesto: "1. State Autonomy\n2. Social Justice & Equality\n3. Women's Rights & Empowerment\n4. Education & Health for All\n5. Economic Development & Industrial Growth",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/ee/Flag_DMK.svg", // Official SVG
      votes: 0
    },
    {
      name: "All India Anna Dravida Munnetra Kazhagam (AIADMK)",
      symbol: "🍃",
      description: "Working for the welfare of the poor and downtrodden, following the path of Puratchi Thalaivar MGR and Puratchi Thalaivi Amma.",
      manifesto: "1. Welfare Schemes for Women\n2. Free Education & Laptops\n3. Protecting State Rights\n4. Infrastructure Development\n5. Farmer Welfare",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/1/1d/AIADMK_Flag.svg", // Official SVG
      votes: 0
    },
    {
      name: "Tamizhaga Vettri Kazhagam (TVK)",
      symbol: "🐘",
      description: "Working for the welfare of the people of Tamil Nadu",
      manifesto: "1. Victory for Tamil Nadu\n2. Welfare for All",
      imageUrl: "https://upload.wikimedia.org/wikipedia/en/2/29/Tamilaga_Vettri_Kazhagam_Flag.svg", // Placeholder / Prediction
      votes: 0
    }
  ],
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
    fetch('http://127.0.0.1:5000/api/get-db')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) setDb(data);
        else setDb(DEFAULT_DB);
      })
      .catch(() => setDb(DEFAULT_DB));
  };

  useEffect(() => { refreshDb(); }, []);

  // Actions
  const registerUser = async (user: Partial<User>) => {
    const res = await fetch('http://127.0.0.1:5000/api/register-voter', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(user)
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    refreshDb();
    return data;
  };

  const addParty = async (party: Partial<Party>) => {
    const res = await fetch('http://127.0.0.1:5000/api/add-party', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(party)
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    refreshDb();
    return data;
  };

  const castVote = async (vote: any) => {
    const res = await fetch('http://127.0.0.1:5000/api/cast-vote', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(vote)
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    refreshDb();
    return data;
  }

  const updateSettings = async (settings: any) => {
    await fetch('http://127.0.0.1:5000/api/update-settings', {
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
      percentage: (party.votes / (db.votes.length || 1)) * 100
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