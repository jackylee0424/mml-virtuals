import { rupaul_agent } from "./agent";
const puppeteer = require("puppeteer");

async function main() {
    try {
        // Launch a headless browser
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();

        // Navigate to a website
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
        await rupaul_agent.init();

        // Example of running the agent with a fixed interval
        await rupaul_agent.run(60, { verbose: true });

        // Alternative: Run the agent step by step
        // await rupaul_agent.step();

        // Example of running a specific worker with a task

        // const worker = rupaul_agent.getWorkerById("hello_worker");
        // if (worker) {
        //     await worker.runTask(
        //         "be friendly and welcoming",
        //         { verbose: true }
        //     );
        // }

    } catch (error) {
        console.error("Error running agent:", error);
    }
}

main();