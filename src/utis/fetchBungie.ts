import { TRPCError } from "@trpc/server";
import { z } from "zod";

const bungieResponseParser = z.object({
  Response: z.any().optional(),
  ErrorCode: z.number(),
  ThrottleSeconds: z.number(),
  ErrorStatus: z.string(),
  Message: z.string(),
  MessageData: z.any().optional(),
});
async function fetchBungie<T>({
  endpoint,
  data,
}: {
  endpoint: string;
  data?: { [key: string]: string };
}) {
  const BUNGIE_API_ROOT = "https://www.bungie.net/Platform";

  if (!process.env.BUNGIE_API_KEY) {
    throw new Error("BUNGIE_API_KEY is not defined");
  }

  const HEADERS: HeadersInit = {
    "X-API-Key": process.env.BUNGIE_API_KEY,
  };
  try {
    const req = await fetch(`${BUNGIE_API_ROOT}${endpoint}`, {
      headers: HEADERS,
      method: data ? "POST" : "GET",
      body: data ? JSON.stringify(data) : undefined,
    });
    const res = await req.json();

    try {
      const parsed = bungieResponseParser.parse(res);

      const { Response, ...rest } = parsed;

      return { ...rest, response: parsed.Response as T };
    } catch (e) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error parsing Bungie API response",
      });
    }
  } catch (e) {
    console.error(e)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "erro da bungie"
    })
  }
}

export default fetchBungie;
