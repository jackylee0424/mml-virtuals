import { GameWorker } from "@virtuals-protocol/game";
import {
  helloFunction,
  searchTweetsFunction,
  replyToTweetFunction,
  postTweetFunction,
} from "./functions";
import dotenv from "dotenv";
dotenv.config();

export const helloWorker = new GameWorker({
  id: "hello_worker",
  name: "hello worker",
  description: "has the ability to feel competitive based on the concurrency",
  functions: [helloFunction],
  getEnvironment: async () => {
    const res = await fetch(`${process.env.FIREBASE_FUNCTION_URI}/getagents?passcode=${process.env.FIREBASE_PASSCODE}`)
    const resJson = await res.json();
    const concurrency = resJson["concurrency"];
    return {
      status: concurrency > 1 ? "competitive": "friendly",
      // Add any environment variables your worker needs
      concurrency: concurrency,
    };
  },
});

export const postTweetWorker = new GameWorker({
  id: "twitter_main_worker",
  name: "Twitter main worker",
  description: "Worker that posts tweets",
  functions: [searchTweetsFunction, replyToTweetFunction, postTweetFunction],
  // Optional: Provide environment to LLP
  getEnvironment: async () => {
    return {
      tweet_limit: 15,
    };
  },
});
