/*
 * Shared bottom tab island.
 *
 * The main app screens reuse this component so navigation placement, icon size,
 * and pill styling stay consistent. It intentionally uses route replacement so
 * tab switches feel like changing sections instead of stacking history.
 */
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

const NAV_GREEN = "#4EA955";

const items = [
  // Order here controls the visual order in the tab island.
  // Add new core tabs here only if the app-level navigation changes.
  {
    key: "home",
    ionicon: "home-outline",
    href: "/dashboard",
  },
  {
    key: "log",
    ionicon: "stats-chart-outline",
    href: "/log",
  },
  {
    key: "milestones",
    ionicon: "flame-outline",
    href: "/milestones",
  },
  { key: "ai", ionicon: "sparkles-outline", href: "/ai" },
];

export default function BottomNav({ activeTab }) {
  const router = useRouter();

  return (
    <View style={styles.shell}>
      {items.map((item) => {
        const isActive = item.key === activeTab;

        return (
          <Pressable
            key={item.key}
            onPress={() => router.replace(item.href)}
            style={({ pressed }) => [
              styles.item,
              isActive && styles.activeItem,
              pressed && styles.itemPressed,
            ]}
          >
            <Ionicons
              name={item.ionicon}
              size={28}
              color={isActive ? "#FFFFFF" : "#EAF7EC"}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    borderRadius: 999,
    backgroundColor: NAV_GREEN,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  item: {
    flex: 1,
    minHeight: 52,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  activeItem: {
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  itemPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
