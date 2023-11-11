#!/usr/bin/env ts-node

import { connectToRedis, User } from "@utils/redis";

/*
This file is meant for being ran every 10 minutes to inform users of scheduled alerts such as if someone is about to be fined or has already been fined.

There is a date for each rotation which is the "reset" date. If the most recent reset date is too long ago then a reset will be performed as a part of this.
*/

async function main() {
  const redis = connectToRedis();
  async function scanRedis(cursor: string) {
    let [newCursor, keys] = await redis.scan(cursor);
    for await (const key of keys) {
      const result = await redis.get(key);
      if (result === null) continue;
      try {
        const user = new User(JSON.parse(result));
        console.log("I found a user");
        console.log(user);
      } catch (error) {}
    }
    if (newCursor !== "0") {
      return scanRedis(newCursor);
    }
  }
  await scanRedis("");
}

await main();
process.exit();
