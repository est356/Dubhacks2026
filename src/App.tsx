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
  openEarly: boolean;
  openLate: boolean;
  hours: string;
  address: string;
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
};

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
  return studyProfiles[spot.id] ?? {
    noise: spot.highlights[0] || "chatter",
    outlets: spot.highlights[1] || "at a few tables",
    seating: "2–4 people",
    busyness: "moderate right now",
    price: "$$ · $10–20",
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

const starterActivities: Activity[] = [
  { id: 1, friendId: 2, hours: "2.5", place: "Moss & Mugs", subject: "Biology notes", when: "18 min ago" },
  { id: 2, friendId: 3, hours: "1.5", place: "The Reading Room", subject: "Drafting an essay", when: "2 hrs ago" },
  { id: 3, friendId: 4, hours: "3", place: "Juniper Coffee", subject: "Design portfolio", when: "Yesterday" },
];

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

function BunnyIcon() {
  return (
    <svg className="bunny-icon" viewBox="0 0 42 42" role="img" aria-label="Study Hopper bunny">
      <path d="M13.5 16C8.8 10.4 9.7 3.3 12 2.6c2.8-.9 6.1 7.4 6.2 12.2M28.5 16c4.7-5.6 3.8-12.7 1.5-13.4-2.8-.9-6.1 7.4-6.2 12.2" />
      <path d="M8.8 26.2c0-7 5.5-12.2 12.2-12.2s12.2 5.2 12.2 12.2c0 7-5.1 11.3-12.2 11.3S8.8 33.2 8.8 26.2Z" />
      <circle cx="16.7" cy="25.2" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="25.3" cy="25.2" r="1.2" fill="currentColor" stroke="none" />
      <path d="M19.2 29.2c1.2 1 2.4 1 3.6 0M21 27.5v1.8" />
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
      style={{
        left: spot.position.left,
        top: spot.position.top,
        color: spot.color,
        "--spot-color": spot.color,
      } as React.CSSProperties}
      onClick={onClick}
      aria-label={`View ${spot.name}`}
    >
      <span className="stamp-photo">
        <img src={spot.image} alt="" />
      </span>
      <span className="stamp-type-badge">
        <Icon name={spot.type} size={12} />
      </span>
      <span className="stamp-name">{spot.name}</span>
    </button>
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
            <span className="mini-visited" title="You stamped this spot"><Icon name="stamp" size={15} /></span>
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
            <Icon name="stamp" size={17} /> Stamp
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

function FriendActivity({
  activities,
  leaderboardHours,
  selectedFriend,
  setSelectedFriend,
  logOpen,
  setLogOpen,
  onLog,
  onBack,
}: {
  activities: Activity[];
  leaderboardHours: Record<number, number>;
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
  const leaderboard = [...friends]
    .map((friend) => ({ ...friend, total: leaderboardHours[friend.id] ?? 0 }))
    .sort((a, b) => b.total - a.total);
  const leadingHours = Math.max(...leaderboard.map((friend) => friend.total), 1);

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

        <section className="leaderboard-section">
          <div className="section-title">
            <div>
              <p className="kicker">FRIENDLY COMPETITION</p>
              <h2>Study leaderboard</h2>
            </div>
            <span className="week-label">this week</span>
          </div>
          <div className="leaderboard-list">
            {leaderboard.map((friend, index) => (
              <button
                key={friend.id}
                className={`leaderboard-row ${friend.id === 1 ? "is-you" : ""}`}
                onClick={() => setSelectedFriend(friend.id)}
                aria-label={`View ${friend.name}'s activity`}
              >
                <span className="leaderboard-rank">{index + 1}</span>
                <img src={friend.image} alt="" />
                <span className="leaderboard-progress">
                  <span><b>{friend.name}</b><strong>{friend.total.toFixed(friend.total % 1 ? 1 : 0)}h</strong></span>
                  <i><em style={{ width: `${Math.max(9, (friend.total / leadingHours) * 100)}%` }} /></i>
                </span>
              </button>
            ))}
          </div>
          <p className="leaderboard-note">Log a session and watch your bar hop forward.</p>
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
                  <span className="visited-stamp" title="You stamped this spot"><Icon name="stamp" size={18} /></span>
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
                  <Icon name="stamp" size={18} /> Stamp
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
              {[24, 32, 48, 71, 94, 80, 61, 43, 29].map((height, index) => (
                <span key={index}>
                  <i style={{ height: `${height}%` }} />
                  {index % 2 === 0 && <small>{index + 8}</small>}
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
  const [addOpen, setAddOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<"stamp" | "rate">("stamp");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [selectedFriend, setSelectedFriend] = useState<number | null>(null);
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
  });
  const [placeQuery, setPlaceQuery] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [placeError, setPlaceError] = useState(false);
  const [mapView, setMapView] = useState({ x: 0, y: 0, scale: 1 });
  const mapDrag = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const cardDrag = useRef<number | null>(null);
  const touchStart = useRef<number | null>(null);

  const placeSuggestions = useMemo(() => {
    const search = placeQuery.trim().toLowerCase();
    if (search.length < 2 || selectedPlace?.name === placeQuery) return [];
    return placeDirectory
      .filter((place) => `${place.name} ${place.address} ${place.area}`.toLowerCase().includes(search))
      .slice(0, 5);
  }, [placeQuery, selectedPlace]);

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
      };
      setAllSpots((current) => [...current, newSpot]);
      setSelected(newSpot.id);
      if (sheetMode === "stamp") setStampedSpots((current) => [...current, newSpot.id]);
    }
    setFilter("all");
    setPage("places");
    setView("map");
    setSavedMessage(sheetMode === "rate" ? `Rating added for ${name}!` : `${name} stamped into your list!`);
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
    if ((event.target as HTMLElement).closest("button")) return;
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
    setLeaderboardHours((current) => ({
      ...current,
      1: (current[1] ?? 0) + Number(form.get("hours") || 1),
    }));
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
            <h1>Study <span>Hopper</span></h1>
          </div>
          <div className="header-actions">
            <BunnyIcon />
            <button className="round-button" onClick={() => setSearchOpen((open) => !open)} aria-label="Search spots">
              {searchOpen ? <Icon name="close" size={22} /> : <Icon name="search" size={22} />}
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
            onPointerDown={startMapDrag}
            onPointerMove={moveMap}
            onPointerUp={() => { mapDrag.current = null; }}
            onPointerCancel={() => { mapDrag.current = null; }}
            onTouchStart={(event) => event.stopPropagation()}
            onTouchEnd={(event) => event.stopPropagation()}
            onWheel={(event) => {
              event.preventDefault();
              changeZoom(event.deltaY > 0 ? -.12 : .12);
            }}
          >
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
                <Stamp key={spot.id} spot={spot} active={selected === spot.id} onClick={() => setSelected(spot.id)} />
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
                    <span className="mini-visited" title="You stamped this spot"><Icon name="stamp" size={16} /></span>
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
                    aria-label={`Stamp ${selectedSpot.name}`}
                  >
                    <Icon name="stamp" size={20} />
                    <span>Stamp</span>
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
          <span>friends<br /><b>activity</b></span>
          <strong>›</strong>
        </button>
          </>
        ) : (
          <FriendActivity
            activities={activities}
            leaderboardHours={leaderboardHours}
            selectedFriend={selectedFriend}
            setSelectedFriend={setSelectedFriend}
            logOpen={logOpen}
            setLogOpen={setLogOpen}
            onLog={logActivity}
            onBack={() => setPage("places")}
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
                <div className={`place-lookup ${placeError ? "has-error" : ""}`}>
                  <label>
                    Find a store or study spot <span>required</span>
                    <div className="place-search-input">
                      <Icon name="search" size={18} />
                      <input
                        autoComplete="off"
                        value={placeQuery}
                        onChange={(event) => {
                          setPlaceQuery(event.target.value);
                          setSelectedPlace(null);
                          setPlaceError(false);
                        }}
                        placeholder="Start typing a place name..."
                      />
                    </div>
                  </label>
                  {placeSuggestions.length > 0 && (
                    <div className="place-suggestions">
                      {placeSuggestions.map((place) => (
                        <button
                          type="button"
                          key={`${place.name}-${place.address}`}
                          onClick={() => {
                            setSelectedPlace(place);
                            setPlaceQuery(place.name);
                            setPlaceError(false);
                          }}
                        >
                          <span className="suggestion-icon"><Icon name={place.type} size={19} /></span>
                          <span><b>{place.name}</b><small>{place.address} · {place.area}</small></span>
                          <strong>›</strong>
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedPlace && (
                    <div className="selected-place">
                      <span><Icon name={selectedPlace.type} size={24} /></span>
                      <div>
                        <b>{selectedPlace.name}</b>
                        <p>{selectedPlace.address}</p>
                        <small>{selectedPlace.area} · {selectedPlace.hours}</small>
                      </div>
                      <em>✓</em>
                    </div>
                  )}
                  {placeError && <p className="place-error">Choose a place from the search results first.</p>}
                </div>
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
                    <div className="maps-insight">
                      <div><b>Busyness by time</b><span>Map data</span></div>
                      <div className="busy-bars" aria-label="Usually busiest from 11am to 2pm">
                        {[28, 45, 72, 90, 78, 54, 36].map((height, index) => (
                          <i key={index} style={{ height: `${height}%` }} />
                        ))}
                      </div>
                      <small>Usually busiest 11am–2pm</small>
                    </div>
                    <div className="maps-insight compact">
                      <div><b>Food & goods</b><span>Map data</span></div>
                      <p><strong>$$</strong> · Around $10–20 per person</p>
                    </div>
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
      </section>
    </main>
  );
}
