/*
 * Social post detail screen.
 *
 * Displays one post with comments and simple reaction controls. The route uses
 * the dynamic `[id]` segment so a feed card can deep-link to a specific post.
 * Later, the post, comments, likes, and moderation state should be fetched from
 * `socialApi` by this id.
 */
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AppHeader from "../../../src/shared/ui/AppHeader";
import BottomNav from "../../../src/shared/ui/BottomNav";
import useMobileFrame from "../../../src/shared/hooks/useMobileFrame";

export default function SocialPostScreen() {
  const { id } = useLocalSearchParams();
  const {
    shellPaddingHorizontal,
    shellPaddingVertical,
    innerPaddingHorizontal,
    innerPaddingTop,
    innerPaddingBottom,
    shellMinHeight,
    cardWidth,
  } = useMobileFrame();
  const [comments, setComments] = useState([
    { id: "comment-1", author: "Maya", text: "Strong update." },
    { id: "comment-2", author: "You", text: "Nice work this week." },
  ]);
  const [draft, setDraft] = useState("");
  const [liked, setLiked] = useState(false);

  function handleAddComment() {
    // Mirrors the feed comment flow for a single-post detail route.
    // Replace this local append with socialApi.addComment when persistence exists.
    const trimmedDraft = draft.trim();

    if (!trimmedDraft) {
      return;
    }

    setComments((current) => [
      ...current,
      { id: `comment-${Date.now()}`, author: "You", text: trimmedDraft },
    ]);
    setDraft("");
  }

  function handleDeleteComment(commentId) {
    // Local delete for comments authored by the current user.
    // Backend permissions should decide who is allowed to delete which comments.
    setComments((current) => current.filter((comment) => comment.id !== commentId));
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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
                minHeight: Math.max(shellMinHeight, 780),
                paddingHorizontal: innerPaddingHorizontal,
                paddingTop: innerPaddingTop,
                paddingBottom: innerPaddingBottom,
              },
            ]}
          >
            <AppHeader title="POST." />

            <View style={[styles.card, { width: cardWidth }]}>
              <View style={styles.postHeader}>
                <View style={styles.avatar}>
                  <Ionicons name="person-outline" size={16} color="#4EA955" />
                </View>
                <View>
                  <Text style={styles.name}>Weekly post</Text>
                  <Text style={styles.username}>Post #{id ?? "preview"}</Text>
                </View>
              </View>

              <View style={styles.imageBox}>
                <Ionicons name="image-outline" size={30} color="#FFFFFF" />
              </View>

              <Text style={styles.caption}>
                Post detail view with comments, reactions, and moderation controls.
              </Text>

              <View style={styles.actionRow}>
                <Pressable
                  onPress={() => setLiked((current) => !current)}
                  style={({ pressed }) => [
                    styles.actionButton,
                    liked && styles.actionButtonActive,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Ionicons
                    name={liked ? "heart" : "heart-outline"}
                    size={15}
                    color={liked ? "#FFFFFF" : "#4EA955"}
                  />
                  <Text style={[styles.actionText, liked && styles.actionTextActive]}>
                    Like
                  </Text>
                </Pressable>
                <Pressable style={styles.actionButton}>
                  <Text style={styles.actionText}>Report</Text>
                </Pressable>
              </View>

              <View style={styles.commentsBox}>
                <Text style={styles.commentsTitle}>Comments</Text>
                {comments.map((comment) => (
                  <View key={comment.id} style={styles.commentRow}>
                    <Text style={styles.commentText}>
                      <Text style={styles.commentAuthor}>{comment.author}: </Text>
                      {comment.text}
                    </Text>
                    {comment.author === "You" ? (
                      <Pressable onPress={() => handleDeleteComment(comment.id)}>
                        <Text style={styles.deleteText}>Delete</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ))}

                <View style={styles.commentInputRow}>
                  <TextInput
                    value={draft}
                    onChangeText={setDraft}
                    placeholder="Add comment..."
                    placeholderTextColor="#7A8699"
                    style={styles.commentInput}
                  />
                  <Pressable
                    onPress={handleAddComment}
                    style={({ pressed }) => [
                      styles.sendButton,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <Ionicons name="send-outline" size={16} color="#FFFFFF" />
                  </Pressable>
                </View>
              </View>
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
    borderRadius: 30,
    backgroundColor: "#ECFDF3",
    borderWidth: 1,
    borderColor: "#CFEFD9",
    padding: 18,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: "#E7F8EB",
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontSize: 12,
    fontWeight: "800",
    color: "#111827",
  },
  username: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: "700",
    color: "#7A8699",
  },
  imageBox: {
    height: 190,
    borderRadius: 24,
    backgroundColor: "#83B66E",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  caption: {
    fontSize: 12,
    lineHeight: 19,
    fontWeight: "700",
    color: "#3F4858",
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  actionButton: {
    minHeight: 32,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CFEFD9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 12,
  },
  actionButtonActive: {
    backgroundColor: "#4EA955",
    borderColor: "#4EA955",
  },
  actionText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#4EA955",
    textTransform: "uppercase",
  },
  actionTextActive: {
    color: "#FFFFFF",
  },
  commentsBox: {
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDF4E4",
    padding: 12,
  },
  commentsTitle: {
    fontSize: 10,
    fontWeight: "900",
    color: "#83B66E",
    textTransform: "uppercase",
    marginBottom: 10,
  },
  commentRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  commentText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "700",
    color: "#3F4858",
  },
  commentAuthor: {
    color: "#111827",
    fontWeight: "900",
  },
  deleteText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#991B1B",
    textTransform: "uppercase",
  },
  commentInputRow: {
    minHeight: 42,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CFEFD9",
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 14,
    paddingRight: 5,
    gap: 8,
    marginTop: 8,
  },
  commentInput: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: "#4EA955",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
