import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import fetchBungie from "~/utis/fetchBungie";


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

export const userRouter = createTRPCRouter({
  getUserByGlobalName: publicProcedure
    .input(
      z.object({
        displayName: z.string(),
        page: z.number().default(1).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const data = await fetchBungie<Response>({
        endpoint: `/User/Search/GlobalName/${input.page ?? 0}/`,
        data: {
          displayNamePrefix: input.displayName,
        },
      });

    for(const result of data.response.searchResults) {    

      const membership = result.destinyMemberships[0];
      if(!membership) continue;
      const { membershipId, membershipType } = membership;
      const profileReq = await fetchBungie({
        endpoint: `/User/GetMembershipsById/${membershipId}/${membershipType}/ `,
      });
      console.log(profileReq.response.destinyMemberships[0]);
    }

      return data;
    }),
});
