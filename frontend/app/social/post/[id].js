/*
 * Social post detail screen.
 *
 * Displays a single post with real likes, comments, and reporting actions.
 */
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Image,
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
import { resolveApiAssetUrl } from "../../../src/services/api/client";
import {
  addComment,
  deleteComment,
  getSocialPost,
  reportContent,
  togglePostLike,
} from "../../../src/services/api/socialApi";
import { getAuthToken } from "../../../src/services/authSession";

function Avatar({ imageUrl, size = 36, iconSize = 16 }) {
  const resolvedImageUrl = resolveApiAssetUrl(imageUrl);

  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      {resolvedImageUrl ? (
        <Image
          source={{ uri: resolvedImageUrl }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      ) : (
        <Ionicons name="person-outline" size={iconSize} color="#4EA955" />
      )}
    </View>
  );
}

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
  const [post, setPost] = useState(null);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("");

  const loadPost = useCallback(async () => {
    const token = getAuthToken();

    if (!token || !id) {
      setNotice("Log in to view this post.");
      return;
    }

    try {
      setPost(await getSocialPost(token, id));
      setNotice("");
    } catch (error) {
      setNotice(error.message || "Could not load this post.");
    }
  }, [id]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  async function handleAddComment() {
    const token = getAuthToken();
    const trimmedDraft = draft.trim();

    if (!token || !trimmedDraft || !post) {
      return;
    }

    try {
      const savedComment = await addComment(token, post.id, { text: trimmedDraft });
      setPost((current) => ({
        ...current,
        comments: [...(current.comments || []), savedComment],
      }));
      setDraft("");
      setNotice("");
    } catch (error) {
      setNotice(error.message || "Could not save comment.");
    }
  }

  async function handleDeleteComment(commentId) {
    const token = getAuthToken();

    if (!token || !post) {
      return;
    }

    try {
      await deleteComment(token, post.id, commentId);
      setPost((current) => ({
        ...current,
        comments: current.comments.filter((comment) => comment.id !== commentId),
      }));
      setNotice("");
    } catch (error) {
      setNotice(error.message || "Could not delete comment.");
    }
  }

  async function handleToggleLike() {
    const token = getAuthToken();

    if (!token || !post) {
      return;
    }

    try {
      const nextLike = await togglePostLike(token, post.id);
      setPost((current) => ({
        ...current,
        likedByMe: nextLike.likedByMe,
        likeCount: nextLike.likeCount,
      }));
    } catch (error) {
      setNotice(error.message || "Could not update like.");
    }
  }

  async function handleReportPost() {
    const token = getAuthToken();

    if (!token || !post) {
      return;
    }

    try {
      await reportContent(token, {
        postId: post.id,
        reason: "Reported from post detail",
      });
      setNotice("Post reported.");
    } catch (error) {
      setNotice(error.message || "Could not report this post.");
    }
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
              {notice ? <Text style={styles.notice}>{notice}</Text> : null}

              {post ? (
                <>
                  <View style={styles.postHeader}>
                    <Avatar imageUrl={post.authorProfilePictureUrl} />
                    <View>
                      <Text style={styles.name}>{post.authorName}</Text>
                      <Text style={styles.username}>@{post.username}</Text>
                    </View>
                  </View>

                  {post.imageUrl ? (
                    <Image
                      source={{ uri: resolveApiAssetUrl(post.imageUrl) }}
                      style={styles.imageBox}
                    />
                  ) : (
                    <View style={[styles.imageBox, styles.imagePlaceholder]}>
                      <Ionicons name="image-outline" size={30} color="#FFFFFF" />
                    </View>
                  )}

                  <Text style={styles.caption}>{post.caption}</Text>

                  <View style={styles.actionRow}>
                    <Pressable
                      onPress={handleToggleLike}
                      style={({ pressed }) => [
                        styles.actionButton,
                        post.likedByMe && styles.actionButtonActive,
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      <Ionicons
                        name={post.likedByMe ? "heart" : "heart-outline"}
                        size={15}
                        color={post.likedByMe ? "#FFFFFF" : "#4EA955"}
                      />
                      <Text style={[styles.actionText, post.likedByMe && styles.actionTextActive]}>
                        Like {post.likeCount ? `(${post.likeCount})` : ""}
                      </Text>
                    </Pressable>
                    {!post.isMine ? (
                      <Pressable
                        onPress={handleReportPost}
                        style={({ pressed }) => [
                          styles.actionButton,
                          pressed && styles.buttonPressed,
                        ]}
                      >
                        <Text style={styles.actionText}>Report</Text>
                      </Pressable>
                    ) : null}
                  </View>

                  <View style={styles.commentsBox}>
                    <Text style={styles.commentsTitle}>Comments</Text>
                    {(post.comments || []).map((comment) => (
                      <View key={comment.id} style={styles.commentRow}>
                        <Avatar
                          imageUrl={comment.authorProfilePictureUrl}
                          size={28}
                          iconSize={13}
                        />
                        <View style={styles.commentCopy}>
                          <Text style={styles.commentText}>
                            <Text style={styles.commentAuthor}>{comment.author}: </Text>
                            {comment.text}
                          </Text>
                        </View>
                        {comment.isMine ? (
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
                </>
              ) : (
                <Text style={styles.emptyText}>Loading post...</Text>
              )}
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
  notice: {
    marginBottom: 12,
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
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  avatar: {
    backgroundColor: "#E7F8EB",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
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
    width: "100%",
    height: 190,
    borderRadius: 24,
    marginBottom: 12,
  },
  imagePlaceholder: {
    backgroundColor: "#83B66E",
    alignItems: "center",
    justifyContent: "center",
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
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 8,
  },
  commentCopy: {
    flex: 1,
  },
  commentText: {
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
  emptyText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#7A8699",
    textAlign: "center",
    paddingVertical: 24,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
