import { ethers } from "ethers";

async function main() {
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");
    const signer = await provider.getSigner(0);
    const address = await signer.getAddress();
    console.log("From:", address);

    const balance = await provider.getBalance(address);
    console.log("Balance:", ethers.formatEther(balance));

    // Send self-transaction
    const tx = await signer.sendTransaction({
        to: address,
        value: ethers.parseEther("0.01")
    });
    console.log("Tx Hash:", tx.hash);
    await tx.wait();
    console.log("Tx Confirmed");
}

main().catch(console.error);
