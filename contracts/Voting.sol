// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract VotingSystem {
    struct Candidate {
        uint id;
        string name;
        string uuid;  // NEW: Stable identifier
        uint voteCount;
    }

    mapping(uint => Candidate) public candidates;
    mapping(string => uint) public candidateByUUID;  // NEW: UUID -> candidateId mapping
    mapping(string => bool) public hasVoted;  // EPIC number based tracking
    mapping(string => string) public voteHashes;  // NEW: voterId -> voteHash (links to database)
    
    uint public candidatesCount;
    address public admin;
    string public electionName;

    event VoteCast(string indexed voterId, uint indexed candidateId, string voteHash, uint timestamp);
    event CandidateAdded(uint indexed candidateId, string name, string uuid);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    constructor(string memory _name) {
        admin = msg.sender;
        electionName = _name;
    }

    function addCandidate(string memory _name, string memory _uuid) public onlyAdmin {
        require(bytes(_uuid).length > 0, "UUID cannot be empty");
        require(candidateByUUID[_uuid] == 0, "UUID already exists");
        
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, _uuid, 0);
        candidateByUUID[_uuid] = candidatesCount;
        
        emit CandidateAdded(candidatesCount, _name, _uuid);
    }

    function vote(string memory _partyUUID, string memory _voterId, string memory _voteHash) public {
        // Get candidate ID from UUID (prevents ID shifting issues)
        uint candidateId = candidateByUUID[_partyUUID];
        require(candidateId > 0, "Invalid party UUID");
        
        // Prevent double voting
        require(!hasVoted[_voterId], "Already voted");
        
        // Validate vote hash
        require(bytes(_voteHash).length == 64, "Invalid vote hash format");
        
        // Record vote
        hasVoted[_voterId] = true;
        voteHashes[_voterId] = _voteHash;  // Store hash for verification
        candidates[candidateId].voteCount++;
        
        emit VoteCast(_voterId, candidateId, _voteHash, block.timestamp);
    }

    function getCandidate(uint _candidateId) public view returns (uint, string memory, string memory, uint) {
        Candidate memory c = candidates[_candidateId];
        return (c.id, c.name, c.uuid, c.voteCount);
    }
    
    function getCandidateByUUID(string memory _uuid) public view returns (uint, string memory, uint) {
        uint candidateId = candidateByUUID[_uuid];
        require(candidateId > 0, "UUID not found");
        Candidate memory c = candidates[candidateId];
        return (c.id, c.name, c.voteCount);
    }
    
    function getVoteHash(string memory _voterId) public view returns (string memory) {
        return voteHashes[_voterId];
    }
}
