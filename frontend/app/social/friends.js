/*
 * Friends management screen.
 *
 * Uses the live social connections API for incoming requests, outgoing requests,
 * and active friends so changes stay in sync across the app.
 */
import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AppHeader from "../../src/shared/ui/AppHeader";
import BottomNav from "../../src/shared/ui/BottomNav";
import useMobileFrame from "../../src/shared/hooks/useMobileFrame";
import { resolveApiAssetUrl } from "../../src/services/api/client";
import {
  getConnections,
  removeFriend,
  respondToFriendRequest,
} from "../../src/services/api/socialApi";
import { getAuthToken } from "../../src/services/authSession";

function FriendAvatar({ imageUrl }) {
  const resolvedImageUrl = resolveApiAssetUrl(imageUrl);

  return (
    <View style={styles.friendAvatar}>
      {resolvedImageUrl ? (
        <Image source={{ uri: resolvedImageUrl }} style={styles.friendAvatarImage} />
      ) : (
        <Ionicons name="person-outline" size={16} color="#4EA955" />
      )}
    </View>
  );
}

function FriendSection({ title, emptyText, rows, renderActions }) {
  return (
    <View style={styles.sectionBlock}>
      <Text style={styles.sectionBlockTitle}>{title}</Text>
      {rows.length === 0 ? (
        <Text style={styles.emptyText}>{emptyText}</Text>
      ) : (
        rows.map((friend) => (
          <View key={friend.id} style={styles.friendRow}>
            <FriendAvatar imageUrl={friend.profilePictureUrl} />
            <View style={styles.friendCopy}>
              <Text style={styles.friendName}>{friend.name}</Text>
              <Text style={styles.friendUsername}>@{friend.username}</Text>
            </View>
            <View style={styles.actionsWrap}>{renderActions(friend)}</View>
          </View>
        ))
      )}
    </View>
  );
}

