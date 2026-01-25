export interface User {
  username: string;
  password: string;
  voterId: string;
  role: 'admin' | 'voter';
}

export interface Party {
  name: string;
  symbol: string;
  votes: number;
  description: string;
  manifesto: string;
  imageUrl?: string;
}

export interface Vote {
  userId: string;
  partyName: string;
  timestamp: string;
  boothId: string;
  hash?: string;
}

export interface ElectionSettings {
  startTime: string | null;
  endTime: string | null;
  isActive: boolean;
  registrationOpen: boolean;
  minVotingAge: number;
  boothLocations: string[];
}