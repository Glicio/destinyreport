import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import fetchBungie from "~/utis/fetchBungie";
import getBungieMembershipType from "~/utis/getBungieMembershipType";

interface SearchResult {
  bungieGlobalDisplayName: string;
  bungieGlobalDisplayNameCode: number;
  bungieNetMembershipId: string;
  destinyMemberships: DestinyMembership[];
}

interface Response {
  searchResults: SearchResult[];
  page: number;
  hasMore: boolean;
}

interface DestinyMembership {
  LastSeenDisplayName: string;
  LastSeenDisplayNameType: number;
  iconPath: string;
  crossSaveOverride: number;
  applicableMembershipTypes: number[];
  isPublic: boolean;
  membershipType: number;
  membershipId: string;
  displayName: string;
  bungieGlobalDisplayName: string;
  bungieGlobalDisplayNameCode: number;
}

interface Profile {
  userInfo: {
    crossSaveOverride: number;
    applicableMembershipTypes: number[];
    isPublic: boolean;
    membershipType: number;
    membershipId: string;
    displayName: string;
    bungieGlobalDisplayName: string;
    bungieGlobalDisplayNameCode: number;
  };
  dateLastPlayed: string;
  versionsOwned: number;
  characterIds: string[];
  seasonHashes: number[];
  eventCardHashesOwned: string[];
  currentSeasonHash: number;
  currentSeasonRewardPowerCap: number;
  currentGuardianRank: number;
  lifetimeHighestGuardianRank: number;
  renewedGuardianRank: number;
}
interface CharacterData {
  membershipId: string;
  membershipType: number;
  characterId: string;
  dateLastPlayed: string;
  minutesPlayedThisSession: string;
  minutesPlayedTotal: string;
  light: number;
  stats: any;
  raceHash: number;
  genderHash: number;
  classHash: number;
  raceType: number;
  classType: number;
  genderType: number;
  emblemPath: string;
  emblemBackgroundPath: string;
  emblemHash: number;
  emblemColor: any;
  levelProgression: any;
  baseCharacterLevel: number;
  percentToNextLevel: number;
  titleRecordHash: number;
}

interface CharactersList {
  [key: string]: CharacterData | undefined;
}

interface UserName {
  displayName: string;
  membershipId: string;
  membershipType: number;
  membershipTypeDisplayName: string;
  membershipTypeIconPath: string;
}
interface User {
  displayName: string;
  displayNameCode: number;
  membershipId: string;
  membershipType: number;
  emblemPath: string;
  light: number;
  names: UserName[];
  characters?: CharacterData[] | undefined;
}
interface Activity {
  period: string;
  activityDetails: {
    referenceId: number;
    directorActivityHash: number;
    instanceId: string;
    mode: number;
    modes: any[];
    isPrivate: boolean;
    membershipType: number;
  };
  values: {
    assists: any;
    completed: any;
    deaths: any;
    kills: any;
    opponentsDefeated: any;
    efficiency: any;
    killsDeathsRatio: any;
    killsDeathsAssists: any;
    score: any;
    activityDurationSeconds: any;
    team: any;
    completionReason: any;
    fireteamId: any;
    startSeconds: any;
    timePlayedSeconds: {
      basic: { value: number; displayValue: string };
    };
    playerCount: any;
    teamScore: any;
  };
}

export const userRouter = createTRPCRouter({
  getUserByGlobalName: publicProcedure
    .input(
      z.object({
        displayName: z.string(),
        page: z.number().default(1).optional(),
      }),
    )
    .mutation(async ({ input }): Promise<User[]> => {
      const data = await fetchBungie<Response>({
        endpoint: `/User/Search/GlobalName/${input.page ?? 0}/`,
        data: {
          displayNamePrefix: input.displayName,
        },
      });

      let users = [] as User[];

      for (const result of data.response.searchResults) {
        const membership = result.destinyMemberships[0];

        const names = result.destinyMemberships.map((membership) => ({
          displayName: membership.displayName,
          membershipId: membership.membershipId,
          membershipType: membership.membershipType,
          membershipTypeDisplayName: getBungieMembershipType(
            membership.membershipType,
          ),
          membershipTypeIconPath: membership.iconPath,
        }));

        if (!membership) continue;

        const { membershipId, membershipType } = membership;
        const profileReq = await fetchBungie<{
          responseMintedTimestamp: string;
          secondaryComponentsMintedTimestamp: string;
          profile: { data: Profile; privacy: number };
          characters: { data: CharactersList; privacy: number };
        }>({
          endpoint: `/Destiny2/${membershipType}/Profile/${membershipId}/?components=100,200`,
        });
        const displayName =
          profileReq.response.profile.data.userInfo.displayName;

        if (!displayName) continue;

        const characters = [] as CharacterData[];
        for (const characterId of profileReq.response.profile.data
          .characterIds) {
          const character = profileReq.response.characters.data[characterId];

          if (!character) continue;

          characters.push(character);
        }
        const firstCharacterId = characters[0];

        let highestLight = 0;

        for (const character of characters) {
          if (character?.light && character.light > highestLight) {
            highestLight = character.light;
          }
        }

        if (!firstCharacterId) continue;

        const character =
          profileReq.response.characters.data[firstCharacterId.characterId];

        if (!character) continue;

        const { emblemBackgroundPath, light } = character;

        users.push({
          displayName,
          displayNameCode: result.bungieGlobalDisplayNameCode,
          membershipId,
          membershipType,
          emblemPath: emblemBackgroundPath,
          light: highestLight ?? light,
          names: names,
          characters,
        });
      }

      return users;
    }),
  getUserOnslaughtHistory: publicProcedure
    .input(
      z.object({
        membershipId: z.string(),
        membershipType: z.number(),
        charactersIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ input }) => {
      const onslaughtHashs = [
        3439345485, //vostok
        2295195925, //midtown
        887771978, //mothyards
      ];
      const legendOnslaughterHashs = [
        2064836415, //midtown
        447898400, //mothyards
        264092439, //vostok
      ];
      const { membershipId, membershipType, charactersIds } = input;

      let activitiesList = [] as Activity[];
      for (const characterId of charactersIds) {
        if (!characterId) continue;
        const history = await fetchBungie<{
          activities: Activity[];
          characters: any[];
          equipment: any[];
          inventory: any[];
          progressions: any[];
          stats: any[];
          status: any[];
        }>({
          endpoint: `/Destiny2/${membershipType}/Account/${membershipId}/Character/${characterId}/Stats/Activities/?mode=86&count=250`,
        });
        const activities = history.response.activities;
        if (!activities) continue;
        const onslaughtActivities = activities.filter(
          (activity) =>
            onslaughtHashs.includes(activity.activityDetails.referenceId) ||
            legendOnslaughterHashs.includes(
              activity.activityDetails.referenceId,
            ),
        );

        activitiesList.push(...onslaughtActivities);
      }
      
      // console.log(activitiesList);
      return activitiesList.sort((a, b) => {
        return (
          new Date(b.period).getTime() - new Date(a.period).getTime()
        );
      })
    }),
});
