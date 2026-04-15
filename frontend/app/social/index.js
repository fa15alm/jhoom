import Ionicons from "@expo/vector-icons/Ionicons";
import { useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AppHeader from "../../components/ui/AppHeader";
import BottomNav from "../../components/ui/BottomNav";
import useMobileFrame from "../../hooks/useMobileFrame";

const CARD_SPACING = 18;

const FRIENDS = [
  {
    id: "maya",
    name: "Maya",
    username: "maya.moves",
    focus: "Strength and steps",
  },
  {
    id: "rio",
    name: "Rio",
    username: "rio.runs",
    focus: "Cardio streaks",
  },
  {
    id: "sam",
    name: "Sam",
    username: "sam.lifts",
    focus: "Workout consistency",
  },
];

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCurrentWeekKey(date = new Date()) {
  const weekStart = new Date(date);
  const daysSinceMonday = (weekStart.getDay() + 6) % 7;
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - daysSinceMonday);

  return formatDateKey(weekStart);
}

function buildStarterPosts(weekKey) {
  return [
    {
      id: "post-maya-1",
      friendId: "maya",
      authorName: "Maya",
      username: "maya.moves",
      imageTone: "#83B66E",
      caption: "Morning walk done before work. Keeping the week moving.",
      weekKey,
      comments: [
        { id: "comment-1", author: "Rio", text: "That route looks calm." },
        { id: "comment-2", author: "You", text: "Strong start." },
      ],
    },
    {
      id: "post-rio-1",
      friendId: "rio",
      authorName: "Rio",
      username: "rio.runs",
      imageTone: "#6EA878",
      caption: "Easy run today. Saving the legs for intervals tomorrow.",
      weekKey,
      comments: [{ id: "comment-3", author: "Maya", text: "Nice pacing." }],
    },
  ];
}

