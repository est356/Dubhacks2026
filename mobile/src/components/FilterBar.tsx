import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors, spacing } from "../theme";
import type { SpotFilters } from "../types";

interface FilterBarProps {
  filters: SpotFilters;
  onChange: (next: SpotFilters) => void;
  resultCount: number;
}

const CHIP_WIFI = ["any", "fast", "med", "slow"] as const;
const CHIP_OUTLETS = ["any", "every-table", "few", "none"] as const;
const CHIP_NOISE = ["any", "quiet", "chatter", "loud"] as const;

function ChipRow<T extends string>({
  label,
  options,
  value,
  onPick,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onPick: (v: T) => void;
}) {
  return (
    <View style={styles.chipRow}>
      <Text style={styles.chipLabel}>{label}</Text>
      <View style={styles.chips}>
        {options.map((opt) => {
          const active = opt === value;
          return (
            <Pressable
              key={opt}
              onPress={() => onPick(opt)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {opt === "every-table" ? "every table" : opt}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function FilterBar({
  filters,
  onChange,
  resultCount,
}: FilterBarProps) {
  return (
    <View style={styles.wrap}>
      <TextInput
        value={filters.query}
        onChangeText={(query) => onChange({ ...filters, query })}
        placeholder="Search cafes, libraries, vibes…"
        placeholderTextColor={colors.inkSoft}
        style={styles.search}
      />
      <ChipRow
        label="Wi-Fi"
        options={CHIP_WIFI}
        value={filters.wifi}
        onPick={(wifi) => onChange({ ...filters, wifi })}
      />
      <ChipRow
        label="Outlets"
        options={CHIP_OUTLETS}
        value={filters.outlets}
        onPick={(outlets) => onChange({ ...filters, outlets })}
      />
      <ChipRow
        label="Noise"
        options={CHIP_NOISE}
        value={filters.noise}
        onPick={(noise) => onChange({ ...filters, noise })}
      />
      <Text style={styles.count}>{resultCount} spots nearby</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "rgba(255,250,244,0.94)",
    borderRadius: 18,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.white,
  },
  chipRow: { gap: 4 },
  chipLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.inkSoft,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.sage,
  },
  chipActive: { backgroundColor: colors.ink },
  chipText: { fontSize: 12, fontWeight: "600", color: colors.inkSoft },
  chipTextActive: { color: colors.foam },
  count: { fontSize: 12, color: colors.inkSoft },
});
