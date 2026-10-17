"use client";

import { FormEvent, useRef, useState } from "react";
import type { StudySession, StudySpot } from "@/types";

interface SessionLoggerProps {
  spots: StudySpot[];
  sessions: StudySession[];
  defaultSpotId?: string | null;
  onSave: (session: StudySession) => void;
}

export default function SessionLogger({
  spots,
  sessions,
  defaultSpotId,
  onSave,
}: SessionLoggerProps) {
  const [spotId, setSpotId] = useState(defaultSpotId ?? spots[0]?.id ?? "");
  const [minutes, setMinutes] = useState(90);
  const [note, setNote] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>();
  const [savedFlash, setSavedFlash] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function onPhoto(file: File | undefined) {
    if (!file) {
      setPhotoDataUrl(undefined);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhotoDataUrl(String(reader.result));
    reader.readAsDataURL(file);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const spot = spots.find((s) => s.id === spotId);
    if (!spot) return;

    onSave({
      id: `sess-${Date.now()}`,
      spotId: spot.id,
      spotName: spot.name,
      startedAt: new Date().toISOString(),
      durationMinutes: minutes,
      note,
      photoDataUrl,
    });
    setNote("");
    setPhotoDataUrl(undefined);
    if (fileRef.current) fileRef.current.value = "";
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1800);
  }

  return (
    <section className="panel session-logger" aria-label="Log study session">
      <header className="panel__header">
        <h2>Log a session</h2>
        <p>Like Strava — but for study hours</p>
      </header>
      <form className="session-logger__form" onSubmit={submit}>
        <label>
          Spot
          <select
            value={spotId}
            onChange={(e) => setSpotId(e.target.value)}
          >
            {spots.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Minutes
          <input
            type="number"
            min={15}
            step={15}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
          />
        </label>
        <label>
          Note
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Crushed problem set 3"
          />
        </label>
        <label>
          Photo
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={(e) => onPhoto(e.target.files?.[0])}
          />
        </label>
        {photoDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoDataUrl} alt="Session preview" className="session-logger__preview" />
        ) : null}
        <button type="submit" className="primary-btn">
          {savedFlash ? "Saved ✓" : "Save session"}
        </button>
      </form>
      {sessions.length > 0 ? (
        <ul className="session-logger__history">
          {sessions.slice(0, 4).map((s) => (
            <li key={s.id}>
              <strong>{s.spotName}</strong>
              <span>
                {s.durationMinutes} min ·{" "}
                {new Date(s.startedAt).toLocaleDateString()}
              </span>
              {s.note ? <em>{s.note}</em> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
