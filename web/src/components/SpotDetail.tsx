"use client";

import { useState } from "react";
import type { SpotRating, StudySpot } from "@/types";

interface SpotDetailProps {
  spot: StudySpot | null;
  isFavorite: boolean;
  rating?: SpotRating;
  onToggleFavorite: () => void;
  onRate: (stars: number) => void;
  onClose: () => void;
}

export default function SpotDetail({
  spot,
  isFavorite,
  rating,
  onToggleFavorite,
  onRate,
  onClose,
}: SpotDetailProps) {
  const [hoverStar, setHoverStar] = useState(0);

  if (!spot) return null;

  const stars = hoverStar || rating?.stars || 0;

  return (
    <aside className="spot-detail" aria-label={`${spot.name} details`}>
      <button
        type="button"
        className="icon-btn spot-detail__close"
        onClick={onClose}
        aria-label="Close details"
      >
        ✕
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={spot.image} alt="" className="spot-detail__hero" />
      <div className="spot-detail__body">
        <h2>{spot.name}</h2>
        <p className="spot-detail__addr">{spot.address}</p>
        <p className="spot-detail__vibe">{spot.vibe}</p>
        <dl className="spot-detail__stats">
          <div>
            <dt>Rating</dt>
            <dd>★ {spot.rating.toFixed(1)}</dd>
          </div>
          <div>
            <dt>Noise</dt>
            <dd>{spot.noise}</dd>
          </div>
          <div>
            <dt>Outlets</dt>
            <dd>{spot.outlets.replace("-", " ")}</dd>
          </div>
          <div>
            <dt>Wi-Fi</dt>
            <dd>{spot.wifi}</dd>
          </div>
          <div>
            <dt>Seating</dt>
            <dd>{spot.seating}/5</dd>
          </div>
          <div>
            <dt>Hours</dt>
            <dd>{spot.hours}</dd>
          </div>
        </dl>
        <div className="spot-detail__actions">
          <button
            type="button"
            className={`primary-btn ${isFavorite ? "primary-btn--saved" : ""}`}
            onClick={onToggleFavorite}
          >
            {isFavorite ? "Saved ♥" : "Save spot"}
          </button>
          <div
            className="star-rater"
            role="group"
            aria-label="Rate this spot"
            onMouseLeave={() => setHoverStar(0)}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={n <= stars ? "is-on" : ""}
                onMouseEnter={() => setHoverStar(n)}
                onClick={() => onRate(n)}
                aria-label={`${n} stars`}
              >
                ★
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
