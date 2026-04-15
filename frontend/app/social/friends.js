import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AppHeader from "../../components/ui/AppHeader";
import BottomNav from "../../components/ui/BottomNav";
import useMobileFrame from "../../hooks/useMobileFrame";

const starterFriends = [
  { id: "maya", name: "Maya", username: "maya.moves", status: "Added" },
  { id: "rio", name: "Rio", username: "rio.runs", status: "Added" },
  { id: "sam", name: "Sam", username: "sam.lifts", status: "Pending" },
];

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
  const [friends, setFriends] = useState(starterFriends);

  function handleRemoveFriend(id) {
    setFriends((current) => current.filter((friend) => friend.id !== id));
  }

  function handleApproveFriend(id) {
    setFriends((current) =>
      current.map((friend) =>
        friend.id === id ? { ...friend, status: "Added" } : friend,
      ),
    );
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

              {friends.map((friend) => (
                <View key={friend.id} style={styles.friendRow}>
                  <View style={styles.friendAvatar}>
                    <Ionicons name="person-outline" size={16} color="#4EA955" />
                  </View>
                  <View style={styles.friendCopy}>
                    <Text style={styles.friendName}>{friend.name}</Text>
                    <Text style={styles.friendUsername}>@{friend.username}</Text>
                  </View>
                  {friend.status === "Pending" ? (
                    <Pressable
                      onPress={() => handleApproveFriend(friend.id)}
                      style={({ pressed }) => [
                        styles.actionButton,
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      <Text style={styles.actionText}>Accept</Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    onPress={() => handleRemoveFriend(friend.id)}
                    style={({ pressed }) => [
                      styles.removeButton,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <Text style={styles.removeText}>Remove</Text>
                  </Pressable>
                </View>
              ))}
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
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
