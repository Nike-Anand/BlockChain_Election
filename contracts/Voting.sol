// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract VotingSystem {
    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    mapping(uint => Candidate) public candidates;
    mapping(string => bool) public voters; // EPIC number based tracking
    
    uint public candidatesCount;
    address public admin;
    string public electionName;

    event VotedEvent(uint indexed _candidateId);

    constructor(string memory _name) {
        admin = msg.sender;
        electionName = _name;
    }

    function addCandidate(string memory _name) public {
        require(msg.sender == admin, "Only admin can add candidates");
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
    }

    function vote(uint _candidateId, string memory _epicNumber) public {
        // Require that they haven't voted before
        require(!voters[_epicNumber], "This EPIC number has already voted.");

        // Require a valid candidate
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate.");

        // Record the voter has voted
        voters[_epicNumber] = true;

        // Update candidate vote Count
        candidates[_candidateId].voteCount++;

        emit VotedEvent(_candidateId);
    }

    function getCandidate(uint _candidateId) public view returns (uint, string memory, uint) {
        return (candidates[_candidateId].id, candidates[_candidateId].name, candidates[_candidateId].voteCount);
    }
}
