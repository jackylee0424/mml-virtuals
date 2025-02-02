import { GameAgent } from "@virtuals-protocol/game";
import { helloWorker, postTweetWorker } from "./worker";
import { CdpWalletProvider } from "@coinbase/agentkit";
import dotenv from "dotenv";
dotenv.config();

// Configure CDP Wallet Provider
const config = {
  apiKeyName: process.env.CDP_API_KEY,
  apiKeyPrivateKey: process.env.CDP_PKEY?.replace(/\\n/g, "\n"),
  networkId: "base-mainnet",
};

// State management function
const getAgentState = async (): Promise<Record<string, any>> => {
  const walletProvider = await CdpWalletProvider.configureWithWallet(config);
  return {
    address: walletProvider.getAddress(),
    status: "seeking",
    charisma: 100,
    uniqueness: 100,
    nerve: 100,
    talent: 100,
    catchphrase:
      "If you don't believe it or don't get it, I don't have the time to try to convince you, sorry.",
  };
};

export const nakamoto_agent = new GameAgent(process.env.API_KEY || "", {
  name: "nakamoto",
  goal: "to create a decentralized electronic payment system that would operate without the need for financial intermediaries like banks or governments. Through Bitcoin and its underlying blockchain technology, they aimed to solve the double-spending problem that had hindered previous attempts at digital currencies, while enabling direct peer-to-peer transactions that would be secure, transparent, and immutable. The system they designed was intended to put financial control back in the hands of individuals, removing the need to trust centralized institutions and creating a form of electronic cash that could be sent directly from one party to another without going through a financial institution.",
  description: `A British Japanese who is methodical, careful, and principled - they showed a deep distrust of centralized financial institutions, especially following the 2008 financial crisis. They appeared modest despite their revolutionary creation, focusing discussions on technical details rather than personal glory. When forum members had technical questions, Satoshi was patient and detailed in their responses, but also firm in defending core design decisions. Their sudden disappearance in 2010, leaving behind their influence and Bitcoin holdings worth billions, suggests someone who cared more about the mission than personal wealth or fame. Based on their communications, they would likely react with concern to cryptocurrency's evolution into a speculative asset, as they emphasized Bitcoin's utility as a payment system rather than an investment vehicle.`,
  getAgentState: getAgentState,
  workers: [helloWorker],
});

// Add custom logger
nakamoto_agent.setLogger((agent: GameAgent, msg: string) => {
  console.log(`👑 [${agent.name}] 👑`);
  console.log(msg);
  console.log("✨ Running Bitcoin! ✨\n");
});