export default function FriendsScreen() {
  const {
    shellPaddingHorizontal,
    shellPaddingVertical,
    innerPaddingHorizontal,
    innerPaddingTop,
    innerPaddingBottom,
    shellMinHeight,
    cardWidth,
  } = useMobileFrame();
  const [connections, setConnections] = useState({
    friends: [],
    pendingIncoming: [],
    pendingOutgoing: [],
  });
  const [notice, setNotice] = useState("");

  useEffect(() => {
    loadConnections();
  }, []);

  async function loadConnections() {
    const token = getAuthToken();

    if (!token) {
      setNotice("Log in to manage friends.");
      setConnections({
        friends: [],
        pendingIncoming: [],
        pendingOutgoing: [],
      });
      return;
    }

    try {
      setConnections(await getConnections(token));
      setNotice("");
    } catch (error) {
      setNotice(error.message || "Could not load friend connections.");
    }
  }

  async function handleAcceptFriend(userId) {
    const token = getAuthToken();

    if (!token) {
      setNotice("Log in again before accepting requests.");
      return;
    }

    try {
      await respondToFriendRequest(token, userId, "accept");
      await loadConnections();
      setNotice("Friend request accepted.");
    } catch (error) {
      setNotice(error.message || "Could not accept friend request.");
    }
  }

  async function handleDeclineFriend(userId) {
    const token = getAuthToken();

    if (!token) {
      setNotice("Log in again before declining requests.");
      return;
    }

    try {
      await respondToFriendRequest(token, userId, "decline");
      await loadConnections();
      setNotice("Friend request declined.");
    } catch (error) {
      setNotice(error.message || "Could not decline friend request.");
    }
  }

  async function handleRemoveFriend(userId, message = "Friend removed.") {
    const token = getAuthToken();

    if (!token) {
      setNotice("Log in again before changing friends.");
      return;
    }

    try {
      await removeFriend(token, userId);
      await loadConnections();
      setNotice(message);
    } catch (error) {
      setNotice(error.message || "Could not update friend connection.");
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.outerShell,
            {
              paddingHorizontal: shellPaddingHorizontal,
              paddingVertical: shellPaddingVertical,
            },
          ]}
        >
          <View
            style={[
              styles.inner,
              {
                minHeight: Math.max(shellMinHeight, 760),
                paddingHorizontal: innerPaddingHorizontal,
                paddingTop: innerPaddingTop,
                paddingBottom: innerPaddingBottom,
              },
            ]}
          >
            <AppHeader title="FRIENDS." />

            <View style={[styles.card, { width: cardWidth }]}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.eyebrow}>Connections</Text>
                  <Text style={styles.sectionTitle}>Friend list</Text>
                </View>
                <Ionicons name="people-outline" size={22} color="#4EA955" />
              </View>

              {notice ? <Text style={styles.notice}>{notice}</Text> : null}

              <FriendSection
                title="Incoming requests"
                emptyText="No incoming friend requests right now."
                rows={connections.pendingIncoming}
                renderActions={(friend) => (
                  <>
                    <Pressable
                      onPress={() => handleAcceptFriend(friend.id)}
                      style={({ pressed }) => [
                        styles.actionButton,
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      <Text style={styles.actionText}>Accept</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleDeclineFriend(friend.id)}
                      style={({ pressed }) => [
                        styles.removeButton,
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      <Text style={styles.removeText}>Decline</Text>
                    </Pressable>
                  </>
                )}
              />

              <FriendSection
                title="Friends"
                emptyText="No active friends yet."
                rows={connections.friends}
                renderActions={(friend) => (
                  <Pressable
                    onPress={() => handleRemoveFriend(friend.id)}
                    style={({ pressed }) => [
                      styles.removeButton,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <Text style={styles.removeText}>Remove</Text>
                  </Pressable>
                )}
              />

              <FriendSection
                title="Sent requests"
                emptyText="No outgoing requests right now."
                rows={connections.pendingOutgoing}
                renderActions={(friend) => (
                  <Pressable
                    onPress={() => handleRemoveFriend(friend.id, "Pending request cancelled.")}
                    style={({ pressed }) => [
                      styles.removeButton,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <Text style={styles.removeText}>Cancel</Text>
                  </Pressable>
                )}
              />
            </View>

            <BottomNav />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FB",
  },
  scrollContent: {
    flexGrow: 1,
  },
  outerShell: {
    flexGrow: 1,
  },
  inner: {
    flexGrow: 1,
    justifyContent: "space-between",
  },
  card: {
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "#CFEFD9",
    borderRadius: 28,
    backgroundColor: "#ECFDF3",
    padding: 18,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "700",
    color: "#83B66E",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  sectionTitle: {
    marginTop: 3,
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },
  notice: {
    marginBottom: 14,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDF4E4",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "700",
    color: "#5E6B7F",
  },
  sectionBlock: {
    marginBottom: 14,
  },
  sectionBlockTitle: {
    marginBottom: 8,
    fontSize: 11,
    fontWeight: "900",
    color: "#83B66E",
    textTransform: "uppercase",
  },
  emptyText: {
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDF4E4",
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 10,
    lineHeight: 16,
    fontWeight: "700",
    color: "#7A8699",
    textAlign: "center",
  },
  friendRow: {
    minHeight: 62,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDF4E4",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    marginBottom: 10,
  },
  friendAvatar: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: "#E7F8EB",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  friendAvatarImage: {
    width: "100%",
    height: "100%",
  },
  friendCopy: {
    flex: 1,
  },
  friendName: {
    fontSize: 12,
    fontWeight: "800",
    color: "#111827",
  },
  friendUsername: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: "700",
    color: "#7A8699",
  },
  actionsWrap: {
    flexDirection: "row",
    gap: 6,
  },
  actionButton: {
    minHeight: 32,
    borderRadius: 999,
    backgroundColor: "#4EA955",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  actionText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#FFFFFF",
    textTransform: "uppercase",
  },
  removeButton: {
    minHeight: 32,
    borderRadius: 999,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  removeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#991B1B",
    textTransform: "uppercase",
  },
  buttonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
});
