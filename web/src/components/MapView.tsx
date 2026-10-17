"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { StudySpot } from "@/types";
import { UW_CENTER } from "@/data/spots";

const pinIcon = L.divIcon({
  className: "catfe-pin",
  html: `<span class="catfe-pin__dot"></span>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -24],
});

const activePinIcon = L.divIcon({
  className: "catfe-pin catfe-pin--active",
  html: `<span class="catfe-pin__dot"></span>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -28],
});

function FlyTo({ spot }: { spot: StudySpot | null }) {
  const map = useMap();
  useEffect(() => {
    if (!spot) return;
    map.flyTo([spot.lat, spot.lng], 16, { duration: 0.8 });
  }, [spot, map]);
  return null;
}

interface MapViewProps {
  spots: StudySpot[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  favorites: string[];
}

export default function MapView({
  spots,
  selectedId,
  onSelect,
  favorites,
}: MapViewProps) {
  const selected = spots.find((s) => s.id === selectedId) ?? null;

  return (
    <MapContainer
      center={[UW_CENTER.lat, UW_CENTER.lng]}
      zoom={15}
      className="h-full w-full"
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CARTO'
      />
      <FlyTo spot={selected} />
      {spots.map((spot) => (
        <Marker
          key={spot.id}
          position={[spot.lat, spot.lng]}
          icon={spot.id === selectedId ? activePinIcon : pinIcon}
          eventHandlers={{ click: () => onSelect(spot.id) }}
        >
          <Popup>
            <div className="catfe-popup">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={spot.image} alt="" className="catfe-popup__img" />
              <strong>{spot.name}</strong>
              <p>
                ★ {spot.rating.toFixed(1)}
                {favorites.includes(spot.id) ? " · Saved" : ""}
              </p>
              <p className="catfe-popup__meta">
                {spot.noise} · {spot.wifi} wifi · {spot.outlets} outlets
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
