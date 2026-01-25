import { ethers } from "ethers";

const GANACHE_URL = "http://127.0.0.1:7545";
const CONTRACT_ADDRESS = "0x0D516EF3dd057783dE9e5F9a655F72884Caa8aB7";

async function checkConnection() {
    console.log("Attempting to connect to " + GANACHE_URL);
    try {
        const provider = new ethers.JsonRpcProvider(GANACHE_URL);
        const network = await provider.getNetwork();
        console.log("Connected to network:", network.name, "Chain ID:", network.chainId.toString());

        const code = await provider.getCode(CONTRACT_ADDRESS);
        if (code === "0x") {
            console.log("WARNING: No contract code found at " + CONTRACT_ADDRESS);
            console.log("You probably restarted Ganache. You need to redeploy the contract.");
        } else {
            console.log("Contract code found at address.");
        }
    } catch (error) {
        console.error("Connection failed:", error.message);
    }
}

checkConnection();
