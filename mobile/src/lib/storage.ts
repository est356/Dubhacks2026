import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SpotRating, StudySession } from "../types";

const FAVORITES_KEY = "catfe:favorites";
const RATINGS_KEY = "catfe:ratings";
const SESSIONS_KEY = "catfe:sessions";

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(key: string, value: T) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function getFavorites(): Promise<string[]> {
  return readJson<string[]>(FAVORITES_KEY, []);
}

export async function toggleFavorite(spotId: string): Promise<string[]> {
  const current = await getFavorites();
  const next = current.includes(spotId)
    ? current.filter((id) => id !== spotId)
    : [...current, spotId];
  await writeJson(FAVORITES_KEY, next);
  return next;
}

export async function getRatings(): Promise<SpotRating[]> {
  return readJson<SpotRating[]>(RATINGS_KEY, []);
}

export async function upsertRating(rating: SpotRating): Promise<SpotRating[]> {
  const current = (await getRatings()).filter((r) => r.spotId !== rating.spotId);
  const next = [...current, rating];
  await writeJson(RATINGS_KEY, next);
  return next;
}

export async function getSessions(): Promise<StudySession[]> {
  return readJson<StudySession[]>(SESSIONS_KEY, []);
}

export async function addSession(
  session: StudySession,
): Promise<StudySession[]> {
  const next = [session, ...(await getSessions())];
  await writeJson(SESSIONS_KEY, next);
  return next;
}
