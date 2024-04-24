"use client";
import React from "react";
import { api } from "~/trpc/react";

type DestinyMembership = any;

interface SearchResult {
  bungieGlobalDisplayName: string;
  bungieGlobalDisplayNameCode: number;
  bungieNetMembershipId: string;
  destinyMemberships: DestinyMembership[];
}

export default function PlayerSearch() {
  const userSearchMutation = api.bungie.user.getUserByGlobalName.useMutation();

  const [name, setName] = React.useState("");
  const [playerList, setPlayerList] = React.useState<SearchResult[]>([]);

  React.useEffect(() => {
    if (userSearchMutation.data) {
      setPlayerList(userSearchMutation.data.response.searchResults);
    }
  }, [userSearchMutation.data]);

  return (
    <div>
      <input
        value={name}
        onChange={(e) => {
          setName(e.target.value);
        }}
        type="text"
        className="text-black"
        placeholder="Search for a player"
      />
      <button
        onClick={() => {
          if (!name) return;
          userSearchMutation.mutate({ displayName: name });
        }}
      >
        Search
      </button>

      {userSearchMutation.error && (
        <div>{userSearchMutation.error.message}</div>
      )}
      {playerList.length > 0 && (
        <div>
          {playerList.map((player) => (
            <div key={player.bungieNetMembershipId}>
              {player.bungieGlobalDisplayName}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
