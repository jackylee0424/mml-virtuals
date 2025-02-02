import { GameAgent } from "@virtuals-protocol/game";
import { helloWorker, postTweetWorker } from "./worker";
import { CdpWalletProvider } from "@coinbase/agentkit";
const { ethers } = require('ethers');
import dotenv from "dotenv";
dotenv.config();

var EnergyX:number = -1;

export function getEnergyX () {
  return EnergyX
}

export function consumeEnergyX () {
  if (EnergyX > 500){
    EnergyX -= 500;
  }
}

const DEFAULT_ADDRESS = "0x92aA6ab29370215a0C85B757d27CC728584c86F1";
let currentAddress = DEFAULT_ADDRESS;

// Configure CDP Wallet Provider
const config = {
  apiKeyName: process.env.CDP_API_KEY,
  apiKeyPrivateKey: process.env.CDP_PKEY?.replace(/\\n/g, "\n"),
  networkId: "base-mainnet",
};

export async function generateNewCdpAddress(): Promise<{address: string, balance: any}> {
  try {
    const walletProvider = await CdpWalletProvider.configureWithWallet(config);
    const newAddress = walletProvider.getAddress();
    currentAddress = newAddress;
    const balance = await getBalance(newAddress);
    return { address: newAddress, balance };
  } catch (error) {
    console.error('Error generating CDP address:', error);
    const balance = await getBalance(DEFAULT_ADDRESS);
    return { address: DEFAULT_ADDRESS, balance };
  }
}

async function getBalance(address:string) {
  try {
      // Initialize provider
      const baseRpcUrl = `https://base-mainnet.infura.io/v3/${process.env.INFURA_ID}`
      const baseSepoliaRpcUrl = `https://base-sepolia.infura.io/v3/${process.env.INFURA_ID}`
      const ethRpcUrl = `https://mainnet.infura.io/v3/${process.env.INFURA_ID}`
      const baseProvider = new ethers.JsonRpcProvider(baseRpcUrl);
      const baseSepoliaProvider = new ethers.JsonRpcProvider(baseSepoliaRpcUrl);
      const ethProvider = new ethers.JsonRpcProvider(ethRpcUrl);

      const balanceBaseEth = ethers.formatEther(await baseProvider.getBalance(address));
      const balanceBaseSepolia = ethers.formatEther(await baseSepoliaProvider.getBalance(address));
      const balanceEth = ethers.formatEther(await ethProvider.getBalance(address));
      
      return { 
        baseEth: Number(balanceBaseEth),
        baseSepolia: Number(balanceBaseSepolia),
        eth: Number(balanceEth)
      };
          
  } catch (error) {
      console.error('Error fetching ETH balance:', error);
      throw error;
  }
}

// State management function
const getAgentState = async (): Promise<Record<string, any>> => {
  const balance = await getBalance(currentAddress);
  EnergyX += Math.floor((balance["baseSepolia"]) * 1000);
  return {
    address: currentAddress,
    baseEth: balance["baseEth"],
    eth: balance["eth"],
    baseSepolia: balance["baseSepolia"],
    energyX: EnergyX,
    status: "exploring",
    energy: Math.floor((balance["baseEth"] + balance["eth"]) * 1000),
    catchphrase:
      "If you don't believe it or don't get it, I don't have the time to try to convince you, sorry.",
  };
};

export const scavenger_agent = new GameAgent(process.env.API_KEY || "", {
  name: "scavenger",
  goal: "To survive and thrive in the harsh treasure hunting environment, gold rush scavengers focused on a set of vital daily objectives. Their immediate priorities typically included securing enough energy and valuables for the next few days, finding safe places to explore without attracting attention from other prospectors, and scouting promising locations to search – particularly after rain might have revealed new deposits or when other miners abandoned their claims. They would spend hours examining tailings piles and waste rock, hoping to find gold that earlier miners had missed. Many developed side hustles like trading salvaged equipment, selling information about promising locations, or offering their expertise to inexperienced miners. They were constantly balancing the need to maintain their basic necessities with their broader ambition of finding enough gold to escape their marginal existence, always keeping an eye out for signs that a new rush might be starting somewhere else.",
  description: `Gold rush scavengers were typically characterized by a potent mix of desperation, opportunism, and resourcefulness. These individuals would often arrive late to mining areas, after the initial claims were staked, and developed a keen eye for overlooked opportunities - whether that meant reworking abandoned claims, scavenging discarded equipment, or finding alternative ways to profit from the gold economy. They tended to be highly adaptable and resilient, willing to endure harsh conditions and social stigma while maintaining a persistent optimism that their next find could change everything. Many were solitary figures, distrustful of partnerships after witnessing countless betrayals in the competitive mining environment, yet they often possessed detailed knowledge of local geography and mining history that helped them identify promising locations others had overlooked.`,
  getAgentState: getAgentState,
  workers: [helloWorker],
});

// Add custom logger
scavenger_agent.setLogger((agent: GameAgent, msg: string) => {
  console.log(`👑 [${agent.name}] 👑`);
  console.log(msg);
  console.log("✨ Treasure Hunting on Blocks of Bitcoin! ✨\n");
});
