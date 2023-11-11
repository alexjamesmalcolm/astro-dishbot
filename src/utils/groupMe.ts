import { LRUCache } from "lru-cache";
import GroupMe, { type Collection } from "node-groupme";

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
