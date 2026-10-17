import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { FRIEND_FEED } from "../data/friends";
import { colors, spacing } from "../theme";

interface FriendFeedProps {
  onJumpToSpot: (spotId: string) => void;
}

export default function FriendFeed({ onJumpToSpot }: FriendFeedProps) {
  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.title}>Friends studying</Text>
      <Text style={styles.sub}>Checked-in status — not live GPS</Text>
      {FRIEND_FEED.map((friend) => (
        <Pressable
          key={friend.id}
          style={styles.card}
          onPress={() => onJumpToSpot(friend.spotId)}
        >
          <Text style={styles.avatar}>{friend.avatar}</Text>
          <View style={styles.body}>
            <Text style={styles.name}>{friend.name}</Text>
            <Text style={styles.status}>{friend.status}</Text>
            <Text style={styles.meta}>
              at {friend.spotName} · {friend.durationHours} hrs ·{" "}
              {friend.checkedInAt}
            </Text>
            {friend.spotifyTrack ? (
              <Text style={styles.spotify}>
                ♪ {friend.spotifyTrack}
                {friend.spotifyArtist ? ` — ${friend.spotifyArtist}` : ""}
              </Text>
            ) : null}
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.lg, gap: spacing.sm, paddingBottom: 40 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.ink,
    fontFamily: "Fraunces_700Bold",
  },
  sub: { color: colors.inkSoft, marginBottom: spacing.sm },
  card: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "rgba(223,234,224,0.7)",
    borderRadius: 16,
    padding: spacing.md,
  },
  avatar: { fontSize: 28 },
  body: { flex: 1, gap: 2 },
  name: { fontWeight: "700", color: colors.ink, fontSize: 16 },
  status: { color: colors.ink, fontSize: 14 },
  meta: { color: colors.inkSoft, fontSize: 12 },
  spotify: { color: "#2f6b4f", fontSize: 12, marginTop: 2 },
});
