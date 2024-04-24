export default function getBungieMembershipType(membershipId: string | number) {
  switch (String(membershipId)) {
    case "0":
      return "Desconhecido";
    case "1":
      return "Xbox";
    case "2":
      return "PSN";
    case "3":
      return "Steam";
    case "4":
      return "Blizzard";
    case "5":
      return "Stadia";
    case "6":
      return "Epic Games";
    case "254":
      return "Bungie";
    default:
      return "Desconhecido";
  }
}
