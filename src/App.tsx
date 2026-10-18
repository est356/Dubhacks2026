import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// [google-maps] real map + Places search live in their own files (not Figma-generated)
import StudyMap, { hasGoogleMapsKey } from "./components/StudyMap";
// [supabase] guest auth + community data live in their own files (not Figma-generated)
import { useGuestAuth } from "./lib/auth";
import {
  addRankedCafe, addRating, fetchSpots, getLeaderboard, getRecentSessions, logStudySession, mergeSpots, reviewToNumbers,
  type CommunitySpot, type LeaderboardRow, type StudySessionRow,
} from "./lib/db";
import { searchPlacesByText, type LatLng, type PlaceSpot } from "./lib/places";
import DisplayNamePrompt from "./components/DisplayNamePrompt";
// [hops-gemini] Hops chat talks to Gemini via the Supabase Edge Function "hops-chat"
import { askHops } from "./lib/hopsChat";
import { toSpot, type DbSpot } from "./lib/db";

type Spot = {
  id: number;
  name: string;
  area: string;
  walk: string;
  type: "coffee" | "library" | "outdoors";
  tags: string[];
  note: string;
  image: string;
  color: string;
  position: { left: string; top: string };
  rating: number;
  reviews: number;
  highlights: string[];
  openEarly: boolean;
  openLate: boolean;
  hours: string;
  address: string;
  communityInput?: {
    busyDay: string;
    busyness: number[];
    price: string;
  };
};

const spots: Spot[] = [
  {
    id: 1,
    name: "Moss & Mugs",
    area: "Oak Street",
    walk: "4 min",
    type: "coffee",
    tags: ["outlets", "quiet"],
    note: "Window seats + cardamom buns",
    image:
      "https://images.unsplash.com/photo-1758610605872-3195caed0bdd?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=900&h=700",
    color: "#e95743",
    position: { left: "22%", top: "34%" },
    rating: 4.8,
    reviews: 86,
    highlights: ["great outlets", "quiet", "fast wifi"],
    openEarly: true,
    openLate: true,
    hours: "7am–10pm",
    address: "142 Oak Street",
  },
  {
    id: 2,
    name: "The Reading Room",
    area: "Cedar Library",
    walk: "8 min",
    type: "library",
    tags: ["silent", "wifi"],
    note: "Best desk lamps in town",
    image:
      "https://images.unsplash.com/photo-1694315643310-5a42072aa014?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=900&h=700",
    color: "#475f9b",
    position: { left: "69%", top: "24%" },
    rating: 4.9,
    reviews: 124,
    highlights: ["very quiet", "lots of seats", "free"],
    openEarly: true,
    openLate: false,
    hours: "8am–8pm",
    address: "88 Cedar Avenue",
  },
  {
    id: 3,
    name: "Juniper Coffee",
    area: "Little Market",
    walk: "12 min",
    type: "coffee",
    tags: ["outlets", "late"],
    note: "Big tables, mellow playlists",
    image:
      "https://images.unsplash.com/photo-1669846125517-6ea5fd9dc9af?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=900&h=700",
    color: "#597d47",
    position: { left: "58%", top: "56%" },
    rating: 4.6,
    reviews: 53,
    highlights: ["fast wifi", "open late", "moderate"],
    openEarly: false,
    openLate: true,
    hours: "9am–11pm",
    address: "306 Little Market Lane",
  },
  {
    id: 4,
    name: "Fern Hill",
    area: "Botanic Walk",
    walk: "15 min",
    type: "outdoors",
    tags: ["sunny", "quiet"],
    note: "Bring a book and a blanket",
    image:
      "https://images.unsplash.com/photo-1775480393107-666e3cd44ab8?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=900&h=700",
    color: "#d69232",
    position: { left: "28%", top: "70%" },
    rating: 4.4,
    reviews: 31,
    highlights: ["no outlets", "peaceful", "spacious"],
    openEarly: true,
    openLate: false,
    hours: "6am–8pm",
    address: "12 Botanic Walk",
  },
];

type PlaceResult = {
  name: string;
  address: string;
  area: string;
  type: Spot["type"];
  position: Spot["position"];
  hours: string;
  openEarly: boolean;
  openLate: boolean;
  placeId?: string;
  dbId?: string;
  location?: LatLng;
};

function asPlaceResult(spot: PlaceSpot): PlaceResult {
  return {
    name: spot.name,
    address: spot.address,
    area: spot.area,
    type: spot.type,
    position: spot.position,
    hours: spot.hours,
    openEarly: spot.openEarly,
    openLate: spot.openLate,
    placeId: spot.placeId,
    dbId: spot.dbId,
    location: spot.location,
  };
}

function usePlaceSuggestions(query: string, selectedName: string | undefined, known: PlaceSpot[]) {
  const [remote, setRemote] = useState<PlaceSpot[]>([]);

  useEffect(() => {
    const text = query.trim();
    if (text.length < 1 || selectedName === query) {
      setRemote([]);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      searchPlacesByText(text)
        .then((results) => {
          if (!cancelled) setRemote(results);
        })
        .catch((error) => {
          console.warn("[places] text search failed:", error);
          if (!cancelled) setRemote([]);
        });
    }, 280);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, selectedName]);

  return useMemo(() => {
    const text = query.trim().toLowerCase();
    if (text.length < 1 || selectedName === query) return [];
    const local = known.filter(
      (spot) =>
        Boolean(spot.placeId || spot.location || spot.dbId) &&
        `${spot.name} ${spot.address} ${spot.area}`.toLowerCase().includes(text),
    );
    const seen = new Set<string>();
    const merged: PlaceResult[] = [];
    for (const spot of [...local, ...remote]) {
      const key = (spot.placeId || spot.name).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(asPlaceResult(spot));
    }
    return merged;
  }, [query, selectedName, known, remote]);
}

const placeDirectory: PlaceResult[] = [
  ...spots.map(({ name, address, area, type, position, hours, openEarly, openLate }) => ({
    name,
    address,
    area,
    type,
    position,
    hours,
    openEarly,
    openLate,
  })),
  {
    name: "Paper Moon Café",
    address: "221 Willow Street",
    area: "North Loop",
    type: "coffee",
    position: { left: "76%", top: "66%" },
    hours: "7am–9pm",
    openEarly: true,
    openLate: false,
  },
  {
    name: "Sideshow Books",
    address: "504 Pico Boulevard",
    area: "Mid-City",
    type: "library",
    position: { left: "45%", top: "20%" },
    hours: "10am–10pm",
    openEarly: false,
    openLate: true,
  },
  {
    name: "Common Ground Coffee",
    address: "73 Garden Row",
    area: "Garden District",
    type: "coffee",
    position: { left: "67%", top: "43%" },
    hours: "6:30am–11pm",
    openEarly: true,
    openLate: true,
  },
  {
    name: "Atlas Study Hall",
    address: "19 College Way",
    area: "Old Town",
    type: "library",
    position: { left: "35%", top: "48%" },
    hours: "8am–12am",
    openEarly: true,
    openLate: true,
  },
];

type StudyProfile = {
  noise: string;
  outlets: string;
  seating: string;
  busyness: string;
  price: string;
  wifi: string;
  vibes: string[];
  review: string;
};

const studyProfiles: Record<number, StudyProfile> = {
  1: {
    noise: "quiet",
    outlets: "at every table",
    seating: "2–4 people",
    busyness: "busiest 11am–2pm",
    price: "$$ · $10–20",
    wifi: "fast",
    vibes: ["cozy", "focused", "warm light"],
    review: "The window counter is perfect for a long study block, and nobody minds if you stay awhile.",
  },
  2: {
    noise: "very quiet",
    outlets: "at a few tables",
    seating: "1–6 people",
    busyness: "calm after 3pm",
    price: "free",
    wifi: "fast",
    vibes: ["silent", "bookish", "spacious"],
    review: "Come for the desk lamps and deep-focus silence. The back room usually has an open seat.",
  },
  3: {
    noise: "chatter",
    outlets: "at every table",
    seating: "2–8 people",
    busyness: "busy 9am–12pm",
    price: "$$ · $10–20",
    wifi: "fast",
    vibes: ["social", "bright", "good playlists"],
    review: "Big communal tables make this the best choice for a group session or a working coffee date.",
  },
  4: {
    noise: "quiet",
    outlets: "no tables",
    seating: "1–5 people",
    busyness: "busier on weekends",
    price: "free",
    wifi: "none",
    vibes: ["sunny", "peaceful", "outdoors"],
    review: "Bring a charged laptop and a blanket. It is especially lovely before the afternoon crowd arrives.",
  },
};

function getStudyProfile(spot: Spot): StudyProfile {
  const established = studyProfiles[spot.id];
  if (established) {
    return {
      ...established,
      busyness: spot.communityInput
        ? `${spot.communityInput.busyDay.toLowerCase()} · community reported`
        : established.busyness,
      price: spot.communityInput
        ? `${spot.communityInput.price} · community reported`
        : established.price,
    };
  }
  return {
    noise: spot.highlights[0] || "chatter",
    outlets: spot.highlights[1] || "at a few tables",
    seating: "2–4 people",
    busyness: spot.communityInput
      ? `${spot.communityInput.busyDay.toLowerCase()} · community reported`
      : "moderate right now",
    price: spot.communityInput ? `${spot.communityInput.price} · community reported` : "$$ · $10–20",
    wifi: spot.highlights[2] || "medium",
    vibes: spot.highlights,
    review: spot.note,
  };
}

type Activity = {
  id: number;
  friendId: number;
  hours: string;
  place: string;
  subject: string;
  when: string;
};

