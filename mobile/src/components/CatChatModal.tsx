import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { catReply } from "../lib/recommend";
import { colors, spacing } from "../theme";
import type { ChatMessage } from "../types";

interface CatChatModalProps {
  open: boolean;
  onClose: () => void;
  onRecommend: (spotId: string) => void;
}

const STARTER: ChatMessage = {
  id: "welcome",
  role: "cat",
  text: "Mrrp! Tell me what you need — quiet, outlets, close to campus… I'll sniff out a spot.",
};

export default function CatChatModal({
  open,
  onClose,
  onRecommend,
}: CatChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([STARTER]);
  const [input, setInput] = useState("");

  function send() {
    const prompt = input.trim();
    if (!prompt) return;
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text: prompt,
    };
    const reply = catReply(prompt);
    const catMsg: ChatMessage = {
      id: `c-${Date.now()}`,
      role: "cat",
      text: reply.text,
      recommendedSpotId: reply.recommendedSpotId,
    };
    setMessages((prev) => [...prev, userMsg, catMsg]);
    setInput("");
    onRecommend(reply.recommendedSpotId);
  }

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.mascot}>☕🐈</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>AI Cat</Text>
              <Text style={styles.headerSub}>Study spot recommender</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>
          <ScrollView
            contentContainerStyle={styles.messages}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map((m) => (
              <View
                key={m.id}
                style={[
                  styles.bubble,
                  m.role === "user" ? styles.bubbleUser : styles.bubbleCat,
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    m.role === "user" && styles.bubbleTextUser,
                  ]}
                >
                  {m.text}
                </Text>
                {m.recommendedSpotId ? (
                  <Pressable
                    style={styles.jump}
                    onPress={() => {
                      onRecommend(m.recommendedSpotId!);
                      onClose();
                    }}
                  >
                    <Text style={styles.jumpText}>Show on map</Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </ScrollView>
          <View style={styles.form}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="quiet, lots of outlets, close to campus…"
              placeholderTextColor={colors.inkSoft}
              style={styles.input}
              onSubmitEditing={send}
              returnKeyType="send"
            />
            <Pressable style={styles.ask} onPress={send}>
              <Text style={styles.askText}>Ask</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(26,47,35,0.35)",
  },
  sheet: {
    height: "78%",
    backgroundColor: colors.cream,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: spacing.md,
    backgroundColor: colors.ink,
  },
  mascot: { fontSize: 28 },
  headerTitle: {
    color: colors.foam,
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Fraunces_700Bold",
  },
  headerSub: { color: "rgba(244,250,245,0.75)", fontSize: 12 },
  close: { color: colors.foam, fontSize: 18, fontWeight: "700" },
  messages: { padding: spacing.md, gap: 10 },
  bubble: {
    maxWidth: "88%",
    borderRadius: 16,
    padding: 12,
  },
  bubbleCat: {
    alignSelf: "flex-start",
    backgroundColor: colors.sage,
  },
  bubbleUser: {
    alignSelf: "flex-end",
    backgroundColor: colors.ink,
  },
  bubbleText: { color: colors.ink, fontSize: 14, lineHeight: 20 },
  bubbleTextUser: { color: colors.foam },
  jump: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: colors.amber,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  jumpText: { color: colors.cream, fontWeight: "700", fontSize: 12 },
  form: {
    flexDirection: "row",
    gap: 8,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.ink,
    backgroundColor: colors.white,
  },
  ask: {
    backgroundColor: colors.amber,
    borderRadius: 999,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  askText: { color: colors.cream, fontWeight: "700" },
});
