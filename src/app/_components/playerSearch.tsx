"use client";
import { Button, TextInput } from "@mantine/core";
import React from "react";
import { api } from "~/trpc/react";

type DestinyMembership = any;

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

interface SearchResult {
  displayName: string;
  membershipId: string;
  membershipType: number;
  emblemPath: string;
  light: number;
  names: {
    displayName: string;
    membershipId: string;
    membershipType: number;
    membershipTypeDisplayName: string;
    membershipTypeIconPath: string;
  }[];
  characters?: CharacterData[] | undefined;
}

const PlayerCard = ({
  player,
  onClick,
}: {
  player: SearchResult;
  onClick?: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      key={player.membershipId}
      className="flex h-[5rem] w-[25rem] items-center rounded-md shadow-lg drop-shadow-xl"
      style={{
        backgroundImage: `url(https://www.bungie.net${player.emblemPath})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        paddingLeft: "4.8rem",
      }}
    >
      <div className="flex flex-grow items-center justify-between pr-2">
        <div className="py-2 text-2xl font-bold text-white">
          {player.displayName}
        </div>
        <div className="flex items-start py-2 text-4xl font-bold text-[#FFDA88]">
          <span className="mb-auto text-lg leading-none">✧</span>
          {player.light}
        </div>
      </div>
    </button>
  );
};
export default function PlayerSearch() {
  const userSearchMutation = api.bungie.user.getUserByGlobalName.useMutation();
  const userActivityMutation =
    api.bungie.user.getUserOnslaughtHistory.useMutation();

  const [name, setName] = React.useState("");
  const [playerList, setPlayerList] = React.useState<SearchResult[]>([]);

  React.useEffect(() => {
    if (userSearchMutation.data) {
      setPlayerList(userSearchMutation.data);
    }
  }, [userSearchMutation.data]);

  return (
    <div>
      <div className="flex w-[25rem] items-end gap-2">
        <TextInput
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Procurar Jogador"
          label="Nome do Jogador"
          className="flex-grow"
        />
        <Button
          onClick={() => {
            if (!name) return;
            userSearchMutation.mutate({ displayName: name });
          }}
          loading={userSearchMutation.isPending}
        >
          Pesquisar
        </Button>
      </div>

      {playerList.length > 0 && (
        <div className="flex flex-col gap-2">
          {playerList.map((player) => (
            <PlayerCard
              key={player.membershipId}
              player={player}
              onClick={() => {
                if (!player.characters) return;
                userActivityMutation.mutate({
                  membershipId: player.membershipId,
                  membershipType: player.membershipType,
                  charactersIds: player.characters.map((c) => c.characterId),
                });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
