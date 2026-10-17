import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors, spacing } from "../theme";
import type { SpotRating, StudySpot } from "../types";

interface SpotDetailSheetProps {
  spot: StudySpot | null;
  isFavorite: boolean;
  rating?: SpotRating;
  onToggleFavorite: () => void;
  onRate: (stars: number) => void;
  onClose: () => void;
}

export default function SpotDetailSheet({
  spot,
  isFavorite,
  rating,
  onToggleFavorite,
  onRate,
  onClose,
}: SpotDetailSheetProps) {
  if (!spot) return null;
  const stars = rating?.stars ?? 0;

  return (
    <View style={styles.sheet}>
      <Pressable style={styles.close} onPress={onClose}>
        <Text style={styles.closeText}>✕</Text>
      </Pressable>
      <Image source={{ uri: spot.image }} style={styles.hero} resizeMode="cover" />
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.title}>{spot.name}</Text>
        <Text style={styles.meta}>{spot.address}</Text>
        <Text style={styles.vibe}>{spot.vibe}</Text>
        <View style={styles.stats}>
          <Stat label="Rating" value={`★ ${spot.rating.toFixed(1)}`} />
          <Stat label="Noise" value={spot.noise} />
          <Stat label="Outlets" value={spot.outlets.replace("-", " ")} />
          <Stat label="Wi-Fi" value={spot.wifi} />
          <Stat label="Seating" value={`${spot.seating}/5`} />
          <Stat label="Hours" value={spot.hours} />
        </View>
        <View style={styles.actions}>
          <Pressable
            style={[styles.saveBtn, isFavorite && styles.saveBtnOn]}
            onPress={onToggleFavorite}
          >
            <Text style={styles.saveText}>
              {isFavorite ? "Saved ♥" : "Save spot"}
            </Text>
          </Pressable>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable key={n} onPress={() => onRate(n)}>
                <Text style={[styles.star, n <= stars && styles.starOn]}>★</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    maxHeight: "52%",
    backgroundColor: colors.cream,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.ink,
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  close: {
    position: "absolute",
    zIndex: 2,
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,250,244,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { color: colors.ink, fontWeight: "700" },
  hero: { width: "100%", height: 148 },
  body: { padding: spacing.md, gap: 6 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.ink,
    fontFamily: "Fraunces_700Bold",
  },
  meta: { color: colors.inkSoft, fontSize: 13 },
  vibe: { color: colors.inkSoft, fontSize: 14, marginBottom: 4 },
  stats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginVertical: 8,
  },
  stat: { width: "30%" },
  statLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    color: colors.inkSoft,
    fontWeight: "700",
  },
  statValue: { fontSize: 13, fontWeight: "700", color: colors.ink },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 4,
  },
  saveBtn: {
    backgroundColor: colors.amber,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  saveBtnOn: { backgroundColor: colors.ink },
  saveText: { color: colors.cream, fontWeight: "700" },
  stars: { flexDirection: "row", gap: 2 },
  star: { fontSize: 22, color: "#c9c2b6" },
  starOn: { color: colors.amber },
});
