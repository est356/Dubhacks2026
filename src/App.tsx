import { useMemo, useRef, useState } from "react";

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
  },
];

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

const starterActivities: Activity[] = [
  { id: 1, friendId: 2, hours: "2.5", place: "Moss & Mugs", subject: "Biology notes", when: "18 min ago" },
  { id: 2, friendId: 3, hours: "1.5", place: "The Reading Room", subject: "Drafting an essay", when: "2 hrs ago" },
  { id: 3, friendId: 4, hours: "3", place: "Juniper Coffee", subject: "Design portfolio", when: "Yesterday" },
];

function Icon({
  name,
  size = 24,
}: {
  name: "coffee" | "library" | "outdoors" | "map" | "list" | "heart" | "plus" | "search" | "close";
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
    <button
      className={`map-stamp ${active ? "map-stamp--active" : ""}`}
      style={{ left: spot.position.left, top: spot.position.top, color: spot.color }}
      onClick={onClick}
      aria-label={`View ${spot.name}`}
    >
      <span className="stamp-ring">
        <Icon name={spot.type} size={29} />
      </span>
      <span className="stamp-name">{spot.name.split(" ")[0]}</span>
    </button>
  );
}

function SpotCard({
  spot,
  favorite,
  onFavorite,
}: {
  spot: Spot;
  favorite: boolean;
  onFavorite: () => void;
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
        <button
          className={`heart-button ${favorite ? "is-favorite" : ""}`}
          onClick={onFavorite}
          aria-label={favorite ? `Remove ${spot.name} from favorites` : `Favorite ${spot.name}`}
        >
          <Icon name="heart" size={21} />
        </button>
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

function FriendActivity({
  activities,
  selectedFriend,
  setSelectedFriend,
  logOpen,
  setLogOpen,
  onLog,
  onBack,
}: {
  activities: Activity[];
  selectedFriend: number | null;
  setSelectedFriend: (id: number | null) => void;
  logOpen: boolean;
  setLogOpen: (open: boolean) => void;
  onLog: (event: React.FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
}) {
  const filteredActivities = selectedFriend
    ? activities.filter((activity) => activity.friendId === selectedFriend)
    : activities;
  const activeFriend = friends.find((friend) => friend.id === selectedFriend);

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
          <label>
            <span>Spot</span>
            <select name="place" defaultValue="Moss & Mugs">
              {spots.map((spot) => <option key={spot.id}>{spot.name}</option>)}
            </select>
          </label>
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
            <span className="week-label">this week</span>
          </div>
          <div className="friend-row">
            {friends.map((friend) => (
              <button
                key={friend.id}
                className={selectedFriend === friend.id ? "active" : ""}
                onClick={() => setSelectedFriend(selectedFriend === friend.id ? null : friend.id)}
                style={{ "--friend-color": friend.color } as React.CSSProperties}
              >
                <span className="friend-photo">
                  <img src={friend.image} alt={friend.name} />
                  <b>{friend.hours}</b>
                </span>
                <strong>{friend.name}</strong>
                <small>{friend.sessions} sessions</small>
              </button>
            ))}
          </div>
        </section>

        <section className="feed-section">
          <div className="section-title">
            <div>
              <p className="kicker">THE LATEST</p>
              <h2>{activeFriend ? `${activeFriend.name}'s week` : "Friends are studying"}</h2>
            </div>
            {selectedFriend && <button onClick={() => setSelectedFriend(null)}>See all</button>}
          </div>
          <div className="activity-feed">
            {filteredActivities.length ? filteredActivities.map((activity, index) => {
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

      </div>
    </section>
  );
}

const ratingCategories = [
  { key: "outlets", label: "Outlet availability", low: "none", high: "plenty" },
  { key: "noise", label: "Noise level", low: "silent", high: "lively" },
  { key: "seating", label: "Seating space", low: "tight", high: "roomy" },
  { key: "busyness", label: "Busyness level", low: "calm", high: "packed" },
  { key: "price", label: "Food price range", low: "$", high: "$$$$" },
  { key: "wifi", label: "Wi-fi speed / strength", low: "spotty", high: "zippy" },
  { key: "atmosphere", label: "Study atmosphere", low: "not ideal", high: "perfect" },
  { key: "hours", label: "Store hours", low: "short", high: "open late" },
] as const;

function RatingScale({
  label,
  low,
  high,
  value,
  onChange,
}: {
  label: string;
  low: string;
  high: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="rating-row">
      <div className="rating-label"><strong>{label}</strong><span>{value}/5</span></div>
      <div className="rating-scale" role="group" aria-label={`${label}: ${value} out of 5`}>
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            type="button"
            key={score}
            className={score <= value ? "filled" : ""}
            onClick={() => onChange(score)}
            aria-label={`${score} out of 5`}
          >
            {label.includes("price") ? "$" : "★"}
          </button>
        ))}
      </div>
      <div className="rating-ends"><span>{low}</span><span>{high}</span></div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState<"places" | "friends">("places");
  const [view, setView] = useState<"map" | "list">("map");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(1);
  const [favorites, setFavorites] = useState<number[]>([1, 3]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [selectedFriend, setSelectedFriend] = useState<number | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [activities, setActivities] = useState(starterActivities);
  const [newSpotRatings, setNewSpotRatings] = useState<Record<string, number>>(
    Object.fromEntries(ratingCategories.map((category) => [category.key, 3])),
  );
  const touchStart = useRef<number | null>(null);

  const visibleSpots = useMemo(
    () =>
      spots.filter(
        (spot) =>
          (filter === "all" || spot.type === filter || (filter === "saved" && favorites.includes(spot.id))) &&
          spot.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [filter, favorites, query],
  );

  const selectedSpot = spots.find((spot) => spot.id === selected) ?? spots[0];

  function toggleFavorite(id: number) {
    setFavorites((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function saveNewSpot(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "New spot");
    setSavedMessage(`${name} stamped into your list!`);
    setTimeout(() => {
      setAddOpen(false);
      setSavedMessage("");
    }, 1200);
  }

  function logActivity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setActivities((current) => [
      {
        id: Date.now(),
        friendId: 1,
        hours: String(form.get("hours") || "1"),
        place: String(form.get("place") || "Moss & Mugs"),
        subject: String(form.get("subject") || "Study session"),
        when: "Just now",
      },
      ...current,
    ]);
    setSelectedFriend(null);
    setLogOpen(false);
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
            <p className="kicker">YOUR LITTLE FIELD GUIDE</p>
            <h1>Study <span>Spots</span></h1>
          </div>
          <button className="round-button" onClick={() => setSearchOpen((open) => !open)} aria-label="Search spots">
            {searchOpen ? <Icon name="close" size={22} /> : <Icon name="search" size={22} />}
          </button>
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
            ["coffee", "Coffee"],
            ["library", "Libraries"],
            ["outdoors", "Outside"],
            ["saved", "Saved"],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={filter === value ? "active" : ""}
            >
              {label}
            </button>
          ))}
        </div>

        {view === "map" ? (
          <section className="map-view">
            <div className="map-landmark landmark-one">OLD TOWN</div>
            <div className="map-landmark landmark-two">GARDEN DISTRICT</div>
            <div className="park park-one" />
            <div className="park park-two" />
            <div className="river" />
            {visibleSpots.map((spot) => (
              <Stamp key={spot.id} spot={spot} active={selected === spot.id} onClick={() => setSelected(spot.id)} />
            ))}
            <div className="you-are-here"><span /> YOU ARE HERE</div>
            {visibleSpots.length === 0 && <p className="no-results">No stamps here yet.</p>}
            <div className="map-card">
              <div className="mini-photo">
                <img src={selectedSpot.image} alt="" />
              </div>
              <div className="map-card-copy">
                <p className="eyebrow">{selectedSpot.area} · {selectedSpot.walk}</p>
                <h2>{selectedSpot.name}</h2>
                <div className="map-rating">
                  <b>★ {selectedSpot.rating}</b>
                  <span>{selectedSpot.reviews} ratings</span>
                  <i>{selectedSpot.highlights[0]}</i>
                </div>
                <p>{selectedSpot.note}</p>
              </div>
              <button
                className={`heart-button ${favorites.includes(selectedSpot.id) ? "is-favorite" : ""}`}
                onClick={() => toggleFavorite(selectedSpot.id)}
                aria-label="Toggle favorite"
              >
                <Icon name="heart" size={20} />
              </button>
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
                favorite={favorites.includes(spot.id)}
                onFavorite={() => toggleFavorite(spot.id)}
              />
            ))}
            {visibleSpots.length === 0 && <p className="empty-list">Nothing found — try another stamp.</p>}
          </section>
        )}

        <button className="friends-peek" onClick={() => setPage("friends")}>
          <span className="peek-faces">
            {friends.slice(1, 4).map((friend) => <img key={friend.id} src={friend.image} alt="" />)}
          </span>
          <span>friends<br /><b>activity</b></span>
          <strong>›</strong>
        </button>
          </>
        ) : (
          <FriendActivity
            activities={activities}
            selectedFriend={selectedFriend}
            setSelectedFriend={setSelectedFriend}
            logOpen={logOpen}
            setLogOpen={setLogOpen}
            onLog={logActivity}
            onBack={() => setPage("places")}
          />
        )}

        <button className="add-button" onClick={() => setAddOpen(true)} aria-label="Add a new study spot">
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

        {addOpen && (
          <div className="sheet-backdrop" onMouseDown={() => setAddOpen(false)}>
            <section className="add-sheet" onMouseDown={(event) => event.stopPropagation()}>
              <span className="sheet-handle" />
              <button className="sheet-close" onClick={() => setAddOpen(false)} aria-label="Close">
                <Icon name="close" size={20} />
              </button>
              <p className="kicker">A NEW FAVORITE?</p>
              <h2>Stamp a spot</h2>
              <p className="sheet-intro">Save a nook worth coming back to.</p>
              <form onSubmit={saveNewSpot}>
                <label>
                  Spot name
                  <input required name="name" placeholder="e.g. Corner Cup" />
                </label>
                <label>
                  Neighborhood
                  <input required name="area" placeholder="Where is it?" />
                </label>
                <label>
                  Tiny note
                  <textarea name="note" placeholder="Sunny tables, strong coffee..." />
                </label>
                <fieldset className="study-ratings">
                  <legend>
                    <span className="rating-stamp">RATE IT</span>
                    <span><b>Study spot report</b><small>Tap the stamps that fit</small></span>
                  </legend>
                  {ratingCategories.map((category) => (
                    <RatingScale
                      key={category.key}
                      label={category.label}
                      low={category.low}
                      high={category.high}
                      value={newSpotRatings[category.key]}
                      onChange={(value) => setNewSpotRatings((ratings) => ({ ...ratings, [category.key]: value }))}
                    />
                  ))}
                  <label className="exact-hours">
                    Usual store hours
                    <input name="storeHours" placeholder="e.g. Mon–Fri · 7am–9pm" />
                  </label>
                </fieldset>
                <button type="submit" className="stamp-submit">
                  {savedMessage || "Press to save"}
                </button>
              </form>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
