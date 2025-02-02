import { nakamoto_agent, generateNewCdpAddress } from "./agent";
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
let isFirstUpdateVar: boolean = true;

// Custom console.log to capture agent output
const originalLog = console.log;
let gamePage: Page | null = null;  // Allow null for gamePage
let chatPage: Page;
let isJumping = false;
let gamePageReady = false;

// Add QRCode type declaration
declare class QRCode {
  constructor(element: HTMLElement, options: {
    text: string;
    width?: number;
    height?: number;
    colorDark?: string;
    colorLight?: string;
    correctLevel?: any;
  });
  
  static CorrectLevel: {
    L: number;
    M: number;
    Q: number;
    H: number;
  };
}

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
  console.log('Starting jump celebration...');
  if (!gamePageReady || !gamePage) {
    console.error('Cannot jump - game page not initialized!');
    return;
  }
  if (isJumping) {
    console.log('Already jumping, skipping celebration');
    return;
  }
  
  isJumping = true;
  let jumpCount = 0;
  const maxJumps = 20;
  
  // Focus game window before jumping
  await gamePage.bringToFront();
  await gamePage.click('canvas');
  
  console.log('Starting jump sequence...');
  const jumpInterval = setInterval(async () => {
    if (jumpCount >= maxJumps || !gamePage) {
      console.log('Jump celebration complete!');
      clearInterval(jumpInterval);
      isJumping = false;
      return;
    }
    
    try {
      // Press and release Space key with a small delay
      await gamePage.keyboard.down('Space');
      await new Promise(resolve => setTimeout(resolve, 100));  // Hold space for 100ms
      await gamePage.keyboard.up('Space');
      jumpCount++;
      console.log(`Jump ${jumpCount}/${maxJumps}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error during jump:', errorMessage);
      clearInterval(jumpInterval);
      isJumping = false;
    }
  }, 500); // Jump every 500ms instead of 1000ms
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

  // Check for ETH balance and trigger celebration
  const currentBaseEth = data.baseEth ? parseFloat(data.baseEth.toString()) : 0;
  const currentEth = data.eth ? parseFloat(data.eth.toString()) : 0;
  
  // Trigger jump if:
  // 1. First update and either balance is >= 0.001
  // 2. Either balance changed and new value is >= 0.001
  if ((isFirstUpdate && (currentBaseEth >= 0.001 || currentEth >= 0.001)) ||
      (!isFirstUpdate && (
        (currentBaseEth !== lastBaseEth && currentBaseEth >= 0.001) ||
        (currentEth !== lastEth && currentEth >= 0.001)
      ))) {
    console.log('Triggering celebration! Base ETH:', currentBaseEth, 'ETH:', currentEth);
    
    // Add celebration message to chat
    chatPage.evaluate(() => {
      (window as any).updateChat({
        type: 'action',
        message: '🎉 Celebrating! Jumping 20 times to celebrate having ETH! 🎉'
      });
    }).catch(error => console.error('Error showing celebration message:', error));
    
    startJumpCelebration();
  }

  // Update stored values
  lastBaseEth = currentBaseEth;
  lastEth = currentEth;
  isFirstUpdate = false;

  // Update chat with state info
  chatPage.evaluate((d, t) => {
    try {
      // Update address and balances first
      if (d.address) {
        const addressElement = document.getElementById('address');
        if (addressElement) addressElement.textContent = d.address;
        
        const balanceElement = document.getElementById('eth-balance');
        if (balanceElement) balanceElement.textContent = `${d.baseEth || '0.0'} Base ETH`;
        
        const energyBar = document.getElementById('energy-bar-fill');
        if (energyBar && d.baseEth) {
          const percentage = Math.min(parseFloat(d.baseEth) * 100, 100);
          energyBar.style.width = percentage + '%';
        }

        // Update QR code
        const qrContainer = document.getElementById('qr-code');
        if (qrContainer && typeof QRCode !== 'undefined') {
          qrContainer.innerHTML = '';
          new QRCode(qrContainer, {
            text: "ethereum:" + d.address,
            width: 90,
            height: 90,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
          });
        }
      }

      // Then add the message to chat
      const formatted = `<div class="message ${t}">${(window as any).formatContent(d)}</div>`;
      const chatBox = document.getElementById('messages');
      if (chatBox) {
        chatBox.innerHTML += formatted;
        chatBox.scrollTop = chatBox.scrollHeight;
      }
    } catch (error) {
      console.error('Error updating chat:', error);
    }
  }, data, type).catch(error => console.error('Error updating chat:', error));
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

async function connectToGame(browser: any, maxRetries = 3): Promise<Page | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries} to connect to game...`);
      const page = await browser.newPage();
      await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1
      });

      // Try different game URLs
      const gameUrls = [
        "https://nextlevel.blocksofbitcoin.xyz",
        "http://nextlevel.blocksofbitcoin.xyz",
        "https://www.blocksofbitcoin.xyz"
      ];

      for (const url of gameUrls) {
        try {
          console.log(`Trying ${url}...`);
          await page.goto(url, {
            waitUntil: 'networkidle0',
            timeout: 30000
          });
          await page.waitForSelector('canvas', { timeout: 5000 });
          console.log('Game page loaded successfully!');
          return page;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.log(`Failed to load ${url}:`, errorMessage);
          continue;
        }
      }

      if (attempt < maxRetries) {
        console.log('Waiting 5 seconds before next attempt...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Attempt ${attempt} failed:`, errorMessage);
    }
  }
  
  console.error('Failed to connect to game after all attempts');
  return null;
}

async function main() {
  try {
    // Launch a headless browser
    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,  // This allows the viewport to be responsive
      args: [
        "--no-sandbox",
        "--start-maximized",
        "--window-size=1920,1080",
        "--disable-web-security",
        "--disable-features=IsolateOrigins,site-per-process"
      ]
    });

    // Try to connect to game
    gamePage = await connectToGame(browser);
    if (!gamePage) {
      console.error('Could not connect to game. Running in chat-only mode.');
    } else {
      gamePageReady = true;
      
      // Wait for game to be fully loaded
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Focus the game window to ensure keyboard events work
      await gamePage.bringToFront();
      await gamePage.click('canvas');
      
      // Set up random movement only if game page is ready
      const array = ["KeyW", "KeyA", "KeyS", "KeyD"] as const;
      setInterval(async () => {
        if (!isJumping && gamePageReady && gamePage) {
          try {
            const randomIndex = Math.floor(Math.random() * array.length);
            const randomElement = array[randomIndex];
            await gamePage.keyboard.down(randomElement);

            setTimeout(async () => {
              if (gamePage) {
                await gamePage.keyboard.up(randomElement);
              }
            }, 1000);
          } catch (error) {
            console.error('Error during movement:', error);
          }
        }
      }, 2000);
    }

    // Open chat interface in a separate window
    chatPage = await browser.newPage();
    
    // Set viewport to be responsive
    await chatPage.setViewport({
      width: 0,
      height: 0,
      deviceScaleFactor: 1
    });
    
    // Navigate to chat page
    await chatPage.goto('file://' + path.resolve('chat.html'));
    
    // Make chat window full screen
    await chatPage.evaluate(() => {
      document.documentElement.style.width = '100vw';
      document.documentElement.style.height = '100vh';
      document.body.style.width = '100vw';
      document.body.style.height = '100vh';
      document.body.style.margin = '0';
      document.body.style.padding = '0';
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

    // Initialize the agent
    await nakamoto_agent.init();

    // Run the agent with a fixed interval
    await nakamoto_agent.run(20, { verbose: true });

  } catch (error) {
    console.error("Error running agent:", error);
  }
}

main();
