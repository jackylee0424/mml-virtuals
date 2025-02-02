import { nakamoto_agent } from "./agent";
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
  [key: string]: any; // Allow other properties
};

type ChatType = 'npc' | 'system';

// Keep track of last messages to prevent duplicates
let lastMessages: Set<string> = new Set();

// Custom console.log to capture agent output
const originalLog = console.log;
let chatPage: Page;

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
        "--start-maximized", // Start with maximized windows
        "--window-size=1920,1080" // Set default window size to 1080p
      ]
    });

    // Open game window
    const gamePage = await browser.newPage();
    // Set viewport to 1080p
    await gamePage.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1
    });
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
    // Set viewport to 1080p
    await chatPage.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1
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