const friends = [
  {
    id: 1,
    name: "You",
    hours: "8.5h",
    sessions: 4,
    image:
      "https://images.unsplash.com/photo-1653762381632-2945469edb7b?crop=faces&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=240&h=300",
    color: "#e35345",
  },
  {
    id: 2,
    name: "Maya",
    hours: "12h",
    sessions: 6,
    image:
      "https://images.unsplash.com/photo-1653762378248-db45a1285697?crop=faces&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=240&h=300",
    color: "#577b50",
  },
  {
    id: 3,
    name: "Leo",
    hours: "6h",
    sessions: 3,
    image:
      "https://images.unsplash.com/photo-1629794138560-46d2815a6d79?crop=faces&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=240&h=300",
    color: "#4d6892",
  },
  {
    id: 4,
    name: "Noah",
    hours: "9.5h",
    sessions: 5,
    image:
      "https://images.unsplash.com/photo-1542458579-bc6f69b5ce6b?crop=faces&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=240&h=300",
    color: "#c3863c",
  },
];

const CIRCLE_COLORS = ["#e35345", "#577b50", "#4d6892", "#c3863c", "#b94d74"];

function formatStudyHours(total: number) {
  const value = Number(total);
  if (!Number.isFinite(value)) return "0h";
  const rounded = Math.round(value * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}h`;
}

function formatSessionWhen(iso: string) {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const minutes = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? "1 hr ago" : `${hours} hrs ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

const starterActivities: Activity[] = [
  { id: 1, friendId: 2, hours: "2.5", place: "Moss & Mugs", subject: "Biology notes", when: "18 min ago" },
  { id: 2, friendId: 3, hours: "1.5", place: "The Reading Room", subject: "Drafting an essay", when: "2 hrs ago" },
  { id: 3, friendId: 4, hours: "3", place: "Juniper Coffee", subject: "Design portfolio", when: "Yesterday" },
  { id: 4, friendId: 3, hours: "2", place: "Moss & Mugs", subject: "Problem set 4", when: "Yesterday" },
  { id: 5, friendId: 4, hours: "1", place: "The Reading Room", subject: "Flashcards", when: "2 days ago" },
];

const headerTaglines = [
  "let's find your new study spot!",
  "glad you're here!",
  "it's a great day for a coffee",
];

function getOpeningTaglineIndex() {
  const previous = Number(window.localStorage.getItem("study-hopper-tagline") ?? -1);
  const next = (previous + 1) % headerTaglines.length;
  window.localStorage.setItem("study-hopper-tagline", String(next));
  return next;
}

function Icon({
  name,
  size = 24,
}: {
  name: "coffee" | "library" | "outdoors" | "map" | "list" | "heart" | "plus" | "search" | "close" | "stamp";
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (name === "coffee")
    return (
      <svg {...common}>
        <path d="M5 8h11v6.2A3.8 3.8 0 0 1 12.2 18H8.8A3.8 3.8 0 0 1 5 14.2V8Z" />
        <path d="M16 10h1.4a2.1 2.1 0 0 1 0 4.2H16M7 4.5c1 1-.7 1.7.3 2.5M11 4c1.1 1.2-.7 1.7.3 2.7M4 20h15" />
      </svg>
    );
  if (name === "library")
    return (
      <svg {...common}>
        <path d="m3.5 8.2 8.5-4 8.5 4M5 9.5h14M6.5 10v7M10.2 10v7M13.8 10v7M17.5 10v7M4 18h16M3 20h18" />
      </svg>
    );
  if (name === "outdoors")
    return (
      <svg {...common}>
        <path d="M12 21v-7M12 16 8.5 13M12 17l3.5-3.5M12 4a4.3 4.3 0 0 0-4.2 5.2A3.7 3.7 0 0 0 9 16h6a3.5 3.5 0 0 0 1.4-6.7A4.4 4.4 0 0 0 12 4Z" />
      </svg>
    );
  if (name === "map")
    return (
      <svg {...common}>
        <path d="m3.5 6.5 5-2.5 7 2.5 5-2.5v14l-5 2-7-2.5-5 2.5v-14ZM8.5 4v13.5M15.5 6.5V20" />
      </svg>
    );
  if (name === "list")
    return (
      <svg {...common}>
        <path d="M9 6h11M9 12h11M9 18h11" />
        <circle cx="4.5" cy="6" r=".8" fill="currentColor" stroke="none" />
        <circle cx="4.5" cy="12" r=".8" fill="currentColor" stroke="none" />
        <circle cx="4.5" cy="18" r=".8" fill="currentColor" stroke="none" />
      </svg>
    );
  if (name === "heart")
    return (
      <svg {...common}>
        <path d="M20.5 8.8c0 5.2-8.5 10-8.5 10s-8.5-4.8-8.5-10A4.3 4.3 0 0 1 12 7.5a4.3 4.3 0 0 1 8.5 1.3Z" />
      </svg>
    );
  if (name === "plus")
    return (
      <svg {...common}>
        <path d="M12 4v16M4 12h16" />
      </svg>
    );
  if (name === "search")
    return (
      <svg {...common}>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 4 4" />
      </svg>
    );
  if (name === "stamp")
    return (
      <svg {...common}>
        <path d="M8.5 13.5c.4-1.8 1.6-2.8 1.6-5.2 0-2.1.5-4.3 1.9-4.3s1.9 2.2 1.9 4.3c0 2.4 1.2 3.4 1.6 5.2M6.5 14h11l1 3H5.5l1-3ZM5 19h14v2H5z" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="m5 5 14 14M19 5 5 19" />
    </svg>
  );
}

function Stamp({
  spot,
  active,
  onClick,
}: {
  spot: Spot;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={`map-stamp ${active ? "map-stamp--active" : ""}`}
      style={{
        left: spot.position.left,
        top: spot.position.top,
        color: spot.color,
        "--spot-color": spot.color,
      } as React.CSSProperties}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onClick();
      }}
      role="button"
      tabIndex={0}
      aria-label={`View ${spot.name}`}
    >
      <span className="stamp-photo">
        <img src={spot.image} alt="" />
      </span>
      <span className="stamp-type-badge">
        <Icon name={spot.type} size={12} />
      </span>
      <span className="stamp-name">{spot.name}</span>
    </div>
  );
}

