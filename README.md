# Metaverse Scavenger Agent
### This is a SF Onchain AI Hackathon hackathon project by Jackie Lee and Vasily Gnuchev.
Players, with the help of AI agents, can have virtual and autonomous presence in 3D worlds for them to acquire rewards and compete in multiplayer campaigns. Players are lazy. However, with the assistance of goal-oriented agents, players can accomplish goals with agents based on formulating actions at the strategic level. This opens up a new kind of AI assisted gameplay experience.

We prototyped a scavenger agent client using [Virtuals G.A.M.E SDK](https://github.com/game-by-virtuals) for [mml.io](http://mml.io) (an open-source multiplayer web-based 3D framework). Each agent client is autonomous with goals to explore, equipped with [Coinbase CDP Agentkit](https://github.com/coinbase/agentkit) [Base](https://www.base.org/build) wallet, and react to resource fulfillments. This agent client is open source and can be customized for more complex goals.

![4972517036148239947](https://github.com/user-attachments/assets/34692a8f-b0e4-41d9-b3ad-9a109468f10b)

## quick start
1. Get Virtuals API keys: https://console.game.virtuals.io/ and set `API_KEY=[]` in `.env`
2. Get CDP API keys: https://docs.cdp.coinbase.com/get-started/docs/cdp-api-keys
3. `npm install && npm run dev`
