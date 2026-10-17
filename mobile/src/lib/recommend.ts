import { STUDY_SPOTS } from "../data/spots";
import type { StudySpot } from "../types";

function scoreSpot(spot: StudySpot, prompt: string): number {
  const p = prompt.toLowerCase();
  let score = spot.rating;

  if (/(quiet|silent|focus|library)/.test(p)) {
    if (spot.noise === "quiet") score += 3;
    if (spot.noise === "loud") score -= 2;
  }
  if (/(outlet|power|plug|charge)/.test(p)) {
    if (spot.outlets === "every-table") score += 3;
    if (spot.outlets === "none") score -= 2;
  }
  if (/(wifi|internet|fast)/.test(p)) {
    if (spot.wifi === "fast") score += 2;
    if (spot.wifi === "slow") score -= 1;
  }
  if (/(campus|uw|close|near)/.test(p)) {
    if (spot.tags.includes("campus")) score += 1.5;
  }
  if (/(late|night|evening)/.test(p)) {
    if (spot.tags.includes("late") || /midnight|10pm|24/.test(spot.hours))
      score += 2;
  }
  if (/(social|friend|group|chatter|busy)/.test(p)) {
    if (spot.noise === "chatter" || spot.noise === "loud") score += 1.5;
  }
  if (/(cozy|cute|aesthetic|vibe)/.test(p)) {
    if (spot.tags.includes("aesthetic") || spot.tags.includes("cozy"))
      score += 1.5;
  }
  if (/(cheap|free|budget)/.test(p) && spot.price === "$") score += 1;

  return score;
}

export function recommendSpot(prompt: string): {
  spot: StudySpot;
  reason: string;
} {
  const ranked = [...STUDY_SPOTS]
    .map((spot) => ({ spot, score: scoreSpot(spot, prompt) }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0]!;
  const parts: string[] = [];

  if (best.spot.noise === "quiet") parts.push("it's peaceful");
  if (best.spot.outlets === "every-table") parts.push("outlets at every table");
  if (best.spot.wifi === "fast") parts.push("fast wifi");
  if (best.spot.tags.includes("campus")) parts.push("right by campus");

  const reason =
    parts.length > 0
      ? `I picked ${best.spot.name} because ${parts.slice(0, 3).join(", ")}.`
      : `${best.spot.name} feels like a solid match for what you described.`;

  return { spot: best.spot, reason };
}

export function catReply(prompt: string): {
  text: string;
  recommendedSpotId: string;
} {
  const { spot, reason } = recommendSpot(prompt);
  return {
    text: `Purr… got it! ${reason} Want me to curl up there with you? ☕🐈`,
    recommendedSpotId: spot.id,
  };
}
