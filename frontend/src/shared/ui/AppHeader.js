/*
 * Shared top app header.
 *
 * Used by the authenticated app screens so profile/settings, social/search,
 * and centered titles stay in the same positions everywhere. Screens can
 * override icons, routes, or press handlers when they need custom behavior.
 */
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { resolveApiAssetUrl } from "../../services/api/client";
import { getCurrentUser, subscribeToSession } from "../../services/authSession";

const BUTTON_GREEN = "#4EA955";

function HeaderIconButton({ icon, imageUri, onPress, accessibilityLabel }) {
  // Small circular icon button reused by both sides of the header.
  // Keeping this private prevents each screen from duplicating header button styling.
  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    setHasImageError(false);
  }, [imageUri]);

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
      {imageUri && !hasImageError ? (
        <Image
          source={{ uri: imageUri }}
          style={styles.headerAvatarImage}
          onError={() => setHasImageError(true)}
        />
      ) : (
        <Ionicons name={icon} size={18} color="#FFFFFF" />
      )}
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
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const headerPhotoUri = currentUser?.profile_picture_preview_url
    || resolveApiAssetUrl(currentUser?.profile_picture_url);

  useEffect(() => subscribeToSession((session) => {
    setCurrentUser(session?.user ?? null);
  }), []);

  // If a screen does not provide custom handlers, the header navigates to default routes.
  // This keeps common screens simple while still allowing custom search/settings actions.
  return (
    <View style={styles.topRow}>
      <View style={styles.leftGroup}>
        <HeaderIconButton
          icon={leftIcon}
          imageUri={headerPhotoUri}
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
  headerAvatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
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
