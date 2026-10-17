import { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT, Region } from "react-native-maps";
import { UW_CENTER } from "../data/spots";
import { colors } from "../theme";
import type { StudySpot } from "../types";

interface MapPanelProps {
  spots: StudySpot[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function MapPanel({
  spots,
  selectedId,
  onSelect,
}: MapPanelProps) {
  const mapRef = useRef<MapView>(null);
  const selected = spots.find((s) => s.id === selectedId);

  useEffect(() => {
    if (!selected || !mapRef.current) return;
    mapRef.current.animateToRegion(
      {
        latitude: selected.lat,
        longitude: selected.lng,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      },
      450,
    );
  }, [selected]);

  const initial: Region = {
    latitude: UW_CENTER.lat,
    longitude: UW_CENTER.lng,
    latitudeDelta: 0.03,
    longitudeDelta: 0.03,
  };

  return (
    <View style={styles.wrap}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_DEFAULT}
        initialRegion={initial}
        showsUserLocation={false}
        showsCompass={false}
      >
        {spots.map((spot) => (
          <Marker
            key={spot.id}
            coordinate={{ latitude: spot.lat, longitude: spot.lng }}
            title={spot.name}
            description={`★ ${spot.rating.toFixed(1)} · ${spot.noise}`}
            pinColor={spot.id === selectedId ? colors.ink : colors.amber}
            onPress={() => onSelect(spot.id)}
          />
        ))}
      </MapView>
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
