import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

const BUTTON_GREEN = "#4EA955";

function HeaderIconButton({ icon, onPress, accessibilityLabel }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.headerButton,
        pressed && styles.headerButtonPressed,
      ]}
    >
      <Ionicons name={icon} size={18} color="#FFFFFF" />
    </Pressable>
  );
}

export default function AppHeader({
  title,
  leftAccessory = null,
  leftIcon = "person-outline",
  leftAccessibilityLabel = "Open settings",
  leftHref = "/settings",
  onLeftPress,
  rightIcon = "people-outline",
  rightAccessibilityLabel = "Open social",
  rightHref = "/social",
  onRightPress,
}) {
  const router = useRouter();

  return (
    <View style={styles.topRow}>
      <View style={styles.leftGroup}>
        <HeaderIconButton
          icon={leftIcon}
          accessibilityLabel={leftAccessibilityLabel}
          onPress={onLeftPress ?? (() => router.push(leftHref))}
        />

        {leftAccessory}
      </View>

      <View pointerEvents="none" style={styles.titleWrap}>
        <Text style={styles.title}>{title}</Text>
      </View>

      <HeaderIconButton
        icon={rightIcon}
        accessibilityLabel={rightAccessibilityLabel}
        onPress={onRightPress ?? (() => router.push(rightHref))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 40,
    paddingTop: 8,
    marginBottom: 28,
  },
  leftGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  titleWrap: {
    position: "absolute",
    top: 8,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: BUTTON_GREEN,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "rgba(78, 169, 85, 0.28)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 4,
  },
  headerButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  title: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
    letterSpacing: 0.1,
    fontFamily: Platform.select({
      ios: "Georgia",
      android: "serif",
      default: "serif",
    }),
    textShadowColor: "rgba(78, 169, 85, 0.65)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
});
