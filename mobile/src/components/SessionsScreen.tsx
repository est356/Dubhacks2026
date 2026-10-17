import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { STUDY_SPOTS } from "../data/spots";
import { colors, spacing } from "../theme";
import type { StudySession } from "../types";

interface SessionsScreenProps {
  sessions: StudySession[];
  defaultSpotId?: string | null;
  onSave: (session: StudySession) => void;
}

export default function SessionsScreen({
  sessions,
  defaultSpotId,
  onSave,
}: SessionsScreenProps) {
  const [spotId, setSpotId] = useState(defaultSpotId ?? STUDY_SPOTS[0]!.id);
  const [minutes, setMinutes] = useState("90");
  const [note, setNote] = useState("");
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [flash, setFlash] = useState(false);

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  function submit() {
    const spot = STUDY_SPOTS.find((s) => s.id === spotId);
    if (!spot) return;
    onSave({
      id: `sess-${Date.now()}`,
      spotId: spot.id,
      spotName: spot.name,
      startedAt: new Date().toISOString(),
      durationMinutes: Number(minutes) || 90,
      note,
      photoUri,
    });
    setNote("");
    setPhotoUri(undefined);
    setFlash(true);
    setTimeout(() => setFlash(false), 1600);
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Log a session</Text>
      <Text style={styles.sub}>Like Strava — but for study hours</Text>

      <Text style={styles.label}>Spot</Text>
      <View style={styles.spotPicker}>
        {STUDY_SPOTS.map((s) => {
          const active = s.id === spotId;
          return (
            <Pressable
              key={s.id}
              onPress={() => setSpotId(s.id)}
              style={[styles.spotChip, active && styles.spotChipOn]}
            >
              <Text style={[styles.spotChipText, active && styles.spotChipTextOn]}>
                {s.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Minutes</Text>
      <TextInput
        value={minutes}
        onChangeText={setMinutes}
        keyboardType="number-pad"
        style={styles.input}
      />

      <Text style={styles.label}>Note</Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="Crushed problem set 3"
        placeholderTextColor={colors.inkSoft}
        style={styles.input}
      />

      <Pressable style={styles.photoBtn} onPress={pickPhoto}>
        <Text style={styles.photoBtnText}>
          {photoUri ? "Change photo" : "Add photo"}
        </Text>
      </Pressable>
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.preview} />
      ) : null}

      <Pressable style={styles.save} onPress={submit}>
        <Text style={styles.saveText}>{flash ? "Saved ✓" : "Save session"}</Text>
      </Pressable>

      {sessions.length > 0 ? (
        <View style={styles.history}>
          <Text style={styles.historyTitle}>Recent</Text>
          {sessions.slice(0, 6).map((s) => (
            <View key={s.id} style={styles.historyCard}>
              <Text style={styles.historyName}>{s.spotName}</Text>
              <Text style={styles.historyMeta}>
                {s.durationMinutes} min ·{" "}
                {new Date(s.startedAt).toLocaleDateString()}
              </Text>
              {s.note ? <Text style={styles.historyNote}>{s.note}</Text> : null}
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.lg, gap: 8, paddingBottom: 48 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.ink,
    fontFamily: "Fraunces_700Bold",
  },
  sub: { color: colors.inkSoft, marginBottom: 8 },
  label: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "700",
    color: colors.inkSoft,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  spotPicker: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  spotChip: {
    backgroundColor: colors.sage,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  spotChipOn: { backgroundColor: colors.ink },
  spotChipText: { fontSize: 12, fontWeight: "600", color: colors.inkSoft },
  spotChipTextOn: { color: colors.foam },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.ink,
    backgroundColor: colors.white,
  },
  photoBtn: {
    marginTop: 8,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  photoBtnText: { color: colors.ink, fontWeight: "600" },
  preview: {
    width: "100%",
    height: 140,
    borderRadius: 14,
    marginTop: 6,
  },
  save: {
    marginTop: 12,
    backgroundColor: colors.amber,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveText: { color: colors.cream, fontWeight: "700", fontSize: 16 },
  history: { marginTop: 20, gap: 8 },
  historyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.ink,
    fontFamily: "Fraunces_700Bold",
  },
  historyCard: {
    backgroundColor: "rgba(223,234,224,0.65)",
    borderRadius: 14,
    padding: 12,
    gap: 2,
  },
  historyName: { fontWeight: "700", color: colors.ink },
  historyMeta: { color: colors.inkSoft, fontSize: 12 },
  historyNote: { color: colors.inkSoft, fontSize: 13 },
});