export default function SocialScreen() {
  const {
    shellPaddingHorizontal,
    shellPaddingVertical,
    innerPaddingHorizontal,
    innerPaddingTop,
    innerPaddingBottom,
    shellMinHeight,
    sliderWidth,
    cardWidth,
  } = useMobileFrame();
  const currentWeekKey = getCurrentWeekKey();
  const [isSearchOpen, setIsSearchOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [addedFriendIds, setAddedFriendIds] = useState(["maya", "rio"]);
  const [pendingFriendIds, setPendingFriendIds] = useState([]);
  const [blockedFriendIds, setBlockedFriendIds] = useState([]);
  const [posts, setPosts] = useState(() => buildStarterPosts(getCurrentWeekKey()));
  const [commentDrafts, setCommentDrafts] = useState({});
  const [caption, setCaption] = useState("");
  const [hasPhoto, setHasPhoto] = useState(false);
  const [likedPostIds, setLikedPostIds] = useState([]);
  const [reportedPostIds, setReportedPostIds] = useState([]);
  const [profileVisibility, setProfileVisibility] = useState("Friends only");
  const [activeFeedIndex, setActiveFeedIndex] = useState(0);
  const feedViewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;
  const onFeedViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0 && viewableItems[0]?.index != null) {
      setActiveFeedIndex(viewableItems[0].index);
    }
  }).current;

  const filteredFriends = FRIENDS.filter((friend) => {
    const query = searchQuery.trim().toLowerCase();

    if (blockedFriendIds.includes(friend.id)) {
      return false;
    }

    if (!query) {
      return true;
    }

    return `${friend.name} ${friend.username} ${friend.focus}`
      .toLowerCase()
      .includes(query);
  });

  // Feed items are filtered by the current week key so old posts naturally drop
  // out when a new week starts. Backend feed data should use the same idea.
  const weeklyPosts = posts.filter(
    (post) =>
      post.weekKey === currentWeekKey &&
      !blockedFriendIds.includes(post.friendId) &&
      (post.friendId === "you" || addedFriendIds.includes(post.friendId)),
  );

  function handleAddFriend(friendId) {
    setPendingFriendIds((current) =>
      current.includes(friendId) || addedFriendIds.includes(friendId)
        ? current
        : [...current, friendId],
    );
  }

  function handleApprovePendingFriend(friendId) {
    setPendingFriendIds((current) => current.filter((id) => id !== friendId));
    setAddedFriendIds((current) =>
      current.includes(friendId) ? current : [...current, friendId],
    );
  }

  function handleCommentChange(postId, value) {
    setCommentDrafts((current) => ({
      ...current,
      [postId]: value,
    }));
  }

  function handleAddComment(postId) {
    const draft = commentDrafts[postId]?.trim();

    if (!draft) {
      return;
    }

    // Comments are local for now; this is where post comments should be saved
    // to the backend and synced into the friend's weekly feed.
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: [
                ...post.comments,
                {
                  id: `comment-${postId}-${Date.now()}`,
                  author: "You",
                  text: draft,
                },
              ],
            }
          : post,
      ),
    );
    setCommentDrafts((current) => ({ ...current, [postId]: "" }));
  }

  function handleDeleteComment(postId, commentId) {
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: post.comments.filter((comment) => comment.id !== commentId),
            }
          : post,
      ),
    );
  }

  function handleToggleLike(postId) {
    setLikedPostIds((current) =>
      current.includes(postId)
        ? current.filter((id) => id !== postId)
        : [...current, postId],
    );
  }

  function handleReportPost(postId) {
    setReportedPostIds((current) =>
      current.includes(postId) ? current : [...current, postId],
    );
  }

  function handleBlockFriend(friendId) {
    setBlockedFriendIds((current) =>
      current.includes(friendId) ? current : [...current, friendId],
    );
    setAddedFriendIds((current) => current.filter((id) => id !== friendId));
    setPendingFriendIds((current) => current.filter((id) => id !== friendId));
  }

  function handleCreatePost() {
    const trimmedCaption = caption.trim();

    if (!trimmedCaption && !hasPhoto) {
      return;
    }

    // Replace the placeholder photo state with an image picker/upload when the
    // real media storage flow is connected.
    setPosts((current) => [
      {
        id: `post-you-${Date.now()}`,
        friendId: "you",
        authorName: "You",
        username: "you",
        imageTone: "#4EA955",
        caption: trimmedCaption || "Photo update",
        weekKey: currentWeekKey,
        comments: [],
      },
      ...current,
    ]);
    setCaption("");
    setHasPhoto(false);
    setActiveFeedIndex(0);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
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
                minHeight: Math.max(shellMinHeight, 860),
                paddingHorizontal: innerPaddingHorizontal,
                paddingTop: innerPaddingTop,
                paddingBottom: innerPaddingBottom,
              },
            ]}
          >
            <AppHeader
              title="SOCIAL."
              rightIcon="search-outline"
              rightAccessibilityLabel="Search friends"
              onRightPress={() => setIsSearchOpen((current) => !current)}
            />

            <View style={styles.contentSection}>
              {isSearchOpen ? (
                <View style={[styles.searchCard, { width: cardWidth }]}>
                  <View style={styles.sectionHeader}>
                    <View>
                      <Text style={styles.eyebrow}>Find friends</Text>
                      <Text style={styles.sectionTitle}>Search username</Text>
                    </View>
                    <Ionicons name="person-add-outline" size={22} color="#4EA955" />
                  </View>

                  <View style={styles.searchInputWrap}>
                    <Ionicons name="search-outline" size={18} color="#7A8699" />
                    <TextInput
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      autoCapitalize="none"
                      placeholder="username..."
                      placeholderTextColor="#7A8699"
                      style={styles.searchInput}
                    />
                  </View>

                  <View style={styles.friendList}>
                    {filteredFriends.map((friend) => {
                      const isAdded = addedFriendIds.includes(friend.id);
                      const isPending = pendingFriendIds.includes(friend.id);

                      return (
                        <View key={friend.id} style={styles.friendRow}>
                          <View style={styles.friendAvatar}>
                            <Ionicons name="person-outline" size={16} color="#4EA955" />
                          </View>
                          <View style={styles.friendCopy}>
                            <Text style={styles.friendName}>{friend.name}</Text>
                            <Text style={styles.friendUsername}>@{friend.username}</Text>
                          </View>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={
                              isAdded || isPending
                                ? `${friend.username} ${isPending ? "pending" : "added"}`
                                : `Add ${friend.username}`
                            }
                            disabled={isAdded || isPending}
                            onPress={() => handleAddFriend(friend.id)}
                            style={({ pressed }) => [
                              styles.addButton,
                              (isAdded || isPending) && styles.addButtonAdded,
                              pressed && !isAdded && !isPending && styles.buttonPressed,
                            ]}
                          >
                            <Text style={styles.addButtonText}>
                              {isPending ? "Pending" : isAdded ? "Added" : "Add"}
                            </Text>
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>

                  {pendingFriendIds.length > 0 ? (
                    <View style={styles.pendingBox}>
                      <Text style={styles.pendingTitle}>Pending requests</Text>
                      {pendingFriendIds.map((friendId) => {
                        const friend = FRIENDS.find((item) => item.id === friendId);

                        if (!friend) {
                          return null;
                        }

                        return (
                          <View key={friend.id} style={styles.pendingRow}>
                            <Text style={styles.pendingName}>@{friend.username}</Text>
                            <Pressable
                              onPress={() => handleApprovePendingFriend(friend.id)}
                              style={({ pressed }) => [
                                styles.approveButton,
                                pressed && styles.buttonPressed,
                              ]}
                            >
                              <Text style={styles.approveText}>Approve</Text>
                            </Pressable>
                          </View>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
              ) : null}

              <View style={[styles.feedSection, { width: sliderWidth }]}>
                <View style={[styles.sectionHeader, { width: cardWidth }]}>
                  <View>
                    <Text style={styles.eyebrow}>Friends feed</Text>
                    <Text style={styles.sectionTitle}>Weekly posts</Text>
                  </View>
                  <Ionicons name="chatbubble-ellipses-outline" size={22} color="#4EA955" />
                </View>

                {weeklyPosts.length > 0 ? (
                  <>
                    <FlatList
                      data={weeklyPosts}
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      style={styles.feedCarousel}
                      keyExtractor={(post) => post.id}
                      contentContainerStyle={styles.feedCarouselContent}
                      renderItem={({ item: post }) => (
                        <View
                          key={post.id}
                          style={[styles.postCard, { width: cardWidth }]}
                        >
                          {reportedPostIds.includes(post.id) ? (
                            <Text style={styles.reportedText}>Reported</Text>
                          ) : null}

                          <View style={styles.postHeader}>
                            <View style={styles.friendAvatar}>
                              <Ionicons name="person-outline" size={15} color="#4EA955" />
                            </View>
                            <View>
                              <Text style={styles.friendName}>{post.authorName}</Text>
                              <Text style={styles.friendUsername}>@{post.username}</Text>
                            </View>
                          </View>

                          <View
                            style={[
                              styles.postImage,
                              { backgroundColor: post.imageTone },
                            ]}
                          >
                            <Ionicons name="image-outline" size={28} color="#FFFFFF" />
                          </View>

                          <Text style={styles.postCaption}>{post.caption}</Text>

                          <View style={styles.postActions}>
                            <Pressable
                              onPress={() => handleToggleLike(post.id)}
                              style={({ pressed }) => [
                                styles.postActionButton,
                                likedPostIds.includes(post.id) && styles.postActionButtonActive,
                                pressed && styles.buttonPressed,
                              ]}
                            >
                              <Ionicons
                                name={likedPostIds.includes(post.id) ? "heart" : "heart-outline"}
                                size={15}
                                color={likedPostIds.includes(post.id) ? "#FFFFFF" : "#4EA955"}
                              />
                              <Text
                                style={[
                                  styles.postActionText,
                                  likedPostIds.includes(post.id) && styles.postActionTextActive,
                                ]}
                              >
                                Like
                              </Text>
                            </Pressable>
                            {post.friendId !== "you" ? (
                              <>
                                <Pressable
                                  onPress={() => handleReportPost(post.id)}
                                  style={({ pressed }) => [
                                    styles.postActionButton,
                                    pressed && styles.buttonPressed,
                                  ]}
                                >
                                  <Text style={styles.postActionText}>Report</Text>
                                </Pressable>
                                <Pressable
                                  onPress={() => handleBlockFriend(post.friendId)}
                                  style={({ pressed }) => [
                                    styles.postActionButton,
                                    pressed && styles.buttonPressed,
                                  ]}
                                >
                                  <Text style={styles.postActionText}>Block</Text>
                                </Pressable>
                              </>
                            ) : null}
                          </View>

                          <View style={styles.commentsBox}>
                            <Text style={styles.commentsTitle}>Comments</Text>
                            <ScrollView
                              style={styles.commentsScroll}
                              nestedScrollEnabled
                              showsVerticalScrollIndicator={false}
                            >
                              {post.comments.length > 0 ? (
                                post.comments.map((comment) => (
                                  <View key={comment.id} style={styles.commentRow}>
                                    <Text style={styles.commentText}>
                                      <Text style={styles.commentAuthor}>
                                        {comment.author}:{" "}
                                      </Text>
                                      {comment.text}
                                    </Text>
                                    {comment.author === "You" ? (
                                      <Pressable
                                        onPress={() => handleDeleteComment(post.id, comment.id)}
                                      >
                                        <Text style={styles.deleteCommentText}>Delete</Text>
                                      </Pressable>
                                    ) : null}
                                  </View>
                                ))
                              ) : (
                                <Text style={styles.emptyComments}>
                                  No comments yet.
                                </Text>
                              )}
                            </ScrollView>

                            <View style={styles.commentInputRow}>
                              <TextInput
                                value={commentDrafts[post.id] ?? ""}
                                onChangeText={(value) => handleCommentChange(post.id, value)}
                                placeholder="Add comment..."
                                placeholderTextColor="#7A8699"
                                style={styles.commentInput}
                              />
                              <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Send comment"
                                onPress={() => handleAddComment(post.id)}
                                style={({ pressed }) => [
                                  styles.commentSendButton,
                                  pressed && styles.buttonPressed,
                                ]}
                              >
                                <Ionicons name="send-outline" size={16} color="#FFFFFF" />
                              </Pressable>
                            </View>
                          </View>
                        </View>
                      )}
                      viewabilityConfig={feedViewabilityConfig}
                      onViewableItemsChanged={onFeedViewableItemsChanged}
                    />

                    <View style={styles.dotsRow}>
                      {weeklyPosts.map((post, index) => (
                        <View
                          key={`${post.id}-dot`}
                          style={[
                            styles.dot,
                            index === activeFeedIndex && styles.activeDot,
                          ]}
                        />
                      ))}
                    </View>
                  </>
                ) : (
                  <View style={[styles.emptyFeed, { width: cardWidth }]}>
                    <Ionicons name="people-outline" size={26} color="#4EA955" />
                    <Text style={styles.emptyFeedTitle}>No posts this week</Text>
                    <Text style={styles.emptyFeedText}>
                      Add friends or post a photo to start the weekly feed.
                    </Text>
                  </View>
                )}
              </View>

              <View style={[styles.composeCard, { width: cardWidth }]}>
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={styles.eyebrow}>This week</Text>
                    <Text style={styles.sectionTitle}>Compose post</Text>
                  </View>
                  <Ionicons name="camera-outline" size={22} color="#4EA955" />
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Upload a photo"
                  onPress={() => setHasPhoto((current) => !current)}
                  style={({ pressed }) => [
                    styles.uploadBox,
                    hasPhoto && styles.uploadBoxActive,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Ionicons
                    name={hasPhoto ? "checkmark-circle-outline" : "image-outline"}
                    size={24}
                    color={hasPhoto ? "#FFFFFF" : "#4EA955"}
                  />
                  <Text style={[styles.uploadText, hasPhoto && styles.uploadTextActive]}>
                    {hasPhoto ? "Photo selected" : "Upload photo"}
                  </Text>
                </Pressable>

                <TextInput
                  value={caption}
                  onChangeText={setCaption}
                  multiline
                  maxLength={160}
                  placeholder="Caption..."
                  placeholderTextColor="#7A8699"
                  style={styles.captionInput}
                />

                <View style={styles.composeFooter}>
                  <Text style={styles.characterCount}>{caption.length}/160</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Post to feed"
                    onPress={handleCreatePost}
                    style={({ pressed }) => [
                      styles.postButton,
                      !caption.trim() && !hasPhoto && styles.postButtonDisabled,
                      pressed && (caption.trim() || hasPhoto) && styles.buttonPressed,
                    ]}
                  >
                    <Text style={styles.postButtonText}>Post</Text>
                  </Pressable>
                </View>
              </View>

              <View style={[styles.privacyCard, { width: cardWidth }]}>
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={styles.eyebrow}>Privacy</Text>
                    <Text style={styles.sectionTitle}>Social visibility</Text>
                  </View>
                  <Ionicons name="shield-checkmark-outline" size={22} color="#4EA955" />
                </View>
                <View style={styles.visibilityRow}>
                  {["Friends only", "Private"].map((option) => {
                    const isSelected = profileVisibility === option;

                    return (
                      <Pressable
                        key={option}
                        onPress={() => setProfileVisibility(option)}
                        style={({ pressed }) => [
                          styles.visibilityChip,
                          isSelected && styles.visibilityChipSelected,
                          pressed && styles.buttonPressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.visibilityText,
                            isSelected && styles.visibilityTextSelected,
                          ]}
                        >
                          {option}
                        </Text>
                      </Pressable>
                    );
                  })}
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
  contentSection: {
    flex: 1,
    alignItems: "center",
    gap: 16,
    paddingBottom: 24,
  },
  searchCard: {
    borderWidth: 1,
    borderColor: "#CFEFD9",
    borderRadius: 28,
    backgroundColor: "#F4FFF7",
    padding: 18,
    shadowColor: "rgba(78, 169, 85, 0.14)",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 1,
    shadowRadius: 26,
    elevation: 4,
  },
  composeCard: {
    borderWidth: 1,
    borderColor: "#CFEFD9",
    borderRadius: 28,
    backgroundColor: "#ECFDF3",
    padding: 18,
  },
  privacyCard: {
    borderWidth: 1,
    borderColor: "#CFEFD9",
    borderRadius: 28,
    backgroundColor: "#F4FFF7",
    padding: 18,
  },
  feedSection: {
    alignItems: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
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
    letterSpacing: 0.2,
  },
  searchInputWrap: {
    minHeight: 48,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CFEFD9",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    paddingVertical: 10,
  },
  friendList: {
    gap: 10,
  },
  friendRow: {
    minHeight: 58,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDF4E4",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
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
  addButton: {
    minWidth: 60,
    minHeight: 34,
    borderRadius: 999,
    backgroundColor: "#4EA955",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  addButtonAdded: {
    backgroundColor: "#A8C995",
  },
  addButtonText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
    textTransform: "uppercase",
  },
  pendingBox: {
    marginTop: 12,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDF4E4",
    padding: 12,
    gap: 8,
  },
  pendingTitle: {
    fontSize: 10,
    fontWeight: "900",
    color: "#83B66E",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  pendingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  pendingName: {
    fontSize: 12,
    fontWeight: "800",
    color: "#111827",
  },
  approveButton: {
    minHeight: 30,
    borderRadius: 999,
    backgroundColor: "#4EA955",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  approveText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FFFFFF",
    textTransform: "uppercase",
  },
  uploadBox: {
    minHeight: 74,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CFEFD9",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 12,
  },
  uploadBoxActive: {
    backgroundColor: "#4EA955",
    borderColor: "#4EA955",
  },
  uploadText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#4EA955",
    textTransform: "uppercase",
  },
  uploadTextActive: {
    color: "#FFFFFF",
  },
  captionInput: {
    minHeight: 76,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CFEFD9",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    textAlignVertical: "top",
  },
  composeFooter: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  characterCount: {
    fontSize: 11,
    fontWeight: "700",
    color: "#83B66E",
  },
  postButton: {
    minWidth: 86,
    minHeight: 40,
    borderRadius: 999,
    backgroundColor: "#4EA955",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  postButtonDisabled: {
    backgroundColor: "#A8C995",
  },
  postButtonText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#FFFFFF",
    textTransform: "uppercase",
  },
  feedCarousel: {
    flexGrow: 0,
    width: "100%",
  },
  feedCarouselContent: {
    alignItems: "center",
  },
  postCard: {
    height: 560,
    marginHorizontal: CARD_SPACING,
    borderRadius: 30,
    backgroundColor: "#ECFDF3",
    borderWidth: 1,
    borderColor: "#CFEFD9",
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  postImage: {
    height: 168,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  postCaption: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    color: "#3F4858",
    marginBottom: 10,
  },
  reportedText: {
    alignSelf: "flex-end",
    borderRadius: 999,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 9,
    fontWeight: "900",
    color: "#991B1B",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  postActions: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  postActionButton: {
    minHeight: 30,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CFEFD9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 10,
  },
  postActionButtonActive: {
    backgroundColor: "#4EA955",
    borderColor: "#4EA955",
  },
  postActionText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#4EA955",
    textTransform: "uppercase",
  },
  postActionTextActive: {
    color: "#FFFFFF",
  },
  commentsBox: {
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDF4E4",
    padding: 10,
  },
  commentsTitle: {
    fontSize: 10,
    fontWeight: "900",
    color: "#83B66E",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  commentsScroll: {
    maxHeight: 96,
    marginBottom: 10,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#D7DEE8",
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: "#111827",
  },
  commentText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "700",
    color: "#3F4858",
    marginBottom: 5,
  },
  commentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  deleteCommentText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#991B1B",
    textTransform: "uppercase",
  },
  commentAuthor: {
    color: "#111827",
    fontWeight: "900",
  },
  emptyComments: {
    fontSize: 11,
    fontWeight: "700",
    color: "#7A8699",
    marginBottom: 4,
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
  },
  commentInput: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
    paddingVertical: 8,
  },
  commentSendButton: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: "#4EA955",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyFeed: {
    height: 560,
    marginHorizontal: CARD_SPACING,
    borderRadius: 30,
    backgroundColor: "#ECFDF3",
    borderWidth: 1,
    borderColor: "#CFEFD9",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 18,
  },
  emptyFeedTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#111827",
  },
  emptyFeedText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    color: "#7A8699",
    textAlign: "center",
  },
  visibilityRow: {
    flexDirection: "row",
    gap: 10,
  },
  visibilityChip: {
    flex: 1,
    minHeight: 40,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CFEFD9",
    alignItems: "center",
    justifyContent: "center",
  },
  visibilityChipSelected: {
    backgroundColor: "#4EA955",
    borderColor: "#4EA955",
  },
  visibilityText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#111827",
    textTransform: "uppercase",
  },
  visibilityTextSelected: {
    color: "#FFFFFF",
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
