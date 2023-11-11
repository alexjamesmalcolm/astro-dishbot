#!/usr/bin/env ts-node

import { getNext } from "@utils/array";
import {
  parseSchedule,
  didEventAlreadyHappen,
  getFormattedCountdown,
} from "@utils/frequency";
import { connectToRedis, User, type MemberData } from "@utils/redis";

/*
This file is meant for being ran every 10 minutes to inform users of scheduled alerts such as if someone is about to be fined or has already been fined.

There is a date for each rotation which is the "reset" date. If the most recent reset date is too long ago then a reset will be performed as a part of this.
*/

async function processUser(user: User) {
  const rotations = await user.getOwnedRotations();
  for await (const rotation of rotations) {
    // First reset
    const lastResetDate = new Date(rotation.reset.lastResetDate);
    const shouldReset = didEventAlreadyHappen(
      lastResetDate,
      rotation.reset.schedule
    );
    if (shouldReset) {
      console.log("Should reset");
    }
    // Then do fines
    const rotationStartDate = new Date(rotation.fines.rotationStartDate);
    const shouldFine = didEventAlreadyHappen(
      rotationStartDate,
      rotation.fines.schedule
    );
    if (shouldFine) {
      console.log("Should fine");
      const messageData: {
        fineTotal?: number;
        originalMember?: MemberData;
        nextMember?: MemberData;
      } = {};
      for (let i = 0; i < rotation.groupMe.members.length; i++) {
        const member = rotation.groupMe.members[i];
        if (member.id === rotation.fines.idOfResponsibleMember) {
          messageData.originalMember = member;
          member.fines += rotation.fines.fineAmount;
          messageData.fineTotal = member.fines;
          const nextMember = getNext(rotation.groupMe.members, i);
          if (nextMember) {
            rotation.fines.idOfResponsibleMember = nextMember.id;
            messageData.nextMember = nextMember;
          }
          break;
        }
      }
      const rotationStartDate = new Date();
      rotation.fines.rotationStartDate = rotationStartDate.toISOString();
      const schedule = parseSchedule(rotation.fines.schedule);
      const next = schedule.next(1, rotationStartDate) as Date;
      await rotation.save();
      const bot = await user.getBotForRotation(rotation);
      const message = `${messageData.originalMember?.name} was fined $${
        rotation.fines.fineAmount
      } and now owes $${messageData.fineTotal}, now ${
        messageData.nextMember?.name
      } is responsible and has ${getFormattedCountdown(next)} left.`;
      //   await user.sendMessage(rotation.groupMe.groupId, message);
      await bot.sendMessage(message);
    }
  }
}

async function main() {
  const redis = connectToRedis();
  async function scanRedis(cursor: string) {
    let [newCursor, keys] = await redis.scan(cursor);
    for await (const key of keys) {
      const result = await redis.get(key);
      if (result === null) continue;
      try {
        const user = new User(JSON.parse(result));
        await processUser(user);
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
