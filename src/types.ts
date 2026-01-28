export interface User {
    username: string;
    password: string;
    voterId: string;
    role: 'admin' | 'voter' | 'commission';
}

export interface Party {
    name: string;
    symbol: string;
    description?: string;
    manifesto?: string;
    imageUrl?: string;
    votes: number;
}

export interface Vote {
    userId: string;
    partyName: string;
    timestamp: string;
    boothId: string;
    hash: string;
}

export interface ElectionSettings {
    startTime: string | null;
    endTime: string | null;
    isActive: boolean;
    registrationOpen: boolean;
    minVotingAge: number;
    boothLocations: string[];
    pass1?: string;
    pass2?: string;
    pass3?: string;
    pass4?: string;
}
