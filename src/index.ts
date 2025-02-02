import { nakamoto_agent } from "./agent";
import type { Page } from 'puppeteer';
import { config } from 'dotenv';
const puppeteer = require("puppeteer");
const path = require("path");

config();

console.log(' [nakamoto] ');

// Define types for our chat data
type ChatData = {
  status?: string;
  someLimit?: number;
  address?: string;
  charisma?: number;
  uniqueness?: number;
  nerve?: number;
  talent?: number;
  catchphrase?: string;
  message?: string;
  task?: string;
  [key: string]: any; // Allow other properties
};

type ChatType = 'npc' | 'system';

// Custom console.log to capture agent output
const originalLog = console.log;
let chatPage: Page;

console.log = function(...args) {
  originalLog.apply(console, args);
  
  if (chatPage) {
    const message = args.join(' ');
    
    try {
      // Parse different types of messages
      if (message.includes('Environment State:')) {
        const stateStr = message.split('Environment State:')[1].split('✨')[0].trim();
        const state = JSON.parse(stateStr);
        chatPage.evaluate((data) => {
          (window as any).updateChat(data, 'npc');
        }, state);
      } 
      else if (message.includes('Agent State:')) {
        const stateStr = message.split('Agent State:')[1].split('✨')[0].trim();
        const state = JSON.parse(stateStr);
        chatPage.evaluate((data) => {
          (window as any).updateChat(data, 'npc');
        }, state);
      }
      else if (message.includes('Action State:')) {
        const stateStr = message.split('Action State:')[1].split('✨')[0].trim();
        const state = JSON.parse(stateStr);
        chatPage.evaluate((data) => {
          (window as any).updateChat(state, 'npc');
        }, state);
      }
      else if (message.includes('Said Hello:')) {
        const text = message.split('Said Hello:')[1].split('✨')[0].trim();
        chatPage.evaluate((data) => {
          (window as any).updateChat({ message: data }, 'npc');
        }, text);
      }
    } catch (e) {
      console.error('Failed to parse message:', e);
    }
  }
};

async function main() {
  try {
    // Launch a headless browser
    const browser = await puppeteer.launch({
      headless: false,
      args: ["--no-sandbox"]
    });

    // Open game window
    const gamePage = await browser.newPage();
    await gamePage.goto("https://nextlevel.blocksofbitcoin.xyz");

    // Set up random movement
    const array = ["W", "A", "S", "D"];
    setInterval(async () => {
      const randomIndex = Math.floor(Math.random() * array.length);
      const randomElement = array[randomIndex];
      await gamePage.keyboard.down(randomElement);

      setTimeout(async () => {
        await gamePage.keyboard.up(randomElement);
      }, 1000);
    }, 2000);

    // Open chat interface in a separate window
    chatPage = await browser.newPage();
    await chatPage.goto('file://' + path.resolve('chat.html'));

    // Function to update chat
    const updateChat = async (data: ChatData, type: ChatType = 'npc') => {
      await chatPage.evaluate((d: ChatData, t: ChatType) => {
        (window as any).updateChat(d, t);
      }, data, type);
    };

    // Initialize the agent
    await nakamoto_agent.init();

    // Extend the agent run options type
    interface AgentRunOptions {
      verbose: boolean;
      onAction?: (data: ChatData) => Promise<void>;
      onState?: (data: ChatData) => Promise<void>;
      onTalk?: (data: ChatData) => Promise<void>;
    }

    // Run the agent with a fixed interval
    await nakamoto_agent.run(20, {
      verbose: true,
      onAction: async (data: ChatData) => {
        await updateChat(data);
      },
      onState: async (data: ChatData) => {
        await updateChat(data);
      },
      onTalk: async (data: ChatData) => {
        await updateChat(data);
      }
    } as AgentRunOptions);

  } catch (error) {
    console.error("Error running agent:", error);
  }
}

main();
