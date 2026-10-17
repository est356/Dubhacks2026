"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { STUDY_SPOTS } from "@/data/spots";
import { DEFAULT_FILTERS, filterSpots } from "@/lib/filters";
import {
  addSession,
  getFavorites,
  getRatings,
  getSessions,
  toggleFavorite,
  upsertRating,
} from "@/lib/storage";
import type { SpotFilters, SpotRating, StudySession } from "@/types";
import FilterBar from "./FilterBar";
import FriendFeed from "./FriendFeed";
import CatChat from "./CatChat";
import SessionLogger from "./SessionLogger";
import SpotDetail from "./SpotDetail";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="map-loading">Loading map…</div>,
});

type SideTab = "friends" | "sessions";

export default function AppShell() {
  const [filters, setFilters] = useState<SpotFilters>(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [ratings, setRatings] = useState<SpotRating[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [sideTab, setSideTab] = useState<SideTab>("friends");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setFavorites(getFavorites());
    setRatings(getRatings());
    setSessions(getSessions());
    setHydrated(true);
  }, []);

  const spots = useMemo(
    () => filterSpots(STUDY_SPOTS, filters),
    [filters],
  );

  const selected = STUDY_SPOTS.find((s) => s.id === selectedId) ?? null;
  const selectedRating = ratings.find((r) => r.spotId === selectedId);

  function selectSpot(id: string) {
    setSelectedId(id);
  }

  function handleToggleFavorite() {
    if (!selectedId) return;
    setFavorites(toggleFavorite(selectedId));
  }

  function handleRate(stars: number) {
    if (!selectedId) return;
    setRatings(upsertRating({ spotId: selectedId, stars }));
  }

  function handleSaveSession(session: StudySession) {
    setSessions(addSession(session));
  }

  return (
    <div className="app-shell">
      <header className="brand-bar">
        <div className="brand-bar__mark" aria-hidden>
          <span className="brand-bar__mug">☕</span>
          <span className="brand-bar__cat">🐈</span>
        </div>
        <div className="brand-bar__text">
          <p className="brand-bar__name">Catfe</p>
          <p className="brand-bar__tag">Find your purrfect study spot</p>
        </div>
        <button
          type="button"
          className="cat-fab"
          onClick={() => setChatOpen(true)}
          aria-label="Open AI Cat chatbot"
        >
          Ask the Cat
        </button>
      </header>

      <div className="app-shell__main">
        <div className="map-stage">
          <div className="map-stage__filters">
            <FilterBar
              filters={filters}
              onChange={setFilters}
              resultCount={spots.length}
            />
          </div>
          <div className="map-stage__canvas">
            {hydrated ? (
              <MapView
                spots={spots}
                selectedId={selectedId}
                onSelect={selectSpot}
                favorites={favorites}
              />
            ) : (
              <div className="map-loading">Loading map…</div>
            )}
          </div>
          <SpotDetail
            spot={selected}
            isFavorite={!!selectedId && favorites.includes(selectedId)}
            rating={selectedRating}
            onToggleFavorite={handleToggleFavorite}
            onRate={handleRate}
            onClose={() => setSelectedId(null)}
          />
        </div>

        <aside className="side-rail">
          <div className="side-rail__tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={sideTab === "friends"}
              className={sideTab === "friends" ? "is-active" : ""}
              onClick={() => setSideTab("friends")}
            >
              Friends
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={sideTab === "sessions"}
              className={sideTab === "sessions" ? "is-active" : ""}
              onClick={() => setSideTab("sessions")}
            >
              Sessions
            </button>
          </div>
          {sideTab === "friends" ? (
            <FriendFeed onJumpToSpot={selectSpot} />
          ) : (
            <SessionLogger
              spots={STUDY_SPOTS}
              sessions={sessions}
              defaultSpotId={selectedId}
              onSave={handleSaveSession}
            />
          )}
        </aside>
      </div>

      <CatChat
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        onRecommend={(id) => {
          selectSpot(id);
          setChatOpen(false);
        }}
      />
    </div>
  );
}
