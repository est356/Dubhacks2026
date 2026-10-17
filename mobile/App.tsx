import {
  Fraunces_600SemiBold,
  Fraunces_700Bold,
  useFonts as useFraunces,
} from "@expo-google-fonts/fraunces";
import {
  SourceSans3_400Regular,
  SourceSans3_600SemiBold,
  useFonts as useSourceSans,
} from "@expo-google-fonts/source-sans-3";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import CatChatModal from "./src/components/CatChatModal";
import FilterBar from "./src/components/FilterBar";
import FriendFeed from "./src/components/FriendFeed";
import MapPanel from "./src/components/MapPanel";
import SessionsScreen from "./src/components/SessionsScreen";
import SpotDetailSheet from "./src/components/SpotDetailSheet";
import { STUDY_SPOTS } from "./src/data/spots";
import { DEFAULT_FILTERS, filterSpots } from "./src/lib/filters";
import {
  addSession,
  getFavorites,
  getRatings,
  getSessions,
  toggleFavorite,
  upsertRating,
} from "./src/lib/storage";
import { colors, spacing } from "./src/theme";
import type {
  SpotFilters,
  SpotRating,
  StudySession,
  TabKey,
} from "./src/types";

export default function App() {
  const [frauncesLoaded] = useFraunces({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
  });
  const [sansLoaded] = useSourceSans({
    SourceSans3_400Regular,
    SourceSans3_600SemiBold,
  });

  const [tab, setTab] = useState<TabKey>("map");
  const [filters, setFilters] = useState<SpotFilters>(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [ratings, setRatings] = useState<SpotRating[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);

  useEffect(() => {
    void (async () => {
      setFavorites(await getFavorites());
      setRatings(await getRatings());
      setSessions(await getSessions());
    })();
  }, []);

  const spots = useMemo(
    () => filterSpots(STUDY_SPOTS, filters),
    [filters],
  );
  const selected = STUDY_SPOTS.find((s) => s.id === selectedId) ?? null;
  const selectedRating = ratings.find((r) => r.spotId === selectedId);

  function selectSpot(id: string) {
    setSelectedId(id);
    setTab("map");
  }

  if (!frauncesLoaded || !sansLoaded) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.amber} />
      </View>
    );
  }

  const shell = (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <StatusBar style="dark" />
        <View style={styles.brand}>
          <View style={styles.mark}>
            <Text style={styles.markMug}>☕</Text>
            <Text style={styles.markCat}>🐈</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.brandName}>Catfe</Text>
            <Text style={styles.brandTag}>Find your purrfect study spot</Text>
          </View>
          <Pressable style={styles.catFab} onPress={() => setChatOpen(true)}>
            <Text style={styles.catFabText}>Ask the Cat</Text>
          </Pressable>
        </View>

        <View style={styles.body}>
          {tab === "map" ? (
            <View style={styles.mapPane}>
              <MapPanel
                spots={spots}
                selectedId={selectedId}
                onSelect={selectSpot}
              />
              <View style={styles.filterOverlay} pointerEvents="box-none">
                <Pressable
                  style={styles.filterToggle}
                  onPress={() => setFiltersOpen((v) => !v)}
                >
                  <Text style={styles.filterToggleText}>
                    {filtersOpen ? "Hide filters" : "Filters"}
                  </Text>
                </Pressable>
                {filtersOpen ? (
                  <FilterBar
                    filters={filters}
                    onChange={setFilters}
                    resultCount={spots.length}
                  />
                ) : null}
              </View>
              <SpotDetailSheet
                spot={selected}
                isFavorite={!!selectedId && favorites.includes(selectedId)}
                rating={selectedRating}
                onToggleFavorite={async () => {
                  if (!selectedId) return;
                  setFavorites(await toggleFavorite(selectedId));
                }}
                onRate={async (stars) => {
                  if (!selectedId) return;
                  setRatings(await upsertRating({ spotId: selectedId, stars }));
                }}
                onClose={() => setSelectedId(null)}
              />
            </View>
          ) : null}

          {tab === "friends" ? (
            <FriendFeed onJumpToSpot={selectSpot} />
          ) : null}

          {tab === "sessions" ? (
            <SessionsScreen
              sessions={sessions}
              defaultSpotId={selectedId}
              onSave={async (session) => {
                setSessions(await addSession(session));
              }}
            />
          ) : null}
        </View>

        <View style={styles.tabBar}>
          {(
            [
              ["map", "Map"],
              ["friends", "Friends"],
              ["sessions", "Sessions"],
            ] as const
          ).map(([key, label]) => {
            const active = tab === key;
            return (
              <Pressable
                key={key}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => setTab(key)}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <CatChatModal
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          onRecommend={(id) => {
            selectSpot(id);
            setChatOpen(false);
          }}
        />
      </SafeAreaView>
  );

  return (
    <SafeAreaProvider>
      {Platform.OS === "web" ? (
        <View style={styles.webStage}>
          <View style={styles.phoneFrame}>{shell}</View>
        </View>
      ) : (
        shell
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.foam,
  },
  webStage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#c9d6cb",
    paddingVertical: 16,
  },
  phoneFrame: {
    width: "100%",
    maxWidth: 430,
    height: "100%",
    maxHeight: 900,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(26,47,35,0.18)",
    backgroundColor: "#e8f1e9",
    shadowColor: "#1a2f23",
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  safe: {
    flex: 1,
    backgroundColor: "#e8f1e9",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  mark: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#efe4d4",
    alignItems: "center",
    justifyContent: "center",
  },
  markMug: { fontSize: 22 },
  markCat: {
    position: "absolute",
    right: -2,
    top: -4,
    fontSize: 14,
  },
  brandName: {
    fontSize: 28,
    color: colors.ink,
    fontFamily: "Fraunces_700Bold",
    lineHeight: 32,
  },
  brandTag: {
    color: colors.inkSoft,
    fontSize: 13,
    fontFamily: "SourceSans3_400Regular",
  },
  catFab: {
    backgroundColor: colors.ink,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  catFabText: {
    color: colors.foam,
    fontWeight: "700",
    fontFamily: "SourceSans3_600SemiBold",
  },
  body: { flex: 1, minHeight: 0 },
  mapPane: { flex: 1 },
  filterOverlay: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.md,
    right: spacing.md,
    gap: 8,
  },
  filterToggle: {
    alignSelf: "flex-start",
    backgroundColor: colors.ink,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterToggleText: { color: colors.foam, fontWeight: "700", fontSize: 12 },
  tabBar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingTop: 8,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: "rgba(255,250,244,0.92)",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 14,
  },
  tabActive: { backgroundColor: colors.sage },
  tabText: {
    color: colors.inkSoft,
    fontWeight: "600",
    fontFamily: "SourceSans3_600SemiBold",
  },
  tabTextActive: { color: colors.ink },
});
