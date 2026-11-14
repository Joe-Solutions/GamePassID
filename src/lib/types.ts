export type PlayerCategory = "casual" | "amateur" | "student";
export type PlayerStatus = "registered" | "licensed" | "inactive";

export interface Game {
  id: number;
  name: string;
  slug: string;
  active: boolean;
}

export interface Encoder {
  id: number;
  username: string;
  displayName: string;
}

export const OTHERS_GAME_SLUG = "others";

export interface Player {
  id: number;
  licenseId: string;
  fullName: string;
  birthdate: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  category: PlayerCategory;
  gameId: number;
  gameName?: string;
  gameSlug?: string;
  gameOther: string | null;
  photoPath: string | null;
  status: PlayerStatus;
  encodedBy: number | null;
  encoderName?: string | null;
  createdAt: string;
}

export function displayGameLabel(player: {
  gameName?: string;
  gameSlug?: string;
  gameOther?: string | null;
}): string {
  const base = player.gameName ?? "—";
  if (player.gameSlug === OTHERS_GAME_SLUG && player.gameOther) {
    return `Others — ${player.gameOther}`;
  }
  return base;
}

export const PLAYER_CATEGORIES: {
  value: PlayerCategory;
  label: string;
  description: string;
}[] = [
  {
    value: "casual",
    label: "Casual Player",
    description: "Recreational play and friendly competition",
  },
  {
    value: "amateur",
    label: "Amateur Player",
    description: "Competitive amateur tournament circuit",
  },
  {
    value: "student",
    label: "Student Player",
    description: "Enrolled students in school or academy programs",
  },
];

export function categoryLabel(category: PlayerCategory): string {
  return (
    PLAYER_CATEGORIES.find((c) => c.value === category)?.label ?? category
  );
}

export function statusLabel(status: PlayerStatus): string {
  switch (status) {
    case "registered":
      return "Player is not yet licensed";
    case "licensed":
      return "Licensed Player";
    case "inactive":
      return "Inactive";
    default:
      return status;
  }
}

export function playerIdLabel(status: PlayerStatus): string {
  return status === "licensed" ? "Licensed ID" : "Registration ID";
}

export function playerCardEyebrow(status: PlayerStatus): string {
  return status === "licensed"
    ? "Official player license"
    : "Player registration";
}
