import { LRUCache } from "lru-cache";
import GroupMe, { type Group, type Collection } from "node-groupme";

const getGroupsCache = new LRUCache({ ttl: 1000 * 60, ttlAutopurge: true });
export async function getGroups(
  accessToken: string
): Promise<Collection<string, GroupMe.Group>> {
  const cachedValue = getGroupsCache.get(accessToken) as
    | Collection<string, GroupMe.Group>
    | undefined;
  if (cachedValue) {
    return cachedValue;
  }
  const client = new GroupMe.Client(accessToken);
  await client.login();
  const groups = await client.groups.fetch();
  getGroupsCache.set(accessToken, groups);
  return groups;
}

type Role = "owner" | "admin" | "user";
export interface Member {
  // This ID is universal across groups for a given user
  user_id: string;
  nickname: string;
  image_url: string;
  // ID is different across groups for the same user
  id: string;
  muted: boolean;
  autokicked: boolean;
  roles: Role[];
  name: string;
}

export async function getMembers(
  accessToken: string,
  groupId: GroupMe.Group["id"]
) {
  const client = new GroupMe.Client(accessToken);
  await client.login();
  const detailedGroup = await client.rest.api<Record<string, unknown>>(
    "GET",
    `groups/${groupId}`
  );
  const members = detailedGroup.members as Member[];
  return members;
}

export async function getUser(accessToken: string) {
  const client = new GroupMe.Client(accessToken);
  await client.login();
  return client.user;
}

export async function sendMessage(
  accessToken: string,
  groupId: Group["id"],
  message: string
) {
  const client = new GroupMe.Client(accessToken);
  await client.login();
  const group = await client.groups.fetch(groupId);
  return group.send(message);
}

export interface BotData {
  name: string;
  bot_id: string;
  group_id: string;
  group_name: string;
  avatar_url: null | string;
  callback_url: string;
  dm_notification: boolean;
  active: boolean;
}

export class Bot implements BotData {
  data: BotData;
  private accessToken: string;
  constructor(data: BotData, accessToken: string) {
    this.data = data;
    this.accessToken = accessToken;
  }

  public get name(): string {
    return this.data.name;
  }
  public get bot_id(): string {
    return this.data.bot_id;
  }
  public get group_id(): string {
    return this.data.group_id;
  }
  public get group_name(): string {
    return this.data.group_name;
  }
  public get avatar_url() {
    return this.data.avatar_url;
  }
  public get callback_url(): string {
    return this.data.callback_url;
  }
  public get dm_notification() {
    return this.data.dm_notification;
  }
  public get active() {
    return this.data.active;
  }

  async save() {
    // Save updates with GroupMe
  }

  delete() {
    return deleteBot(this.accessToken, this.bot_id);
  }

  async sendMessage(message: string) {
    // Send a message to group
    const client = new GroupMe.Client(this.accessToken);
    await client.login();
    const result = await client.rest.api("POST", "bots/post", {
      body: { bot_id: this.bot_id, text: message },
    });
    console.log(result);
  }
}

export async function getBots(accessToken: string): Promise<Bot[]> {
  const client = new GroupMe.Client(accessToken);
  await client.login();
  const botData = await client.rest.api<BotData[]>("GET", "bots", undefined, {
    version: "v3",
  });
  return botData.map((data) => new Bot(data, accessToken));
}

export async function createBot(
  accessToken: string,
  data: {
    name: string;
    group_id: string;
    avatar_url?: string;
    callback_url?: string;
    dm_notification?: boolean;
    active: boolean;
  }
): Promise<Bot> {
  const client = new GroupMe.Client(accessToken);
  await client.login();
  const botData = await client.rest.api<BotData>("POST", "bots", {
    body: { bot: data },
  });
  const bot = new Bot(botData, accessToken);
  await bot.sendMessage(
    `Hello all! I'm a bot for ${data.name} made by ${client.user.name}.`
  );
  return bot;
}

export async function deleteBot(accessToken: string, botId: string) {
  const client = new GroupMe.Client(accessToken);
  await client.login();
  const result = await client.rest.api(
    "DELETE",
    "bots/destroy",
    { body: { bot_id: botId } },
    {
      version: "v3",
    }
  );
  return result;
}
