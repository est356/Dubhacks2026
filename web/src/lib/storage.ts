"use client";

import type { SpotRating, StudySession } from "@/types";

const FAVORITES_KEY = "catfe:favorites";
const RATINGS_KEY = "catfe:ratings";
const SESSIONS_KEY = "catfe:sessions";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getFavorites(): string[] {
  return readJson<string[]>(FAVORITES_KEY, []);
}

export function toggleFavorite(spotId: string): string[] {
  const current = getFavorites();
  const next = current.includes(spotId)
    ? current.filter((id) => id !== spotId)
    : [...current, spotId];
  writeJson(FAVORITES_KEY, next);
  return next;
}

export function getRatings(): SpotRating[] {
  return readJson<SpotRating[]>(RATINGS_KEY, []);
}

export function upsertRating(rating: SpotRating): SpotRating[] {
  const current = getRatings().filter((r) => r.spotId !== rating.spotId);
  const next = [...current, rating];
  writeJson(RATINGS_KEY, next);
  return next;
}

export function getSessions(): StudySession[] {
  return readJson<StudySession[]>(SESSIONS_KEY, []);
}

export function addSession(session: StudySession): StudySession[] {
  const next = [session, ...getSessions()];
  writeJson(SESSIONS_KEY, next);
  return next;
}
