import { nakamoto_agent } from "./agent";
const puppeteer = require("puppeteer");

async function main() {
  try {
    // Launch a headless browser
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Navigate to an MML metaverse as a headless client
    await page.goto("https://nextlevel.blocksofbitcoin.xyz");

    const array = ["W", "A", "S", "D"];
    setInterval(async () => {
      const randomIndex = Math.floor(Math.random() * array.length);
      const randomElement = array[randomIndex];
      await page.keyboard.down(randomElement);

      setTimeout(async () => {
        await page.keyboard.up(randomElement);
      }, 1000);
    }, 2000);

    // Initialize the agent
    await nakamoto_agent.init();

    // Example of running the agent with a fixed interval
    await nakamoto_agent.run(20, { verbose: true });
  } catch (error) {
    console.error("Error running agent:", error);
  }
}

main();
