"use client";

import { FRIEND_FEED } from "@/data/friends";

interface FriendFeedProps {
  onJumpToSpot: (spotId: string) => void;
}

export default function FriendFeed({ onJumpToSpot }: FriendFeedProps) {
  return (
    <section className="panel friend-feed" aria-label="Friend activity">
      <header className="panel__header">
        <h2>Friends studying</h2>
        <p>Checked-in status — not live GPS</p>
      </header>
      <ul className="friend-feed__list">
        {FRIEND_FEED.map((friend) => (
          <li key={friend.id}>
            <button
              type="button"
              className="friend-card"
              onClick={() => onJumpToSpot(friend.spotId)}
            >
              <span className="friend-card__avatar" aria-hidden>
                {friend.avatar}
              </span>
              <span className="friend-card__body">
                <strong>{friend.name}</strong>
                <span className="friend-card__status">{friend.status}</span>
                <span className="friend-card__meta">
                  at {friend.spotName} · {friend.durationHours} hrs ·{" "}
                  {friend.checkedInAt}
                </span>
                {friend.spotifyTrack ? (
                  <span className="friend-card__spotify">
                    <span aria-hidden>♪</span> {friend.spotifyTrack}
                    {friend.spotifyArtist ? ` — ${friend.spotifyArtist}` : ""}
                  </span>
                ) : null}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
