import Redis from "ioredis";
import { redisConnectionUrl } from "./environment";
import type { Group } from "node-groupme";
import { LRUCache } from "lru-cache";
import {
  getGroups,
  getUser as getGroupMeUser,
  getMembers,
  sendMessage,
  getBots,
  Bot,
  createBot,
  deleteBot,
} from "./groupMe";
import { z } from "zod";
import { isValidFrequency } from "./frequency";

export function connectToRedis() {
  return new Redis(redisConnectionUrl);
}

export const MemberData = z.object({
  id: z.string(),
  name: z.string(),
  fines: z.number(),
});
export type MemberData = z.infer<typeof MemberData>;

export class ChoreRotation implements ChoreRotationData {
  data: ChoreRotationData;
  constructor(data: ChoreRotationData | unknown) {
    this.data = ChoreRotationData.parse(data);
  }

  async save() {
    return saveChoreRotation(this.data);
  }

  public get id() {
    return this.data.id;
  }
  public get details() {
    return this.data.details;
  }
  public get groupMe() {
    return this.data.groupMe;
  }
  public get fines() {
    return this.data.fines;
  }
  public get reset() {
    return this.data.reset;
  }
}

export const ChoreRotationData = z.object({
  id: z.string(),
  details: z.object({
    ownerId: z.string(),
    name: z.string(),
    description: z.optional(z.string()),
  }),
  groupMe: z.object({
    groupId: z.string(),
    members: z.array(MemberData),
    bot: z.unknown(),
  }),
  fines: z.object({
    idOfResponsibleMember: z.string(),
    fineAmount: z.number(),
    schedule: z.string().refine(isValidFrequency, {
      message: "The schedule does not match the appropriate format.",
    }),
    rotationStartDate: z.string(),
  }),
  reset: z.object({
    lastResetDate: z.string(),
    schedule: z.string().refine(isValidFrequency, {
      message: "The schedule does not match the appropriate format.",
    }),
  }),
});
export type ChoreRotationData = z.infer<typeof ChoreRotationData>;

export class User implements UserData {
  data: UserData;
  constructor(data: UserData | unknown) {
    this.data = UserData.parse(data);
  }

  save() {
    return setUserData(this.accessToken, this.data);
  }

  async createRotation(data: ChoreRotationData) {
    if (!this.data.groupsWithRotations.includes(data.groupMe.groupId)) {
      this.data.groupsWithRotations.push(data.groupMe.groupId);
    }
    await saveChoreRotation(data);
    await this.save();
    const choreRotations = await this.getOwnedRotations();
    const choreRotation = choreRotations.find(
      (choreRotation) => choreRotation.id === data.id
    );
    if (choreRotation) {
      await this.getBotForRotation(choreRotation);
    }
  }

  getGroupMeUser() {
    return getGroupMeUser(this.accessToken);
  }

  getGroups() {
    return getGroups(this.accessToken);
  }

  getMembersOfGroup(groupId: Group["id"]) {
    return getMembers(this.accessToken, groupId);
  }

  sendMessage(groupId: Group["id"], message: string) {
    return sendMessage(this.accessToken, groupId, message);
  }

  async getBotsForRotation(rotation: ChoreRotation): Promise<Bot[]> {
    const allBots = await getBots(this.accessToken);
    const bots = allBots.filter(
      (bot) => bot.group_id === rotation.groupMe.groupId
    );
    console.log(bots);
    return bots;
  }

  async getBotForRotation(rotation: ChoreRotation): Promise<Bot> {
    const bots = await this.getBotsForRotation(rotation);
    const bot = bots.find((bot) => bot.name === rotation.details.name);
    if (bot) {
      return bot;
    }
    return await createBot(this.accessToken, {
      name: rotation.details.name,
      active: true,
      group_id: rotation.groupMe.groupId,
      dm_notification: false,
    });
  }

  async deleteRotation(choreRotationId: ChoreRotation["id"]) {
    const choreRotations = await this.getOwnedRotations();
    const choreRotation = choreRotations.find(
      (choreRotation) => choreRotation.id === choreRotationId
    );
    if (choreRotation === undefined) {
      return "No rotation found";
    }
    const groupId = choreRotation.groupMe.groupId;
    const isLastRotationOfGroup =
      choreRotations.filter((choreRotation) => {
        return choreRotation.groupMe.groupId === groupId;
      }).length === 1;
    if (isLastRotationOfGroup) {
      this.data.groupsWithRotations = this.data.groupsWithRotations.filter(
        (groupIdWithRotations) => {
          return groupIdWithRotations !== groupId;
        }
      );
      await this.save();
    }
    const bot = await this.getBotForRotation(choreRotation);
    await deleteBot(this.accessToken, bot.bot_id);
    await deleteChoreRotation(choreRotation.data);
  }

