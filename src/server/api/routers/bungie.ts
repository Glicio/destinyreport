
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { posts } from "~/server/db/schema";
import { userRouter } from "./bungie/user";

export const bungieRouter = createTRPCRouter({
  user: userRouter,
})
