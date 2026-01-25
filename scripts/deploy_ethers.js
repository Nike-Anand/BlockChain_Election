import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    try {
        const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");

        // Check connection first
        const network = await provider.getNetwork();
        console.log(`Connected to network ${network.name} (${network.chainId})`);

        // Get signer (Account 0)
        const signer = await provider.getSigner(0);
        console.log("Deploying contract with account:", await signer.getAddress());

        // Load Artifact
        const artifactPath = path.resolve(__dirname, "../artifacts/contracts/Voting.sol/VotingSystem.json");
        console.log("Loading artifact from:", artifactPath);
        if (!fs.existsSync(artifactPath)) {
            throw new Error("Artifact not found!");
        }
        const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

        console.log("Bytecode size:", artifact.bytecode.length);

        // Create Factory
        const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);

        // Deploy
        console.log("Deploying VotingSystem...");
        // Use manual gas settings to ensure it works on Ganache
        const contract = await factory.deploy("Indian Election 2026", {
            gasLimit: 3000000
        });

        console.log("Waiting for deployment...");
        await contract.waitForDeployment();

        const address = await contract.getAddress();
        console.log("VotingSystem deployed to:", address);

        // Update App.tsx logic is manual for now to avoid complexity in this script
        console.log("PLEASE UPDATE App.tsx WITH THIS ADDRESS: " + address);

        // Basic Setup: Add Candidates
        console.log("Adding candidates...");
        const candidates = ["BJP", "INC", "AAP", "NOTA"];
        for (const candidate of candidates) {
            console.log(`Adding ${candidate}...`);
            const tx = await contract.addCandidate(candidate, { gasLimit: 500000 });
            await tx.wait();
        }

        console.log("Deployment Complete!");
    } catch (error) {
        console.error("FATAL ERROR:");
        console.error(error.message);
        if (error.info) console.log("Info:", error.info);
    }
}

main();