  async getRotations(): Promise<ChoreRotation[]> {
    console.time("Getting rotations");
    // Use the access token to get all the groups that the user is a part of
    const groups = await getGroups(this.accessToken);
    // Get all chore rotations that are associated with any of those groups
    const choreRotations: ChoreRotation[] = [];
    const allDoneResults = await Promise.allSettled(
      groups.map((group) => getChoreRotations(group.id))
    );
    for (const result of allDoneResults) {
      if (result.status === "fulfilled") {
        for (const choreRotation of result.value) {
          choreRotations.push(choreRotation);
        }
      }
    }
    console.timeEnd("Getting rotations");
    return choreRotations;
  }

  async getOwnedRotations(): Promise<ChoreRotation[]> {
    const choreRotations: ChoreRotation[] = [];
    for await (const groupId of this.groupsWithRotations) {
      for (const choreRotation of await getChoreRotations(groupId)) {
        choreRotations.push(choreRotation);
      }
    }
    return choreRotations;
  }

  public get groupsWithRotations(): string[] {
    return this.data.groupsWithRotations;
  }
  public set groupsWithRotations(v: string[]) {
    this.data.groupsWithRotations = v;
  }

  public get accessToken(): string {
    return this.data.accessToken;
  }
}

export const UserData = z.object({
  accessToken: z.string(),
  groupsWithRotations: z.array(z.string()),
});
export type UserData = z.infer<typeof UserData>;

const userCache = new LRUCache({ ttl: 1000 * 60, ttlAutopurge: true });
export async function getUser(accessToken: string): Promise<User> {
  const timeId = "Getting user";
  console.time(timeId);
  const cachedValue = userCache.get(accessToken) as UserData | undefined;
  if (cachedValue) {
    const result = new User(cachedValue);
    console.timeEnd(timeId);
    return result;
  }
  const redis = connectToRedis();
  const results = await redis.get(accessToken);
  if (results) {
    const userData = JSON.parse(results) as UserData;
    userCache.set(accessToken, userData);
    console.timeEnd(timeId);
    return new User(userData);
  }
  const defaultValue: UserData = {
    accessToken,
    groupsWithRotations: [
      // { groupId: "87490769", members: [], bot: undefined, name: "Dishes" },
    ],
  };
  //   await setUserData(accessToken, defaultValue);
  console.timeEnd(timeId);
  return new User(defaultValue);
}

const choreRotationCache = new LRUCache({ ttl: 1000 * 60, ttlAutopurge: true });
export async function getChoreRotations(
  groupId: Group["id"]
): Promise<ChoreRotation[]> {
  const timeId = `Getting chore rotations of group ${groupId}`;
  console.time(timeId);
  const cachedValue = choreRotationCache.get(groupId) as
    | ChoreRotationData[]
    | undefined;
  if (cachedValue) {
    const result = cachedValue.map(
      (choreRotation) => new ChoreRotation(choreRotation)
    );
    console.timeEnd(timeId);
    return result;
  }

  const redis = connectToRedis();
  const results = await redis.get(groupId);
  if (!results) {
    choreRotationCache.set(groupId, []);
    console.timeEnd(timeId);
    return [];
  }
  const choreRotationData = JSON.parse(results) as ChoreRotationData[];
  const result = choreRotationData.map(
    (choreRotation) => new ChoreRotation(choreRotation)
  );
  choreRotationCache.set(groupId, result);
  console.timeEnd(timeId);
  return result;
}

async function saveChoreRotation(data: ChoreRotationData) {
  const { groupId } = data.groupMe;
  const existingChoreRotations = await getChoreRotations(groupId);

  // Does rotation already exist? If so just update it
  const allChoreRotationData: ChoreRotationData[] = [data];
  for (const choreRotation of existingChoreRotations) {
    if (choreRotation.id !== data.id) {
      allChoreRotationData.push(choreRotation.data);
    }
  }

  const redis = connectToRedis();
  await redis.set(groupId, JSON.stringify(allChoreRotationData));
  choreRotationCache.clear();
}

async function deleteChoreRotation(data: ChoreRotationData) {
  const { groupId } = data.groupMe;
  const existingChoreRotations = await getChoreRotations(groupId);

  const updatedChoreRotations: ChoreRotationData[] = existingChoreRotations
    .filter((choreRotation) => {
      return choreRotation.id !== data.id;
    })
    .map((choreRotation) => choreRotation.data);

  const redis = connectToRedis();
  await redis.set(groupId, JSON.stringify(updatedChoreRotations));
  choreRotationCache.clear();
}

export async function setUserData(accessToken: string, userData: UserData) {
  const redis = connectToRedis();
  return redis.set(accessToken, JSON.stringify(userData));
}

export function isRedisUp() {
  return connectToRedis()
    .ping()
    .then(() => true)
    .catch(() => false);
}
