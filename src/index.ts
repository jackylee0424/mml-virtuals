import { nakamoto_agent, generateNewCdpAddress, getEnergyX, consumeEnergyX } from "./agent";
import type { Page } from 'puppeteer';
import { config } from 'dotenv';
const puppeteer = require("puppeteer");
const path = require("path");


config();

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
  baseEth?: string;
  eth?: string;
  [key: string]: any; // Allow other properties
};

type ChatType = 'npc' | 'system';

// Keep track of last messages to prevent duplicates
let lastMessages: Set<string> = new Set();
let lastBaseEth: number = 0;
let lastEth: number = 0;
let isFirstUpdate: boolean = true;

// Custom console.log to capture agent output
const originalLog = console.log;
let chatPage: Page;
let gamePage: Page;
let isJumping = false;

function extractJSON(str: string): string {
  // Find the first { and last } in the string
  const start = str.indexOf('{');
  const end = str.lastIndexOf('}');
  
  if (start === -1 || end === -1) return '';
  
  // Extract just the JSON part
  return str.substring(start, end + 1);
}

function cleanAndParseJSON(str: string): any {
  // Extract just the JSON part
  str = extractJSON(str);
  if (!str) return null;
  
  try {
    return JSON.parse(str);
  } catch (e) {
    // If parsing fails, try to clean the string further
    str = str.replace(/\\n/g, '\\n')
             .replace(/\\'/g, "\\'")
             .replace(/\\"/g, '\\"')
             .replace(/\\&/g, '\\&')
             .replace(/\\r/g, '\\r')
             .replace(/\\t/g, '\\t')
             .replace(/\\b/g, '\\b')
             .replace(/\\f/g, '\\f')
             .replace(/[\u0000-\u0019]+/g, ''); // Remove control characters
    
    try {
      return JSON.parse(str);
    } catch (e) {
      console.error('Failed to parse after cleaning:', e);
      return null;
    }
  }
}

async function startJumpCelebration() {
  if (isJumping || !gamePage) return;
  
  isJumping = true;
  let jumpCount = 0;
  const maxJumps = 5; // Jump for 20 seconds (one jump per second)
  
  const jumpInterval = setInterval(async () => {
    if (jumpCount >= maxJumps) {
      clearInterval(jumpInterval);
      isJumping = false;
      return;
    }
    
    try {
      await gamePage.keyboard.press('Space');
      jumpCount++;
    } catch (e) {
      console.error('Error during jump:', e);
      clearInterval(jumpInterval);
      isJumping = false;
    }
  }, 1000); // Jump every second
}

function updateChat(data: any, type: ChatType = 'npc') {
  if (!chatPage) return;

  // Create a hash of the message to check for duplicates
  const msgHash = JSON.stringify(data);
  if (lastMessages.has(msgHash)) return;
  
  lastMessages.add(msgHash);
  // Keep set size manageable
  if (lastMessages.size > 100) {
    const values = Array.from(lastMessages.values());
    lastMessages = new Set(values.slice(-50));
  }

  // // Check for ETH balance and trigger celebration
  // const currentBaseEth = data.baseEth ? parseFloat(data.baseEth) : 0;
  // const currentEth = data.eth ? parseFloat(data.eth) : 0;
  
  // // Trigger jump if:
  // // 1. First update and either balance is >= 0.001
  // // 2. Either balance changed and new value is >= 0.001
  // if ((isFirstUpdate && (currentBaseEth >= 0.001 || currentEth >= 0.001)) ||
  //     (!isFirstUpdate && (
  //       (currentBaseEth !== lastBaseEth && currentBaseEth >= 0.001) ||
  //       (currentEth !== lastEth && currentEth >= 0.001)
  //     ))) {
  //   startJumpCelebration();
  // }

  // // Update stored values
  // lastBaseEth = currentBaseEth;
  // lastEth = currentEth;
  // isFirstUpdate = false;

  chatPage.evaluate((d, t) => {
    (window as any).updateChat(d, t);
  }, data, type);
}

console.log = function(...args) {
  originalLog.apply(console, args);
  
  if (!chatPage) return;
  
  const message = args.join(' ');
  
  try {
    // Handle different message types
    if (message.includes('Environment State:')) {
      const state = cleanAndParseJSON(message);
      if (state) updateChat(state, 'npc');
    }
    else if (message.includes('Agent State:')) {
      const state = cleanAndParseJSON(message);
      if (state) updateChat(state, 'npc');
    }
    else if (message.includes('Action State:')) {
      const state = cleanAndParseJSON(message);
      if (state) updateChat(state, 'npc');
    }
    else if (message.includes('Said Hello:')) {
      const text = message.split('Said Hello:')[1].split('✨')[0].trim();
      updateChat({ message: text, type: 'greeting' }, 'npc');
    }
    else if (message.includes('Performing function hello')) {
      const args = cleanAndParseJSON(message);
      if (args?.greeting?.value) {
        updateChat({ message: args.greeting.value, type: 'action' }, 'npc');
      }
    }
    else if (message.includes('Function status')) {
      const status = message.split('Function status')[1].split(':')[0].trim();
      if (status === '[done]') {
        updateChat({ message: 'Action completed', type: 'status' }, 'system');
      }
    }
  } catch (e) {
    console.error('Failed to process message:', e);
  }
};

async function main() {
  try {
    // Launch a headless browser
    const browser = await puppeteer.launch({
      headless: false,
      args: [
        "--no-sandbox",
        "--start-maximized",
        "--window-size=1920,1080"
      ]
    });

    // Open game window
    gamePage = await browser.newPage();
    await gamePage.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1
    });
    await gamePage.goto("https://nextlevel.blocksofbitcoin.xyz");

    // Set up random movement
    const array = ["KeyW", "KeyA", "KeyS", "KeyD"] as const;
    setInterval(async () => {
      if (!isJumping) {  // Only move if not jumping
        const randomIndex = Math.floor(Math.random() * array.length);
        const randomElement = array[randomIndex];
        await gamePage.keyboard.down(randomElement);
        
        if (getEnergyX() > 100) {
          console.log("energyX", getEnergyX())
          startJumpCelebration();
          consumeEnergyX();
        }
        setTimeout(async () => {
          await gamePage.keyboard.up(randomElement);
        }, 1000);
      }
    }, 2000);

    // Open chat interface in a separate window
    chatPage = await browser.newPage();
    await chatPage.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1
    });

    // Expose generateCdp function to the page
    await chatPage.exposeFunction('generateCdp', async () => {
      const result = await generateNewCdpAddress();
      await chatPage.evaluate((data) => {
        // Update the chat interface with the new address and balance
        (window as any).updateChat({
          address: data.address,
          baseEth: data.balance.baseEth,
          eth: data.balance.eth,
          type: 'system',
          message: 'Generated new CDP address'
        }, 'system');
      }, result);
    });

    await chatPage.goto('file://' + path.resolve('chat.html'));

    // Initialize the agent
    await nakamoto_agent.init();

    // Run the agent with a fixed interval
    await nakamoto_agent.run(20, { verbose: true });

  } catch (error) {
    console.error("Error running agent:", error);
  }
}

main();
