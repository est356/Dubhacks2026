import React, { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { UW_CENTER } from "../data/spots";
import { colors } from "../theme";
import type { StudySpot } from "../types";

interface MapPanelProps {
  spots: StudySpot[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

declare global {
  interface Window {
    __catfeSelectSpot?: (id: string) => void;
  }
}

export default function MapPanel({
  spots,
  selectedId,
  onSelect,
}: MapPanelProps) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.__catfeSelectSpot = onSelect;
    return () => {
      delete window.__catfeSelectSpot;
    };
  }, [onSelect]);

  const srcDoc = useMemo(() => {
    const markers = spots
      .map(
        (s) =>
          `L.marker([${s.lat}, ${s.lng}], {title: ${JSON.stringify(s.name)}})
            .addTo(map)
            .on('click', function(){ parent.__catfeSelectSpot && parent.__catfeSelectSpot(${JSON.stringify(s.id)}); })
            .bindPopup(${JSON.stringify(`<strong>${s.name}</strong><br>★ ${s.rating.toFixed(1)}`)});`,
      )
      .join("\n");

    const focus = spots.find((s) => s.id === selectedId);
    const fly = focus
      ? `map.flyTo([${focus.lat}, ${focus.lng}], 16);`
      : `map.setView([${UW_CENTER.lat}, ${UW_CENTER.lng}], 14);`;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { height: 100%; margin: 0; background: #dfeae0; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false, attributionControl: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);
    ${markers}
    ${fly}
  </script>
</body>
</html>`;
  }, [spots, selectedId]);

  return (
    <View style={styles.wrap}>
      {React.createElement("iframe", {
        title: "Catfe map",
        srcDoc,
        style: {
          border: "none",
          width: "100%",
          height: "100%",
        },
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.sage,
    overflow: "hidden",
  },
});