function SpotCard({
  spot,
  stamped,
  favorite,
  onFavorite,
  onStamp,
}: {
  spot: Spot;
  stamped: boolean;
  favorite: boolean;
  onFavorite: () => void;
  onStamp: () => void;
}) {
  return (
    <article className="spot-card">
      <div className="photo-wrap">
        <img src={spot.image} alt={`${spot.name} study atmosphere`} />
        <span className="tape" />
        <span className="walk-badge">{spot.walk}</span>
      </div>
      <div className="spot-card__body">
        <div>
          <p className="eyebrow">{spot.area}</p>
          <h3>{spot.name}</h3>
          <p className="spot-rating"><b>★ {spot.rating}</b> <span>({spot.reviews})</span></p>
        </div>
        {stamped ? (
          <div className="list-place-actions">
            <span className="mini-visited" title="You saved this spot">SAVED!</span>
            <button
              className={`heart-button ${favorite ? "is-favorite" : ""}`}
              onClick={onFavorite}
              aria-label={favorite ? `Remove ${spot.name} from favorites` : `Favorite ${spot.name}`}
            >
              <Icon name="heart" size={21} />
            </button>
          </div>
        ) : (
          <button className="list-stamp-button" onClick={onStamp}>
            SAVE!
          </button>
        )}
        <p className="note">“{spot.note}”</p>
        <div className="tags">
          {spot.tags.map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>
      </div>
    </article>
  );
}

function PlaceTypeahead({
  label,
  query,
  onQueryChange,
  suggestions,
  onSelect,
  selected,
  error,
  required,
}: {
  label: string;
  query: string;
  onQueryChange: (value: string) => void;
  suggestions: PlaceResult[];
  onSelect: (place: PlaceResult) => void;
  selected: PlaceResult | null;
  error?: string;
  required?: boolean;
}) {
  return (
    <div className={`place-lookup ${error ? "has-error" : ""}`}>
      <label>
        {label} {required ? <span>required</span> : null}
        <div className="place-search-input">
          <Icon name="search" size={18} />
          <input
            autoComplete="off"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Start typing a place name..."
          />
        </div>
      </label>
      {suggestions.length > 0 && (
        <div className="place-suggestions">
          {suggestions.map((place) => (
            <button
              type="button"
              key={`${place.placeId ?? place.name}-${place.address}`}
              onClick={() => onSelect(place)}
            >
              <span className="suggestion-icon"><Icon name={place.type} size={19} /></span>
              <span><b>{place.name}</b><small>{place.address} · {place.area}</small></span>
              <strong>›</strong>
            </button>
          ))}
        </div>
      )}
      {selected && (
        <div className="selected-place">
          <span><Icon name={selected.type} size={24} /></span>
          <div>
            <b>{selected.name}</b>
            <p>{selected.address}</p>
            <small>{selected.area} · {selected.hours}</small>
          </div>
          <em>✓</em>
        </div>
      )}
      {error ? <p className="place-error">{error}</p> : null}
    </div>
  );
}

function FriendActivity({
  activities,
  sessions,
  leaderboardHours,
  leaderboardRows,
  youId,
  liveStats,
  selectedFriend,
  setSelectedFriend,
  logOpen,
  setLogOpen,
  onLog,
  onBack,
  logQuery,
  onLogQueryChange,
  logSuggestions,
  selectedLogPlace,
  onSelectLogPlace,
  logPlaceError,
}: {
  activities: Activity[];
  sessions: StudySessionRow[];
  leaderboardHours: Record<number, number>;
  leaderboardRows: LeaderboardRow[];
  youId?: string;
  liveStats: boolean;
  selectedFriend: string | null;
  setSelectedFriend: (id: string | null) => void;
  logOpen: boolean;
  setLogOpen: (open: boolean) => void;
  onLog: (event: React.FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
  logQuery: string;
  onLogQueryChange: (value: string) => void;
  logSuggestions: PlaceResult[];
  selectedLogPlace: PlaceResult | null;
  onSelectLogPlace: (place: PlaceResult) => void;
  logPlaceError: boolean;
}) {
  const localFriendId = friends.some((friend) => String(friend.id) === selectedFriend)
    ? Number(selectedFriend)
    : null;
  const filteredActivities = localFriendId
    ? activities.filter((activity) => activity.friendId === localFriendId)
    : activities;
  const visibleSessions = selectedFriend
    ? sessions.filter((session) => session.user_id === selectedFriend)
    : sessions;
  const activeFriend = friends.find((friend) => friend.id === localFriendId);
  const circle = liveStats
    ? leaderboardRows.map((row, index) => {
        const total = Number(row.total_hours);
        const isYou = row.user_id === youId;
        return {
          key: row.user_id,
          name: isYou ? "You" : row.display_name || "Student",
          hoursLabel: formatStudyHours(total),
          total,
          sessions: Number(row.session_count) || 0,
          image: undefined as string | undefined,
          color: CIRCLE_COLORS[index % CIRCLE_COLORS.length],
          isYou,
        };
      })
    : [...friends]
        .map((friend) => {
          const total = leaderboardHours[friend.id] ?? 0;
          return {
            key: String(friend.id),
            name: friend.name,
            hoursLabel: formatStudyHours(total),
            total,
            sessions: friend.sessions,
            image: friend.image,
            color: friend.color,
            isYou: friend.id === 1,
          };
        })
        .sort((a, b) => b.total - a.total);
  const leadingHours = Math.max(...circle.map((person) => person.total), 1);
  const selectedName = circle.find((person) => person.key === selectedFriend)?.name;

  return (
    <section className="friend-page">
      <header className="friend-header">
        <button className="back-button" onClick={onBack} aria-label="Back to study spots">←</button>
        <div>
          <p className="kicker">STUDY SIDE BY SIDE</p>
          <h1>Friend <span>Activity</span></h1>
        </div>
        <button className="log-session-button" onClick={() => setLogOpen(!logOpen)}>
          <Icon name="plus" size={17} /> Log
        </button>
      </header>

      <div className="swipe-note"><span>‹</span> swipe back to your map</div>

      {logOpen && (
        <form className="quick-log" onSubmit={onLog}>
          <div>
            <p className="kicker">TODAY'S STUDY LOG</p>
            <h2>What did you work on?</h2>
          </div>
          <label>
            <span>Hours</span>
            <input name="hours" type="number" min=".25" step=".25" defaultValue="1" required />
          </label>
          <PlaceTypeahead
            label="Spot"
            query={logQuery}
            onQueryChange={onLogQueryChange}
            suggestions={logSuggestions}
            selected={selectedLogPlace}
            onSelect={onSelectLogPlace}
            error={logPlaceError ? "Choose a place from the search results first." : undefined}
            required
          />
          <label className="log-subject">
            <span>What were you studying?</span>
            <input name="subject" placeholder="e.g. Chapter five" required />
          </label>
          <button type="submit">Stamp my log</button>
        </form>
      )}

      <div className="friend-scroll">
        <section className="study-circle">
          <div className="section-title">
            <div>
              <p className="kicker">YOUR STUDY CIRCLE</p>
              <h2>How everyone's doing</h2>
            </div>
            <span className="week-label">{liveStats ? "all time" : "this week"}</span>
          </div>
          {circle.length ? (
            <div className={`friend-row${circle.length > 4 ? " is-scroll" : ""}`}>
              {circle.map((person) => (
                <button
                  key={person.key}
                  className={selectedFriend === person.key ? "active" : ""}
                  onClick={() => setSelectedFriend(selectedFriend === person.key ? null : person.key)}
                  style={{ "--friend-color": person.color } as React.CSSProperties}
                >
                  <span className="friend-photo">
                    {person.image ? (
                      <img src={person.image} alt={person.name} />
                    ) : (
                      <span className="friend-initial">{person.name.slice(0, 1).toUpperCase()}</span>
                    )}
                    <b>{person.hoursLabel}</b>
                  </span>
                  <strong>{person.name}</strong>
                  <small>{person.sessions} sessions</small>
                </button>
              ))}
            </div>
          ) : (
            <p className="leaderboard-note">No sessions logged yet. Be the first to hop on!</p>
          )}
        </section>

        <section className="nearby-section">
          <div className="section-title">
            <div>
              <p className="kicker">PICKS FROM YOUR CIRCLE</p>
              <h2>Try somewhere nearby</h2>
            </div>
            <span className="tiny-distance">under 15 min</span>
          </div>
          <div className="recommendation-row">
            {[spots[2], spots[0], spots[1]].map((spot, index) => (
              <article className="recommendation" key={spot.id}>
                <div>
                  <img src={spot.image} alt={`${spot.name} interior`} />
                  <span>{spot.walk}</span>
                </div>
                <h3>{spot.name}</h3>
                <p>{index + 2} friends saved this</p>
              </article>
            ))}
          </div>
        </section>

        <section className="feed-section">
          <div className="section-title">
            <div>
              <p className="kicker">THE LATEST</p>
              <h2>
                {liveStats
                  ? (selectedName ? `${selectedName}'s sessions` : "Friends are studying")
                  : (activeFriend ? `${activeFriend.name}'s week` : "Friends are studying")}
              </h2>
            </div>
            {selectedFriend && <button onClick={() => setSelectedFriend(null)}>See all</button>}
          </div>
          <div className={`activity-feed${(liveStats ? visibleSessions.length : filteredActivities.length) > 3 ? " activity-feed--scroll" : ""}`}>
            {liveStats ? (
              visibleSessions.length ? (
                visibleSessions.map((session, index) => {
                  const person = circle.find((item) => item.key === session.user_id);
                  const name = person?.name || session.display_name || "Student";
                  const hoursLabel = formatStudyHours(Number(session.duration_minutes) / 60);
                  const hoursAmount = hoursLabel.replace(/h$/, "");
                  return (
                    <article className="activity-card" key={session.id}>
                      <span className="community-avatar activity-avatar" style={{ background: person?.color ?? CIRCLE_COLORS[index % CIRCLE_COLORS.length] }} aria-hidden="true">
                        {name.slice(0, 1).toUpperCase()}
                      </span>
                      <div className="activity-copy">
                        <div><strong>{name}</strong><span>{formatSessionWhen(session.started_at)}</span></div>
                        <p>studied <b>{hoursAmount} {hoursAmount === "1" ? "hour" : "hours"}</b> at <em>{session.spot_name}</em></p>
                        {session.note ? <small>Working on: {session.note}</small> : null}
                      </div>
                      <div className={`activity-stamp stamp-${index % 3}`}>{hoursLabel}</div>
                    </article>
                  );
                })
              ) : <p className="quiet-feed">No sessions logged yet.</p>
            ) : filteredActivities.length ? filteredActivities.map((activity, index) => {
              const friend = friends.find((item) => item.id === activity.friendId) ?? friends[0];
              return (
                <article className="activity-card" key={activity.id}>
                  <img src={friend.image} alt="" />
                  <div className="activity-copy">
                    <div><strong>{friend.name}</strong><span>{activity.when}</span></div>
                    <p>studied <b>{activity.hours} hours</b> at <em>{activity.place}</em></p>
                    <small>Working on: {activity.subject}</small>
                  </div>
                  <div className={`activity-stamp stamp-${index % 3}`}>{activity.hours}h</div>
                </article>
              );
            }) : <p className="quiet-feed">No sessions yet this week.</p>}
          </div>
        </section>

        <section className="leaderboard-section">
          <div className="section-title">
            <div>
              <p className="kicker">FRIENDLY COMPETITION</p>
              <h2>Friends leaderboard</h2>
            </div>
            <span className="week-label">{liveStats ? "all time" : "this week"}</span>
          </div>
          {circle.length ? (
            <div className="leaderboard-list">
              {circle.map((person, index) => (
                <button
                  key={person.key}
                  className={`leaderboard-row ${person.isYou ? "is-you" : ""}`}
                  onClick={() => setSelectedFriend(person.key)}
                  aria-label={`View ${person.name}'s activity`}
                >
                  <span className="leaderboard-rank">{index + 1}</span>
                  {person.image ? (
                    <img src={person.image} alt="" />
                  ) : (
                    <span className="community-avatar" style={{ background: person.color }} aria-hidden="true">
                      {person.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span className="leaderboard-progress">
                    <span><b>{person.name}</b><strong>{person.hoursLabel}</strong></span>
                    <i><em style={{ width: `${Math.max(9, (person.total / leadingHours) * 100)}%` }} /></i>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="leaderboard-note">No sessions logged yet. Be the first to hop on!</p>
          )}
          <p className="leaderboard-note">Log a session and watch your bar hop forward.</p>
        </section>

      </div>
    </section>
  );
}

function ChoiceMetric({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="choice-metric">
      <strong>{label}</strong>
      <div role="group" aria-label={label}>
        {options.map((option) => (
          <button
            type="button"
            key={option}
            className={option === value ? "active" : ""}
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function PlaceDetailSheet({
  spot,
  stamped,
  favorite,
  onFavorite,
  onStamp,
  onClose,
  onRate,
}: {
  spot: Spot;
  stamped: boolean;
  favorite: boolean;
  onFavorite: () => void;
  onStamp: () => void;
  onClose: () => void;
  onRate: () => void;
}) {
  const profile = getStudyProfile(spot);
  const [reviewIndex, setReviewIndex] = useState(0);
  const detailDrag = useRef<number | null>(null);
  const reviews = [
    { quote: profile.review, author: "a fellow Study Hopper" },
    { quote: `The ${profile.noise} atmosphere and ${profile.wifi} Wi-fi made it easy to settle in and get things done.`, author: "Maya · 2 days ago" },
    { quote: `${profile.outlets}, with enough room for ${profile.seating}. I would definitely come back for another session.`, author: "Leo · last week" },
  ];
  const busyValues = spot.communityInput?.busyness ?? [24, 32, 48, 71, 94, 80, 61, 43, 29];
  const busyLabels = spot.communityInput ? ["8am", "12pm", "4pm", "8pm"] : ["8", "", "10", "", "12", "", "2", "", "4"];
  const metrics = [
    ["Noise", profile.noise],
    ["Outlets", profile.outlets],
    ["Seating", profile.seating],
    ["Wi-fi", profile.wifi],
    ["Price", profile.price],
    ["Busy times", profile.busyness],
  ];

  return (
    <div className="place-detail-backdrop" onMouseDown={onClose}>
      <article
        className="place-detail-sheet"
        onMouseDown={(event) => event.stopPropagation()}
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest("button")) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          detailDrag.current = event.clientY;
        }}
        onPointerUp={(event) => {
          if (detailDrag.current !== null && event.clientY - detailDrag.current > 80) onClose();
          detailDrag.current = null;
        }}
      >
        <div className="detail-drag-handle"><span /><small>drag down to map</small></div>
        <div className="detail-hero">
          <img src={spot.image} alt={`${spot.name} study space`} />
          <span className="detail-tape" />
          <button className="detail-close" onClick={onClose} aria-label="Close place details">
            <Icon name="close" size={20} />
          </button>
          <div className="detail-stamp" style={{ color: spot.color }}>
            <Icon name={spot.type} size={27} />
          </div>
        </div>

        <div className="detail-content">
          <div className="detail-title">
            <div>
              <p className="eyebrow">{spot.area} · {spot.walk}</p>
              <h2>{spot.name}</h2>
              <p className="detail-address">{spot.address}</p>
            </div>
            <div className="detail-place-actions">
              {stamped ? (
                <>
                  <span className="visited-stamp" title="You saved this spot">SAVED!</span>
                  <button
                    className={`heart-button ${favorite ? "is-favorite" : ""}`}
                    onClick={onFavorite}
                    aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Icon name="heart" size={23} />
                  </button>
                </>
              ) : (
                <button className="stamp-this-button" onClick={onStamp}>
                  SAVE!
                </button>
              )}
            </div>
          </div>

          <div className="detail-rating-summary">
            <strong>{spot.rating}</strong>
            <div>
              <span>{"★★★★★".split("").map((star, index) => <i key={index}>{star}</i>)}</span>
              <p>Based on {spot.reviews} study ratings</p>
            </div>
            <button onClick={onRate}>Rate it</button>
          </div>

          <section className="study-snapshot">
            <div className="detail-section-title">
              <div><p className="kicker">THE STUDY REPORT</p><h3>Good to know</h3></div>
              <span>community rated</span>
            </div>
            <div className="metric-grid">
              {metrics.map(([label, value]) => (
                <div key={label}>
                  <small>{label}</small>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="detail-busy">
            <div>
              <p className="kicker">POPULAR TIMES</p>
              <h3>Usually {profile.busyness}</h3>
            </div>
            <div className="detail-busy-bars">
              {busyValues.map((height, index) => (
                <span key={index}>
                  <i style={{ height: `${height}%` }} />
                  <small>{busyLabels[index]}</small>
                </span>
              ))}
            </div>
          </section>

          <section className="hours-card">
            <div><span className="open-dot" /><strong>Open today</strong></div>
            <b>{spot.hours}</b>
            {spot.openLate && <em>open past 9pm</em>}
          </section>

          <section className="vibe-section">
            <div className="detail-section-title">
              <div><p className="kicker">DA VIBES!</p><h3>What people are saying</h3></div>
              <span>{reviewIndex + 1} / {reviews.length}</span>
            </div>
            <div className="detail-vibes">
              {profile.vibes.map((vibe) => <span key={vibe}>{vibe}</span>)}
            </div>
            <div className="review-stack">
              <blockquote key={reviewIndex}>
                “{reviews[reviewIndex].quote}”
                <footer>— {reviews[reviewIndex].author}</footer>
              </blockquote>
              <div className="review-controls">
                <button
                  onClick={() => setReviewIndex((current) => (current - 1 + reviews.length) % reviews.length)}
                  aria-label="Previous review"
                >
                  ←
                </button>
                <div>
                  {reviews.map((_, index) => (
                    <button
                      key={index}
                      className={index === reviewIndex ? "active" : ""}
                      onClick={() => setReviewIndex(index)}
                      aria-label={`Show review ${index + 1}`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setReviewIndex((current) => (current + 1) % reviews.length)}
                  aria-label="Next review"
                >
                  →
                </button>
              </div>
            </div>
          </section>
        </div>
      </article>
    </div>
  );
}

type ChatMessage = {
  id: number;
  from: "hop" | "user";
  text: string;
  spotId?: number;
  // [hops-gemini] spots Gemini recommended (validated public.spots rows from the hops-chat function)
  hopsSpots?: DbSpot[];
};

// [hops-gemini] start: match a recommended spot row to the app's merged spots (Supabase id → place_id → name)
// so the card gets the Google Places photo + walk time; otherwise build one from the row (stock image).
function resolveHopsSpot(row: DbSpot, spots: Spot[]): Spot {
  const remote = spots as (Spot & { dbId?: string; placeId?: string })[];
  const name = row.name.trim().toLowerCase();
  return (
    remote.find((spot) => spot.dbId === row.id) ??
    (row.place_id ? remote.find((spot) => spot.placeId === row.place_id) : undefined) ??
    remote.find((spot) => spot.name.trim().toLowerCase() === name) ??
    (toSpot(row) as Spot)
  );
}
// [hops-gemini] end

function AskHopsChat({
  spots,
  stampedSpots,
  onClose,
  onViewSpot,
  onSaveSpot,
}: {
  spots: Spot[];
  stampedSpots: number[];
  onClose: () => void;
  onViewSpot: (spot: Spot) => void;
  onSaveSpot: (spot: Spot) => void;
}) {
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      from: "hop",
      text: "Hi, I’m Hops! Tell me what kind of study day you’re having, and I’ll find you a cozy match.",
    },
  ]);

  function findMatch(request: string) {
    const need = request.toLowerCase();
    if (need.match(/outside|sun|park|fresh air/)) return spots.find((spot) => spot.type === "outdoors") ?? spots[0];
    if (need.match(/silent|quiet|focus|exam|library/)) return spots.find((spot) => spot.type === "library") ?? spots[0];
    if (need.match(/late|night|evening/)) return spots.find((spot) => spot.openLate) ?? spots[0];
    if (need.match(/group|friend|social|big table/)) return spots.find((spot) => spot.name.includes("Juniper")) ?? spots[0];
    if (need.match(/wifi|outlet|laptop|zoom/)) {
      return spots.find((spot) => spot.highlights.some((item) => item.includes("wifi") || item.includes("outlet"))) ?? spots[0];
    }
    if (need.match(/cheap|free|budget/)) return spots.find((spot) => getStudyProfile(spot).price === "free") ?? spots[0];
    return spots.find((spot) => spot.type === "coffee") ?? spots[0];
  }

  // [hops-gemini] start: send the whole conversation to Gemini instead of the old keyword matcher (findMatch)
  function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;
    const userMessage: ChatMessage = { id: Date.now(), from: "user", text: trimmed };
    const history = [...messages, userMessage];
    setMessages(history);
    setInput("");
    setIsTyping(true);
    askHops(history.map((message) => ({ role: message.from === "hop" ? "model" : "user", text: message.text })))
      .then(({ reply, spots: hopsSpots }) => {
        // Secondary fallback: if no structured picks came back, show the card for a spot the reply names (longest name wins).
        const mentioned = hopsSpots.length
          ? undefined
          : [...spots]
              .sort((a, b) => b.name.length - a.name.length)
              .find((spot) => reply.toLowerCase().includes(spot.name.toLowerCase()));
        setMessages((current) => [
          ...current,
          { id: Date.now() + 1, from: "hop", text: reply, spotId: mentioned?.id, hopsSpots },
        ]);
      })
      .catch((error: unknown) => {
        console.warn("[hops-gemini] chat failed:", error);
        const friendly = error instanceof Error && error.message ? error.message : "Hops hopped into a hiccup. Try again in a moment!";
        setMessages((current) => [...current, { id: Date.now() + 1, from: "hop", text: friendly }]);
      })
      .finally(() => setIsTyping(false));
  }
  // [hops-gemini] end

  function submitMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage(input);
  }

  return (
    <div className="chat-backdrop">
      <section className="hops-chat" aria-label="Ask Hops study companion">
        <header className="chat-header">
          <div className="chat-avatar">
            <img src="/bunny_mascot.png" alt="" />
            <span />
          </div>
          <div>
            <p className="kicker">YOUR STUDY COMPANION</p>
            <h2>Ask Hops</h2>
            <small>here to find your next spot</small>
          </div>
          <button onClick={onClose} aria-label="Close Ask Hops"><Icon name="close" size={20} /></button>
        </header>

        <div className="chat-messages">
          {messages.map((message) => {
            // [hops-gemini] one card per recommended spot (structured picks first, else the exact-name match)
            const legacy = message.spotId ? spots.find((spot) => spot.id === message.spotId) : undefined;
            const recommendations = message.hopsSpots?.length
              ? message.hopsSpots.map((row) => resolveHopsSpot(row, spots))
              : legacy
                ? [legacy]
                : [];
            return (
              <div className={`chat-message-row ${message.from}`} key={message.id}>
                {message.from === "hop" && <img src="/bunny_mascot.png" alt="Hops" />}
                <div>
                  <p>{message.text}</p>
                  {recommendations.map((recommendation) => {
                    const profile = getStudyProfile(recommendation);
                    return (
                    <article className="chat-recommendation" key={recommendation.id}>
                      <div className="chat-rec-photo">
                        <img src={recommendation.image} alt={`${recommendation.name} interior`} />
                        <span>{recommendation.walk}</span>
                      </div>
                      <div className="chat-rec-copy">
                        <div>
                          <p className="eyebrow">{recommendation.area}</p>
                          <h3>{recommendation.name}</h3>
                          <small>{recommendation.address}</small>
                        </div>
                        <strong>★ {recommendation.rating} · {recommendation.reviews}</strong>
                        <div className="chat-rec-stats">
                          <span>{profile.noise}</span>
                          <span>{profile.wifi.replace(/\s*wi-?fi$/i, "")} wi-fi</span>
                          <span>{recommendation.hours}</span>
                        </div>
                        <div className="chat-rec-actions">
                          <button onClick={() => onViewSpot(recommendation)}>View spot</button>
                          <button
                            className={stampedSpots.includes(recommendation.id) ? "saved" : ""}
                            onClick={() => !stampedSpots.includes(recommendation.id) && onSaveSpot(recommendation)}
                          >
                            {stampedSpots.includes(recommendation.id) ? "SAVED!" : "SAVE!"}
                          </button>
                        </div>
                      </div>
                    </article>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {isTyping && (
            <div className="chat-message-row hop">
              <img src="/bunny_mascot.png" alt="" />
              <div className="typing-bubble"><span /><span /><span /></div>
            </div>
          )}
        </div>

        {messages.length === 1 && (
          <div className="chat-prompts">
            {["Somewhere quiet", "Fast Wi-fi + outlets", "Open late", "Good for a group"].map((prompt) => (
              <button key={prompt} onClick={() => sendMessage(prompt)}>{prompt}</button>
            ))}
          </div>
        )}

        <form className="chat-composer" onSubmit={submitMessage}>
          <label>
            <span className="sr-only">Describe your study needs</span>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder="I need somewhere quiet with outlets..."
              rows={1}
            />
          </label>
          <button type="submit" aria-label="Send message">↑</button>
        </form>
      </section>
    </div>
  );
}

export default function App() {
  const [allSpots, setAllSpots] = useState(spots);
  const [page, setPage] = useState<"places" | "friends">("places");
  const [view, setView] = useState<"map" | "list">("map");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(1);
  const [stampedSpots, setStampedSpots] = useState<number[]>([1, 3]);
  const [favorites, setFavorites] = useState<number[]>([1, 3]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [taglineIndex, setTaglineIndex] = useState(getOpeningTaglineIndex);
  const [starSpin, setStarSpin] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<"stamp" | "rate">("stamp");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [receiptData, setReceiptData] = useState<null | {
    name: string;
    address: string;
    area: string;
    hours: string;
    rating: number;
    type: Spot["type"];
  }>(null);
  const [sessionReceipt, setSessionReceipt] = useState<null | {
    hours: string;
    place: string;
    subject: string;
  }>(null);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [activities, setActivities] = useState(starterActivities);
  const [leaderboardHours, setLeaderboardHours] = useState<Record<number, number>>({
    1: 8.5,
    2: 12,
    3: 6,
    4: 9.5,
  });
  const [generalRating, setGeneralRating] = useState(0);
  const [ratingError, setRatingError] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewDetails, setReviewDetails] = useState({
    noise: "chatter",
    outlets: "at a few tables",
    wifi: "medium",
    seats: 4,
    openLate: false,
    busyDay: "Weekdays",
    busyness: [25, 72, 58, 30],
    price: "$$",
  });
  const [placeQuery, setPlaceQuery] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [placeError, setPlaceError] = useState(false);
  const [logQuery, setLogQuery] = useState("");
  const [selectedLogPlace, setSelectedLogPlace] = useState<PlaceResult | null>(null);
  const [logPlaceError, setLogPlaceError] = useState(false);
  const [mapView, setMapView] = useState({ x: 0, y: 0, scale: 1 });
  // [google-maps] true when we show the original hand-drawn map (no key / Maps failed to load)
  const [fakeMap, setFakeMap] = useState(!hasGoogleMapsKey);
  const mapDrag = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const cardDrag = useRef<number | null>(null);
  // [supabase] start: guest sign-in, community spots, display-name prompt
  const auth = useGuestAuth();
  const [placesSpots, setPlacesSpots] = useState<PlaceSpot[]>([]);
  const [communitySpots, setCommunitySpots] = useState<CommunitySpot[]>([]);
  const [leaderboardRows, setLeaderboardRows] = useState<LeaderboardRow[]>([]);
  const [sessions, setSessions] = useState<StudySessionRow[]>([]);
  const [syncNotice, setSyncNotice] = useState("");
  const [pendingNameAction, setPendingNameAction] = useState<null | (() => void)>(null);
  const refreshCommunity = useCallback(() => {
    fetchSpots()
      .then(setCommunitySpots)
      .catch((error) => {
        console.warn("[supabase] fetchSpots failed:", error);
        setSyncNotice("Couldn't load community spots — showing local data.");
      });
    getLeaderboard(10).then(setLeaderboardRows).catch((error) => console.warn("[supabase] leaderboard failed:", error));
    getRecentSessions(20).then(setSessions).catch((error) => console.warn("[supabase] sessions failed:", error));
  }, []);
  useEffect(() => {
    if (auth.status === "ready") refreshCommunity();
    if (auth.status === "unavailable" && auth.reason) setSyncNotice(auth.reason);
  }, [auth.status, auth.reason, refreshCommunity]);
  useEffect(() => {
    // Places + Supabase replace the hardcoded samples; spots the user added locally are kept.
    if (!placesSpots.length && !communitySpots.length) return;
    const merged = mergeSpots(placesSpots, communitySpots);
    setAllSpots((current) => [
      ...merged,
      ...current.filter((spot) => {
        const remote = spot as Partial<PlaceSpot>;
        return !remote.placeId && !remote.dbId && !spots.some((sample) => sample.id === spot.id);
      }),
    ]);
  }, [placesSpots, communitySpots]);
  useEffect(() => {
    if (allSpots.length && !allSpots.some((spot) => spot.id === selected)) setSelected(allSpots[0].id);
  }, [allSpots, selected]);
  useEffect(() => {
    if (!syncNotice) return;
    const timer = window.setTimeout(() => setSyncNotice(""), 7000);
    return () => window.clearTimeout(timer);
  }, [syncNotice]);
  function syncToSupabase(task: () => Promise<unknown>) {
    if (auth.status !== "ready") return; // offline / guest sign-in off: local-only, notice already shown
    const run = () =>
      task()
        .then(refreshCommunity)
        .catch((error) => {
          console.warn("[supabase] write failed:", error);
          setSyncNotice("Saved on this device, but couldn't sync to Study Hopper.");
        });
    if (auth.displayName || window.localStorage.getItem("study-hopper-name-skipped")) run();
    else setPendingNameAction(() => run); // first rating/log: ask for a display name first
  }
  function syncRating(target: Spot | undefined, note: string) {
    if (auth.status !== "ready") return;
    const remote = (target ?? {}) as Partial<PlaceSpot>;
    const score = generalRating;
    const review = reviewOpen ? reviewToNumbers(reviewDetails) : {};
    if (remote.dbId) {
      syncToSupabase(() => addRating(remote.dbId!, score, review, note));
    } else if (target && remote.placeId && remote.location) {
      const location = remote.location;
      const placeId = remote.placeId;
      syncToSupabase(() =>
        addRankedCafe({
          name: target.name, location, placeId, score, review, note,
          address: target.address, hours: target.hours,
          openLate: reviewOpen ? reviewDetails.openLate : target.openLate,
          seating: reviewOpen ? reviewDetails.seats : null,
          price: reviewOpen ? reviewDetails.price : null,
          tags: target.tags,
        }),
      );
    } else {
      setSyncNotice("Saved on this device — pick a spot from the map to share it with the community.");
    }
  }
  // [supabase] end
  const touchStart = useRef<number | null>(null);

  const knownPlaces = allSpots as PlaceSpot[];
  const placeSuggestions = usePlaceSuggestions(placeQuery, selectedPlace?.name, knownPlaces);
  const logSuggestions = usePlaceSuggestions(logQuery, selectedLogPlace?.name, knownPlaces);

  const visibleSpots = useMemo(
    () =>
      allSpots.filter(
        (spot) =>
          (filter === "all" ||
            spot.type === filter ||
            (filter === "saved" && favorites.includes(spot.id)) ||
            (filter === "early" && spot.openEarly) ||
            (filter === "late" && spot.openLate)) &&
          spot.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [allSpots, filter, favorites, query],
  );

  const selectedSpot = allSpots.find((spot) => spot.id === selected) ?? allSpots[0];

  function toggleFavorite(id: number) {
    if (!stampedSpots.includes(id)) return;
    setFavorites((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function saveNewSpot(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPlace) {
      setPlaceError(true);
      return;
    }
    if (!generalRating) {
      setRatingError(true);
      return;
    }
    const form = new FormData(event.currentTarget);
    const name = selectedPlace.name;
    const existing = allSpots.find((spot) => spot.name === selectedPlace.name);
    syncRating(existing, String(form.get("note") || "")); // [supabase]
    if (existing) {
      setSelected(existing.id);
      if (sheetMode === "stamp") {
        setStampedSpots((current) => current.includes(existing.id) ? current : [...current, existing.id]);
      }
      setAllSpots((current) =>
        current.map((spot) =>
          spot.id === existing.id
            ? {
                ...spot,
                rating: Number(((spot.rating * spot.reviews + generalRating) / (spot.reviews + 1)).toFixed(1)),
                reviews: spot.reviews + 1,
                highlights: reviewOpen
                  ? [reviewDetails.noise, reviewDetails.outlets, `${reviewDetails.wifi} wifi`]
                  : spot.highlights,
                communityInput: reviewOpen
                  ? {
                      busyDay: reviewDetails.busyDay,
                      busyness: reviewDetails.busyness,
                      price: reviewDetails.price,
                    }
                  : spot.communityInput,
              }
            : spot,
        ),
      );
    } else {
      const newSpot: Spot = {
        id: Date.now(),
        name,
        address: selectedPlace.address,
        area: selectedPlace.area,
        walk: "new",
        type: selectedPlace.type,
        tags: ["new stamp", reviewDetails.wifi],
        note: String(form.get("note") || "A newly discovered study spot"),
        image: "https://images.unsplash.com/photo-1669846125517-6ea5fd9dc9af?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=900&h=700",
        color: "#b94d74",
        position: selectedPlace.position,
        rating: generalRating,
        reviews: 1,
        highlights: [reviewDetails.noise, reviewDetails.outlets, `${reviewDetails.wifi} wifi`],
        openEarly: selectedPlace.openEarly,
        openLate: selectedPlace.openLate,
        hours: selectedPlace.hours,
        communityInput: {
          busyDay: reviewDetails.busyDay,
          busyness: reviewDetails.busyness,
          price: reviewDetails.price,
        },
      };
      setAllSpots((current) => [...current, newSpot]);
      setSelected(newSpot.id);
      if (sheetMode === "stamp") setStampedSpots((current) => [...current, newSpot.id]);
    }
    setFilter("all");
    setPage("places");
    setView("map");
    setSavedMessage(sheetMode === "rate" ? `Rating added for ${name}!` : `${name} stamped into your list!`);
    if (sheetMode === "stamp") {
      setReceiptData({
        name,
        address: selectedPlace.address,
        area: selectedPlace.area,
        hours: selectedPlace.hours,
        rating: generalRating,
        type: selectedPlace.type,
      });
    }
    setTimeout(() => {
      setAddOpen(false);
      setSavedMessage("");
      setGeneralRating(0);
      setRatingError(false);
      setReviewOpen(false);
      setPlaceQuery("");
      setSelectedPlace(null);
      setPlaceError(false);
    }, 1200);
  }

  function changeZoom(amount: number) {
    setMapView((current) => ({ ...current, scale: Math.min(2.2, Math.max(.65, current.scale + amount)) }));
  }

  function startMapDrag(event: React.PointerEvent<HTMLElement>) {
    if ((event.target as HTMLElement).closest("button, [role='button']")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    mapDrag.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: mapView.x,
      originY: mapView.y,
    };
  }

  function moveMap(event: React.PointerEvent<HTMLElement>) {
    if (!mapDrag.current) return;
    setMapView((current) => ({
      ...current,
      x: mapDrag.current!.originX + event.clientX - mapDrag.current!.startX,
      y: mapDrag.current!.originY + event.clientY - mapDrag.current!.startY,
    }));
  }

  function logActivity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedLogPlace) {
      setLogPlaceError(true);
      return;
    }
    const form = new FormData(event.currentTarget);
    const loggedSpot = (allSpots as PlaceSpot[]).find(
      (spot) =>
        (selectedLogPlace.placeId && spot.placeId === selectedLogPlace.placeId) ||
        spot.name === selectedLogPlace.name,
    );
    syncToSupabase(() =>
      logStudySession(
        Number(form.get("hours") || 1),
        selectedLogPlace.dbId || loggedSpot?.dbId,
        String(form.get("subject") || ""),
        selectedLogPlace.name,
      ),
    );
    const loggedHours = Number(form.get("hours") || 1);
    const loggedPlace = selectedLogPlace.name;
    const loggedSubject = String(form.get("subject") || "");
    if (auth.status === "ready" && auth.user?.id) {
      setSessions((current) => [
        {
          id: crypto.randomUUID(),
          user_id: auth.user!.id,
          display_name: auth.displayName || "You",
          spot_name: loggedPlace,
          started_at: new Date().toISOString(),
          duration_minutes: Math.max(1, Math.round(loggedHours * 60)),
          note: loggedSubject || null,
        },
        ...current,
      ]);
    } else {
      setActivities((current) => [
        {
          id: Date.now(),
          friendId: 1,
          hours: String(loggedHours),
          place: loggedPlace,
          subject: loggedSubject || "Study session",
          when: "Just now",
        },
        ...current,
      ]);
    }
    setLeaderboardHours((current) => ({
      ...current,
      1: (current[1] ?? 0) + loggedHours,
    }));
    if (auth.user?.id) {
      const you = auth.user.id;
      setLeaderboardRows((current) => {
        const existing = current.find((row) => row.user_id === you);
        const next = existing
          ? current.map((row) =>
              row.user_id === you
                ? {
                    ...row,
                    total_hours: Number(row.total_hours) + loggedHours,
                    total_minutes: Number(row.total_minutes) + loggedHours * 60,
                    session_count: Number(row.session_count) + 1,
                  }
                : row,
            )
          : [
              ...current,
              {
                rank: current.length + 1,
                user_id: you,
                display_name: auth.displayName || "You",
                total_minutes: loggedHours * 60,
                total_hours: loggedHours,
                session_count: 1,
              },
            ];
        return next
          .sort((a, b) => Number(b.total_hours) - Number(a.total_hours))
          .map((row, index) => ({ ...row, rank: index + 1 }));
      });
    }
    setSelectedFriend(null);
    setLogOpen(false);
    setLogQuery("");
    setSelectedLogPlace(null);
    setLogPlaceError(false);
    setSessionReceipt({
      hours: String(loggedHours),
      place: loggedPlace,
      subject: loggedSubject || "Study session",
    });
  }

  function finishSwipe(clientX: number) {
    if (touchStart.current === null) return;
    const distance = clientX - touchStart.current;
    if (distance < -55 && page === "places") setPage("friends");
    if (distance > 55 && page === "friends") setPage("places");
    touchStart.current = null;
  }

  return (
    <main className="app-shell">
      <div className="paper-grain" />
      <section
        className={`phone-app page-${page}`}
        onTouchStart={(event) => { touchStart.current = event.touches[0].clientX; }}
        onTouchEnd={(event) => finishSwipe(event.changedTouches[0].clientX)}
      >
        {page === "places" ? (
          <>
        <header className="topbar">
          <div>
            <h1>Study <span>Hopper</span></h1>
            <button
              type="button"
              className="tagline-row"
              onClick={() => {
                const next = (taglineIndex + 1) % headerTaglines.length;
                setTaglineIndex(next);
                setStarSpin((current) => current + 1);
                window.localStorage.setItem("study-hopper-tagline", String(next));
              }}
              aria-label={`Change message. Current message: ${headerTaglines[taglineIndex]}`}
            >
              <span className="kicker rotating-tagline" key={taglineIndex}>{headerTaglines[taglineIndex]}</span>
              <span
                className="tagline-star"
              >
                <svg key={starSpin} className={starSpin ? "spin" : ""} viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m12 1.8 2.8 6.6 7.1.7-5.4 4.7 1.6 7-6.1-3.7-6.1 3.7 1.6-7L2.1 9.1l7.1-.7L12 1.8Z" />
                </svg>
              </span>
            </button>
          </div>
          <div className="header-actions">
            <button className="round-button" onClick={() => setSearchOpen((open) => !open)} aria-label="Search spots">
              {searchOpen ? <Icon name="close" size={22} /> : <Icon name="search" size={22} />}
            </button>
            <button className="mascot-wrap" onClick={() => setChatOpen(true)} aria-label="Open Ask Hops">
              <div className="mascot-badge">
                <img className="bunny-mascot" src="/bunny_mascot.png" alt="" />
              </div>
              <svg className="mascot-label" viewBox="0 0 72 25" aria-hidden="true">
                <defs>
                  <path id="ask-hops-curve" d="M 7 3 Q 36 24 65 3" />
                </defs>
                <text>
                  <textPath href="#ask-hops-curve" startOffset="50%" textAnchor="middle">ASK HOPS</textPath>
                </text>
              </svg>
            </button>
          </div>
        </header>

        {searchOpen && (
          <label className="search-field">
            <Icon name="search" size={19} />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find your next nook..."
            />
          </label>
        )}

        <div className="filter-row" aria-label="Filter study spots">
          {[
            ["all", "All spots"],
            ["saved", "Favorites"],
            ["coffee", "Coffee"],
            ["library", "Libraries"],
            ["outdoors", "Outside"],
            ["early", "Open early"],
            ["late", "Open past 9"],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => {
                setFilter(value);
                if (value === "saved" && !favorites.includes(selected) && favorites[0]) setSelected(favorites[0]);
              }}
              className={filter === value ? "active" : ""}
            >
              {value === "saved" && <Icon name="heart" size={13} />}
              {label}
            </button>
          ))}
        </div>

        {view === "map" ? (
          <section
            className={`map-view ${mapDrag.current ? "is-dragging" : ""}`}
            // [google-maps] drag/zoom handlers only drive the hand-drawn fallback map
            {...(fakeMap && {
              onPointerDown: startMapDrag,
              onPointerMove: moveMap,
              onPointerUp: () => { mapDrag.current = null; },
              onPointerCancel: () => { mapDrag.current = null; },
              onWheel: (event: React.WheelEvent<HTMLElement>) => {
                event.preventDefault();
                changeZoom(event.deltaY > 0 ? -.12 : .12);
              },
            })}
            onTouchStart={(event) => event.stopPropagation()}
            onTouchEnd={(event) => event.stopPropagation()}
          >
            {/* [google-maps] start: real Google Map; original hand-drawn map is the fallback */}
            <StudyMap
              spots={visibleSpots}
              selectedId={selected}
              onSelect={setSelected}
              onFallback={() => setFakeMap(true)}
              onPlacesLoaded={(results) => {
                setPlacesSpots(results); // [supabase] merged with community spots in an effect above
                setSelected(results[0].id);
              }}
              renderPin={(spot) => (
                <Stamp
                  spot={spot}
                  active={selected === spot.id}
                  onClick={() => setSelected(spot.id)}
                />
              )}
              fallback={<>
            <div
              className="map-canvas"
              style={{ transform: `translate(${mapView.x}px, ${mapView.y}px) scale(${mapView.scale})` }}
            >
              <div className="map-landmark landmark-one">OLD TOWN</div>
              <div className="map-landmark landmark-two">GARDEN DISTRICT</div>
              <div className="park park-one" />
              <div className="park park-two" />
              <div className="river" />
              {visibleSpots.map((spot) => (
                <Stamp
                  key={spot.id}
                  spot={spot}
                  active={selected === spot.id}
                  onClick={() => setSelected(spot.id)}
                />
              ))}
              <div className="you-are-here"><span /> YOU ARE HERE</div>
              {visibleSpots.length === 0 && <p className="no-results">No stamps here yet.</p>}
            </div>
            <div className="map-controls" aria-label="Map controls">
              <button onClick={() => changeZoom(.2)} aria-label="Zoom in">+</button>
              <button onClick={() => changeZoom(-.2)} aria-label="Zoom out">−</button>
              <button
                className="recenter-map"
                onClick={() => setMapView({ x: 0, y: 0, scale: 1 })}
                aria-label="Recenter map"
              >
                ◎
              </button>
            </div>
              </>}
            />
            {/* [google-maps] end */}
            <div className="map-gesture-hint">drag to wander · scroll to zoom</div>
            <div
              className="map-card"
              onPointerDown={(event) => {
                event.stopPropagation();
                event.currentTarget.setPointerCapture(event.pointerId);
                cardDrag.current = event.clientY;
              }}
              onPointerUp={(event) => {
                event.stopPropagation();
                if (cardDrag.current !== null && cardDrag.current - event.clientY > 35) setDetailsOpen(true);
                cardDrag.current = null;
              }}
            >
              <div className="map-card-pull"><span /> pull up</div>
              <div className="mini-photo">
                <img src={selectedSpot.image} alt="" />
              </div>
              <div className="map-card-copy">
                <p className="eyebrow">{selectedSpot.area} · {selectedSpot.walk}</p>
                <h2>{selectedSpot.name}</h2>
                <p className="spot-address">{selectedSpot.address}</p>
                <div className="map-rating">
                  <b>★ {selectedSpot.rating}</b>
                  <span>{selectedSpot.reviews} ratings</span>
                  <i>{selectedSpot.highlights[0]}</i>
                </div>
                <p>{selectedSpot.note}</p>
                <button className="map-details-button" onClick={() => setDetailsOpen(true)}>
                  See study report <span>↗</span>
                </button>
              </div>
              <div className="map-place-actions">
                {stampedSpots.includes(selectedSpot.id) ? (
                  <>
                    <span className="mini-visited" title="You saved this spot">SAVED!</span>
                    <button
                      className={`heart-button ${favorites.includes(selectedSpot.id) ? "is-favorite" : ""}`}
                      onClick={() => toggleFavorite(selectedSpot.id)}
                      aria-label="Toggle favorite"
                    >
                      <Icon name="heart" size={20} />
                    </button>
                  </>
                ) : (
                  <button
                    className="mini-stamp-button"
                    onClick={() => {
                      const place = placeDirectory.find((item) => item.name === selectedSpot.name);
                      if (place) {
                        setSelectedPlace(place);
                        setPlaceQuery(place.name);
                      }
                      setSheetMode("stamp");
                      setAddOpen(true);
                    }}
                    aria-label={`Save ${selectedSpot.name}`}
                  >
                    <span>SAVE!</span>
                  </button>
                )}
              </div>
            </div>
          </section>
        ) : (
          <section className="list-view">
            <div className="list-heading">
              <div>
                <p className="kicker">THE GOOD ONES</p>
                <h2>{visibleSpots.length} places to settle in</h2>
              </div>
              <span className="scribble-arrow">↘</span>
            </div>
            {visibleSpots.map((spot) => (
              <SpotCard
                key={spot.id}
                spot={spot}
                stamped={stampedSpots.includes(spot.id)}
                favorite={favorites.includes(spot.id)}
                onFavorite={() => toggleFavorite(spot.id)}
                onStamp={() => {
                  const place = placeDirectory.find((item) => item.name === spot.name);
                  if (place) {
                    setSelectedPlace(place);
                    setPlaceQuery(place.name);
                  }
                  setSheetMode("stamp");
                  setAddOpen(true);
                }}
              />
            ))}
            {visibleSpots.length === 0 && <p className="empty-list">Nothing found — try another stamp.</p>}
          </section>
        )}

        <button className="friends-peek" onClick={() => setPage("friends")}>
          <span className="peek-faces">
            {friends.slice(1, 4).map((friend) => <img key={friend.id} src={friend.image} alt="" />)}
          </span>
          <span>study<br /><b>log</b></span>
          <strong>›</strong>
        </button>
          </>
        ) : (
          <FriendActivity
            activities={activities}
            sessions={sessions}
            leaderboardHours={leaderboardHours}
            leaderboardRows={leaderboardRows}
            youId={auth.user?.id}
            liveStats={auth.status === "ready"}
            selectedFriend={selectedFriend}
            setSelectedFriend={setSelectedFriend}
            logOpen={logOpen}
            setLogOpen={setLogOpen}
            onLog={logActivity}
            onBack={() => setPage("places")}
            logQuery={logQuery}
            onLogQueryChange={(value) => {
              setLogQuery(value);
              setSelectedLogPlace(null);
              setLogPlaceError(false);
            }}
            logSuggestions={logSuggestions}
            selectedLogPlace={selectedLogPlace}
            onSelectLogPlace={(place) => {
              setSelectedLogPlace(place);
              setLogQuery(place.name);
              setLogPlaceError(false);
            }}
            logPlaceError={logPlaceError}
          />
        )}

        <button
          className="add-button"
          onClick={() => {
            setSheetMode("stamp");
            setSelectedPlace(null);
            setPlaceQuery("");
            setAddOpen(true);
          }}
          aria-label="Add a new study spot"
        >
          <Icon name="plus" size={25} />
        </button>

        <nav className="bottom-nav">
          <button className={page === "places" && view === "map" ? "active" : ""} onClick={() => { setPage("places"); setView("map"); }}>
            <Icon name="map" size={23} />
            <span>Map</span>
          </button>
          <button className={page === "places" && view === "list" ? "active" : ""} onClick={() => { setPage("places"); setView("list"); }}>
            <Icon name="list" size={23} />
            <span>My list</span>
          </button>
        </nav>

        {chatOpen && (
          <AskHopsChat
            spots={allSpots}
            stampedSpots={stampedSpots}
            onClose={() => setChatOpen(false)}
            onViewSpot={(spot) => {
              setSelected(spot.id);
              setChatOpen(false);
              setDetailsOpen(true);
            }}
            onSaveSpot={(spot) => {
              const place = placeDirectory.find((item) => item.name === spot.name) ?? {
                name: spot.name,
                address: spot.address,
                area: spot.area,
                type: spot.type,
                position: spot.position,
                hours: spot.hours,
                openEarly: spot.openEarly,
                openLate: spot.openLate,
              };
              setSelected(spot.id);
              setSelectedPlace(place);
              setPlaceQuery(place.name);
              setSheetMode("stamp");
              setChatOpen(false);
              setAddOpen(true);
            }}
          />
        )}

        {receiptData && (
          <div className="stamp-celebration" onMouseDown={() => setReceiptData(null)}>
            <div className="receipt-stage" onMouseDown={(event) => event.stopPropagation()}>
              <div className="stamp-strike" aria-hidden="true">
                <span>STUDY SPOT</span>
                <strong>SAVED!</strong>
              </div>
              <article className="spot-receipt">
                <div className="receipt-teeth" />
                <p className="receipt-hello">thanks for rating!</p>
                <img className="receipt-bunny" src="/bunny_coffee.svg" alt="" />
                <p className="receipt-kicker">✦ VISIT RECEIPT ✦</p>
                <div className="receipt-place">
                  <span><Icon name={receiptData.type} size={24} /></span>
                  <div><h2>{receiptData.name}</h2><p>{receiptData.address}</p></div>
                </div>
                <div className="receipt-rule" />
                <dl>
                  <div><dt>Neighborhood</dt><dd>{receiptData.area}</dd></div>
                  <div><dt>Hours</dt><dd>{receiptData.hours}</dd></div>
                  <div><dt>Your rating</dt><dd>{"★".repeat(receiptData.rating)}</dd></div>
                  <div><dt>Stamped</dt><dd>{new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" })}</dd></div>
                </dl>
                <div className="receipt-dots">• • • • • • • • • •</div>
                <p className="receipt-thanks">A new stop in your study story.</p>
                <div className="receipt-code">|||| ||| || |||| | |||</div>
              </article>
              <button className="receipt-done" onClick={() => setReceiptData(null)}>Tuck it away</button>
            </div>
          </div>
        )}

        {sessionReceipt && (
          <div className="stamp-celebration" onMouseDown={() => setSessionReceipt(null)}>
            <div className="receipt-stage" onMouseDown={(event) => event.stopPropagation()}>
              <div className="stamp-strike" aria-hidden="true">
                <span>STUDY LOG</span>
                <strong>SAVED!</strong>
              </div>
              <article className="spot-receipt session-receipt">
                <div className="receipt-teeth" />
                <img className="receipt-bunny" src="/bunny_hug.svg" alt="" />
                <p className="receipt-hello">nice work!</p>
                <p className="receipt-kicker">✦ STUDY RECEIPT ✦</p>
                <div className="receipt-rule" />
                <dl>
                  <div><dt>Hours</dt><dd>{sessionReceipt.hours}h</dd></div>
                  <div><dt>Spot</dt><dd>{sessionReceipt.place}</dd></div>
                  <div><dt>Studying</dt><dd>{sessionReceipt.subject}</dd></div>
                  <div><dt>Logged</dt><dd>{new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" })}</dd></div>
                </dl>
                <div className="receipt-dots">• • • • • • • • • •</div>
                <p className="receipt-thanks">Another hop forward.</p>
                <div className="receipt-code">|||| ||| || |||| | |||</div>
              </article>
              <button className="receipt-done" onClick={() => setSessionReceipt(null)}>Tuck it away</button>
            </div>
          </div>
        )}

        {detailsOpen && (
          <PlaceDetailSheet
            spot={selectedSpot}
            stamped={stampedSpots.includes(selectedSpot.id)}
            favorite={favorites.includes(selectedSpot.id)}
            onFavorite={() => toggleFavorite(selectedSpot.id)}
            onStamp={() => {
              const place = placeDirectory.find((item) => item.name === selectedSpot.name);
              if (place) {
                setSelectedPlace(place);
                setPlaceQuery(place.name);
              }
              setSheetMode("stamp");
              setDetailsOpen(false);
              setAddOpen(true);
            }}
            onClose={() => setDetailsOpen(false)}
            onRate={() => {
              const place = placeDirectory.find((item) => item.name === selectedSpot.name) ?? {
                name: selectedSpot.name,
                address: selectedSpot.address,
                area: selectedSpot.area,
                type: selectedSpot.type,
                position: selectedSpot.position,
                hours: selectedSpot.hours,
                openEarly: selectedSpot.openEarly,
                openLate: selectedSpot.openLate,
              };
              setSelectedPlace(place);
              setPlaceQuery(place.name);
              setSheetMode("rate");
              setDetailsOpen(false);
              setAddOpen(true);
            }}
          />
        )}

        {addOpen && (
          <div className="sheet-backdrop" onMouseDown={() => setAddOpen(false)}>
            <section className="add-sheet" onMouseDown={(event) => event.stopPropagation()}>
              <span className="sheet-handle" />
              <button className="sheet-close" onClick={() => setAddOpen(false)} aria-label="Close">
                <Icon name="close" size={20} />
              </button>
              <p className="kicker">{sheetMode === "rate" ? "SHARE YOUR TAKE" : "A NEW FAVORITE?"}</p>
              <h2>{sheetMode === "rate" ? "Rate this spot" : "Stamp a spot"}</h2>
              <p className="sheet-intro">
                {sheetMode === "rate" ? "Add a rating without marking this place visited." : "Find the place, then leave your stamp."}
              </p>
              <form onSubmit={saveNewSpot}>
                {sheetMode === "stamp" ? (
                <PlaceTypeahead
                  label="Find a store or study spot"
                  query={placeQuery}
                  onQueryChange={(value) => {
                    setPlaceQuery(value);
                    setSelectedPlace(null);
                    setPlaceError(false);
                  }}
                  suggestions={placeSuggestions}
                  selected={selectedPlace}
                  onSelect={(place) => {
                    setSelectedPlace(place);
                    setPlaceQuery(place.name);
                    setPlaceError(false);
                  }}
                  error={placeError ? "Choose a place from the search results first." : undefined}
                  required
                />
                ) : selectedPlace ? (
                  <div className="rating-place-summary">
                    <span><Icon name={selectedPlace.type} size={23} /></span>
                    <div><b>{selectedPlace.name}</b><small>{selectedPlace.address}</small></div>
                  </div>
                ) : null}
                {sheetMode === "stamp" && (
                <label>
                  Tiny note
                  <textarea name="note" placeholder="Sunny tables, strong coffee..." />
                </label>
                )}
                <fieldset className={`overall-rating ${ratingError ? "has-error" : ""}`}>
                  <legend>Overall rating <span>required</span></legend>
                  <p>How study-friendly was this spot?</p>
                  <div className="overall-stars" role="radiogroup" aria-label="Overall rating">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        type="button"
                        role="radio"
                        aria-checked={generalRating === score}
                        key={score}
                        className={score <= generalRating ? "filled" : ""}
                        onClick={() => { setGeneralRating(score); setRatingError(false); }}
                        aria-label={`${score} star${score > 1 ? "s" : ""}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <small>{ratingError ? "Please stamp a star rating first." : generalRating ? `${generalRating} out of 5 — noted!` : "Tap a star to rate"}</small>
                </fieldset>

                <button
                  type="button"
                  className={`leave-review ${reviewOpen ? "open" : ""}`}
                  onClick={() => setReviewOpen((open) => !open)}
                  aria-expanded={reviewOpen}
                >
                  <span className="rating-stamp">REVIEW</span>
                  <span><b>{reviewOpen ? "Hide detailed review" : "Leave a review"}</b><small>Optional · add the study details</small></span>
                  <strong>{reviewOpen ? "−" : "+"}</strong>
                </button>

                {reviewOpen && (
                  <fieldset className="study-ratings">
                    <legend>
                      <span><b>Study spot report</b><small>Help other hoppers find their spot</small></span>
                    </legend>
                    <ChoiceMetric
                      label="Noise level"
                      options={["quiet", "chatter", "loud"]}
                      value={reviewDetails.noise}
                      onChange={(noise) => setReviewDetails((details) => ({ ...details, noise }))}
                    />
                    <ChoiceMetric
                      label="Abundance of outlets"
                      options={["every table", "a few tables", "no tables"]}
                      value={reviewDetails.outlets}
                      onChange={(outlets) => setReviewDetails((details) => ({ ...details, outlets }))}
                    />
                    <label className="seat-slider">
                      <span><b>Seating space</b><output>{reviewDetails.seats} people / table</output></span>
                      <input
                        type="range"
                        min="1"
                        max="12"
                        value={reviewDetails.seats}
                        onChange={(event) => setReviewDetails((details) => ({ ...details, seats: Number(event.target.value) }))}
                      />
                      <small><span>solo nook</span><span>big group</span></small>
                    </label>
                    <div className="busyness-input">
                      <div>
                        <b>Busyness by time</b>
                        <select
                          value={reviewDetails.busyDay}
                          onChange={(event) => setReviewDetails((details) => ({ ...details, busyDay: event.target.value }))}
                          aria-label="Day type"
                        >
                          <option>Weekdays</option>
                          <option>Weekends</option>
                        </select>
                      </div>
                      {["8am", "12pm", "4pm", "8pm"].map((time, index) => (
                        <label key={time}>
                          <span>{time}</span>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={reviewDetails.busyness[index]}
                            onChange={(event) => setReviewDetails((details) => {
                              const busyness = [...details.busyness];
                              busyness[index] = Number(event.target.value);
                              return { ...details, busyness };
                            })}
                          />
                          <output>
                            {reviewDetails.busyness[index] < 34 ? "calm" : reviewDetails.busyness[index] < 67 ? "steady" : "busy"}
                          </output>
                        </label>
                      ))}
                    </div>
                    <ChoiceMetric
                      label="Food & goods price"
                      options={["$", "$$", "$$$", "$$$$"]}
                      value={reviewDetails.price}
                      onChange={(price) => setReviewDetails((details) => ({ ...details, price }))}
                    />
                    <ChoiceMetric
                      label="Wi-fi speed / strength"
                      options={["slow", "medium", "fast"]}
                      value={reviewDetails.wifi}
                      onChange={(wifi) => setReviewDetails((details) => ({ ...details, wifi }))}
                    />
                    <label className="vibe-response">
                      <span><b>Da vibes!</b><small>What are people saying?</small></span>
                      <div><em>cozy</em><em>focused</em><em>sunny</em><em>friendly</em></div>
                      <textarea name="vibes" placeholder="Add your own take on the atmosphere..." />
                    </label>
                    <div className="maps-insight hours-insight">
                      <div><b>Hours</b><span>Map data</span></div>
                      <p><strong>Today</strong> · 7am–10pm</p>
                      <label>
                        <input
                          type="checkbox"
                          checked={reviewDetails.openLate}
                          onChange={(event) => setReviewDetails((details) => ({ ...details, openLate: event.target.checked }))}
                        />
                        Open at night, past 9pm
                      </label>
                    </div>
                  </fieldset>
                )}
                <button type="submit" className="stamp-submit">
                  {savedMessage || (sheetMode === "rate" ? "Submit rating" : "Press to save")}
                </button>
              </form>
            </section>
          </div>
        )}
        {/* [supabase] start */}
        {pendingNameAction && (
          <DisplayNamePrompt
            onSave={async (name) => {
              const ok = await auth.setDisplayName(name);
              if (ok) {
                pendingNameAction();
                setPendingNameAction(null);
              }
              return ok;
            }}
            onSkip={() => {
              window.localStorage.setItem("study-hopper-name-skipped", "1");
              pendingNameAction();
              setPendingNameAction(null);
            }}
          />
        )}
        {syncNotice && (
          <p className="supabase-notice" role="status">
            {syncNotice}
            <button type="button" onClick={() => setSyncNotice("")}>ok</button>
          </p>
        )}
        {/* [supabase] end */}
      </section>
    </main>
  );
}
