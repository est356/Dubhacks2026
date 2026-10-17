import type { SpotFilters, StudySpot } from "@/types";

export const DEFAULT_FILTERS: SpotFilters = {
  query: "",
  wifi: "any",
  outlets: "any",
  noise: "any",
  minSeating: 1,
};

export function filterSpots(
  spots: StudySpot[],
  filters: SpotFilters,
): StudySpot[] {
  const q = filters.query.trim().toLowerCase();
  return spots.filter((spot) => {
    if (filters.wifi !== "any" && spot.wifi !== filters.wifi) return false;
    if (filters.outlets !== "any" && spot.outlets !== filters.outlets)
      return false;
    if (filters.noise !== "any" && spot.noise !== filters.noise) return false;
    if (spot.seating < filters.minSeating) return false;
    if (!q) return true;
    const hay = `${spot.name} ${spot.address} ${spot.vibe} ${spot.tags.join(" ")}`.toLowerCase();
    return hay.includes(q);
  });
}
