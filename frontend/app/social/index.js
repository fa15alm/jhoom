/*
 * Social feed screen.
 *
 * Handles friend search, weekly feed posts, comments, likes, reporting, blocking,
 * and composing a new weekly post.
 */
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AppHeader from "../../src/shared/ui/AppHeader";
import BottomNav from "../../src/shared/ui/BottomNav";
import useMobileFrame from "../../src/shared/hooks/useMobileFrame";
import { getPagedCarouselIndex } from "../../src/shared/utils/carousel";
import { resolveApiAssetUrl } from "../../src/services/api/client";
import { getMyProfile, updateMyProfile } from "../../src/services/api/profileApi";
import {
  addComment,
  blockUser,
  createPost,
  deleteComment,
  getConnections,
  getWeeklyFeed,
  respondToFriendRequest,
  reportContent,
  searchUsers,
  sendFriendRequest,
  togglePostLike,
} from "../../src/services/api/socialApi";
import { uploadSocialPostImage } from "../../src/services/api/uploadApi";
import { getAuthToken } from "../../src/services/authSession";

const CARD_SPACING = 18;

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCurrentWeekKey(date = new Date()) {
  // Weekly feeds reset on Monday by comparing posts to this generated week key.
  // Backend posts should store or derive the same week key so old feed content
  // drops out consistently across devices.
  const weekStart = new Date(date);
  const daysSinceMonday = (weekStart.getDay() + 6) % 7;
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - daysSinceMonday);

  return formatDateKey(weekStart);
}

function Avatar({ imageUrl, size = 34, iconSize = 16 }) {
  const resolvedImageUrl = resolveApiAssetUrl(imageUrl);

  return (
    <View style={[styles.friendAvatar, { width: size, height: size, borderRadius: size / 2 }]}>
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

export default function SocialScreen() {
  const router = useRouter();
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
  const [friends, setFriends] = useState([]);
  const [connections, setConnections] = useState({
    friends: [],
    pendingIncoming: [],
    pendingOutgoing: [],
  });
  const [blockedFriendIds, setBlockedFriendIds] = useState([]);
  const [posts, setPosts] = useState([]);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [caption, setCaption] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [likedPostIds, setLikedPostIds] = useState([]);
  const [reportedPostIds, setReportedPostIds] = useState([]);
  const [profileVisibility, setProfileVisibility] = useState("Friends only");
  const [activeFeedIndex, setActiveFeedIndex] = useState(0);
  const [socialNotice, setSocialNotice] = useState("");
  // Track which swipe card is most visible so the pagination dots stay in sync.
  const feedViewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;
  const onFeedViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0 && viewableItems[0]?.index != null) {
      setActiveFeedIndex(viewableItems[0].index);
    }
  }).current;

  function handleFeedScroll(event) {
    setActiveFeedIndex(getPagedCarouselIndex(event, sliderWidth, weeklyPosts.length));
  }

  const loadSocialData = useCallback(async () => {
    const token = getAuthToken();

    if (!token) {
      setPosts([]);
      setFriends([]);
      setConnections({
        friends: [],
        pendingIncoming: [],
        pendingOutgoing: [],
      });
      return;
    }

    try {
      const [feed, nextConnections] = await Promise.all([
        getWeeklyFeed(token),
        getConnections(token),
        loadFriendSearch(searchQuery),
      ]);
      setPosts(feed);
      setConnections(nextConnections);
      setSocialNotice("");
    } catch (error) {
      setSocialNotice(error.message || "Could not load social feed.");
      setPosts([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadSocialData();
  }, [loadSocialData]);

  useFocusEffect(
    useCallback(() => {
      loadSocialData();
    }, [loadSocialData])
  );

  useEffect(() => {
    loadSocialVisibility();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadFriendSearch(searchQuery);
    }, 250);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  async function loadFriendSearch(query) {
    const token = getAuthToken();

    if (!token) {
      setFriends([]);
      return;
    }

    try {
      const trimmedQuery = query.trim();

      if (!trimmedQuery) {
        setFriends([]);
        return;
      }

      const results = await searchUsers(token, trimmedQuery);
      setFriends(results);
    } catch {
      setFriends([]);
    }
  }

  async function loadSocialVisibility() {
    const token = getAuthToken();

    if (!token) {
      return;
    }

    try {
      const profile = await getMyProfile(token);
      setProfileVisibility(
        profile.is_dob_public || profile.is_age_public || profile.is_height_public || profile.is_weight_public
          ? "Friends only"
          : "Private"
      );
    } catch {
      // Keep default if the profile request fails.
    }
  }

  const filteredFriends = friends.filter((friend) => {
    // Search is local now. Backend search should apply the same blocked-user
    // filtering server-side so blocked people do not reappear.
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
  const addedFriendIds = connections.friends.map((friend) => friend.id);
  const pendingIncomingIds = connections.pendingIncoming.map((friend) => friend.id);
  const pendingOutgoingIds = connections.pendingOutgoing.map((friend) => friend.id);

  // Feed items are filtered by the current week key so old posts naturally drop
  // out when a new week starts. Backend feed data should use the same idea.
  const weeklyPosts = posts.filter(
    (post) =>
      !blockedFriendIds.includes(post.friendId) &&
      (post.friendId === "you" || addedFriendIds.includes(post.friendId)),
  );

  async function handleAddFriend(friendId) {
    const token = getAuthToken();

    if (token && Number.isFinite(Number(friendId))) {
      try {
        const response = await sendFriendRequest(token, friendId);
        if (response.status === "accepted") {
          setSocialNotice("Friend added.");
          const [nextConnections, nextFeed] = await Promise.all([
            getConnections(token),
            getWeeklyFeed(token),
          ]);
          setConnections(nextConnections);
          setPosts(nextFeed);
        } else {
          setSocialNotice("Friend request sent.");
          setConnections(await getConnections(token));
        }
      } catch (error) {
        setSocialNotice(error.message || "Could not send friend request.");
        return;
      }
    }
  }

  async function handleApprovePendingFriend(friendId) {
    const token = getAuthToken();

    if (!token) {
      setSocialNotice("Log in again before accepting requests.");
      return;
    }

    try {
      await respondToFriendRequest(token, friendId, "accept");
      const [nextConnections, nextFeed] = await Promise.all([
        getConnections(token),
        getWeeklyFeed(token),
      ]);
      setConnections(nextConnections);
      setPosts(nextFeed);
      setSocialNotice("Friend request accepted.");
    } catch (error) {
      setSocialNotice(error.message || "Could not accept friend request.");
    }
  }

  async function handleDeclinePendingFriend(friendId) {
    const token = getAuthToken();

    if (!token) {
      setSocialNotice("Log in again before declining requests.");
      return;
    }

    try {
      await respondToFriendRequest(token, friendId, "decline");
      setConnections(await getConnections(token));
      setSocialNotice("Friend request declined.");
    } catch (error) {
      setSocialNotice(error.message || "Could not decline friend request.");
    }
  }

  function handleCommentChange(postId, value) {
    setCommentDrafts((current) => ({
      ...current,
      [postId]: value,
    }));
  }

  async function handleAddComment(postId) {
    const draft = commentDrafts[postId]?.trim();

    if (!draft) {
      return;
    }

    const token = getAuthToken();
    let savedComment = {
      id: `comment-${postId}-${Date.now()}`,
      author: "You",
      text: draft,
    };

    if (token && Number.isFinite(Number(postId))) {
      try {
        savedComment = await addComment(token, postId, { text: draft });
      } catch (error) {
        setSocialNotice(error.message || "Could not save comment.");
        return;
      }
    }

    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: [...post.comments, savedComment],
            }
          : post,
      ),
    );
    setCommentDrafts((current) => ({ ...current, [postId]: "" }));
  }

  async function handleDeleteComment(postId, commentId) {
    const token = getAuthToken();

    if (token && Number.isFinite(Number(postId)) && Number.isFinite(Number(commentId))) {
      try {
        await deleteComment(token, postId, commentId);
      } catch (error) {
        setSocialNotice(error.message || "Could not delete comment.");
        return;
      }
    }

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

  async function handleToggleLike(postId) {
    const token = getAuthToken();

    if (token && Number.isFinite(Number(postId))) {
      try {
        const nextLike = await togglePostLike(token, postId);
        setPosts((current) =>
          current.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  likedByMe: nextLike.likedByMe,
                  likeCount: nextLike.likeCount,
                }
              : post,
          ),
        );
      } catch (error) {
        setSocialNotice(error.message || "Could not update like.");
      }
      return;
    }

    setLikedPostIds((current) =>
      current.includes(postId)
        ? current.filter((id) => id !== postId)
        : [...current, postId],
    );
  }

  async function handleReportPost(postId) {
    const token = getAuthToken();

    if (token && Number.isFinite(Number(postId))) {
      try {
        await reportContent(token, {
          postId,
          reason: "Reported from social feed",
        });
      } catch (error) {
        setSocialNotice(error.message || "Could not submit report.");
        return;
      }
    }

    setReportedPostIds((current) =>
      current.includes(postId) ? current : [...current, postId],
    );
  }

  async function handleBlockFriend(friendId) {
    // Blocking removes the user from all local social views immediately.
    // Backend blocking should also prevent future search/feed/comment visibility.
    const token = getAuthToken();

    if (token && Number.isFinite(Number(friendId))) {
      try {
        await blockUser(token, friendId);
      } catch (error) {
        setSocialNotice(error.message || "Could not block user.");
        return;
      }
    }

    setBlockedFriendIds((current) =>
      current.includes(friendId) ? current : [...current, friendId],
    );
    if (token) {
      try {
        const [nextConnections, nextFeed] = await Promise.all([
          getConnections(token),
          getWeeklyFeed(token),
        ]);
        setConnections(nextConnections);
        setPosts(nextFeed);
      } catch {
        // Keep the local blocked state even if refresh fails.
      }
    }
  }

  function handleSelectPostPhoto() {
    if (typeof document === "undefined") {
      setSocialNotice("Photo uploads are available in the web app.");
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = () => {
      const file = input.files?.[0];

      if (!file) {
        return;
      }

      if (!file.type.startsWith("image/")) {
        setSocialNotice("Choose an image file for your post.");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setSelectedPhoto({
          name: file.name,
          uri: reader.result,
        });
        setSocialNotice("");
      };
      reader.onerror = () => {
        setSocialNotice("Could not read that image.");
      };
      reader.readAsDataURL(file);
    };

    input.click();
  }

  async function handleCreatePost() {
    const trimmedCaption = caption.trim();

    if (!trimmedCaption && !selectedPhoto?.uri) {
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setSocialNotice("Log in again before posting.");
      return;
    }
    let savedPost = {
        id: `post-you-${Date.now()}`,
        friendId: "you",
        authorName: "You",
        username: "you",
        imageTone: "#4EA955",
        caption: trimmedCaption || "Photo update",
        imageUrl: selectedPhoto?.uri || null,
        weekKey: currentWeekKey,
        comments: [],
      };

    try {
      let uploadedImageUrl = null;

      if (selectedPhoto?.uri) {
        const uploadedImage = await uploadSocialPostImage(token, {
          dataUrl: selectedPhoto.uri,
          filename: selectedPhoto.name,
        });
        uploadedImageUrl = uploadedImage.url;
      }

      savedPost = await createPost(token, {
        caption: trimmedCaption,
        imageUrl: uploadedImageUrl,
      });
    } catch (error) {
      setSocialNotice(error.message || "Could not create post.");
      return;
    }

    setPosts((current) => [savedPost, ...current]);
    setCaption("");
    setSelectedPhoto(null);
    setActiveFeedIndex(0);
    setSocialNotice("");
  }

  async function handleChangeProfileVisibility(option) {
    setProfileVisibility(option);
    const token = getAuthToken();

    if (!token) {
      setSocialNotice("Log in again before changing social visibility.");
      return;
    }

    const isVisible = option === "Friends only";

    try {
      await updateMyProfile(token, {
        is_dob_public: isVisible,
        is_age_public: isVisible,
        is_height_public: isVisible,
        is_weight_public: isVisible,
      });
      setSocialNotice(`Social visibility saved as ${option}.`);
    } catch (error) {
      setSocialNotice(error.message || "Could not update social visibility.");
    }
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

                  {socialNotice ? (
                    <Text style={styles.pendingTitle}>{socialNotice}</Text>
                  ) : null}

                  <View style={styles.friendList}>
                    {filteredFriends.length > 0 ? (
                      filteredFriends.map((friend) => {
                        const isAdded = addedFriendIds.includes(friend.id);
                        const hasIncomingRequest = pendingIncomingIds.includes(friend.id);
                        const hasOutgoingRequest = pendingOutgoingIds.includes(friend.id);
                        const isPending = hasIncomingRequest || hasOutgoingRequest;
                        const actionLabel = hasIncomingRequest
                          ? "Accept"
                          : hasOutgoingRequest
                            ? "Pending"
                            : isAdded
                              ? "Added"
                              : "Add";
                        const canSendRequest = !isAdded && !isPending;

                        return (
                          <View key={friend.id} style={styles.friendRow}>
                            <Avatar imageUrl={friend.profilePictureUrl} />
                            <View style={styles.friendCopy}>
                              <Text style={styles.friendName}>{friend.name}</Text>
                              <Text style={styles.friendUsername}>@{friend.username}</Text>
                            </View>
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel={
                                canSendRequest
                                  ? `Add ${friend.username}`
                                  : `${friend.username} ${actionLabel.toLowerCase()}`
                              }
                              disabled={hasOutgoingRequest || isAdded}
                              onPress={() => (
                                hasIncomingRequest
                                  ? handleApprovePendingFriend(friend.id)
                                  : handleAddFriend(friend.id)
                              )}
                              style={({ pressed }) => [
                                styles.addButton,
                                (isAdded || isPending) && styles.addButtonAdded,
                                pressed && canSendRequest && styles.buttonPressed,
                              ]}
                            >
                              <Text style={styles.addButtonText}>{actionLabel}</Text>
                            </Pressable>
                          </View>
                        );
                      })
                    ) : (
                      <Text style={styles.searchEmptyText}>
                        {searchQuery.trim()
                          ? "No users matched that username."
                          : "Search by username to find friends."}
                      </Text>
                    )}
                  </View>

                  {pendingIncomingIds.length > 0 ? (
                    <View style={styles.pendingBox}>
                      <Text style={styles.pendingTitle}>Pending requests</Text>
                      {connections.pendingIncoming.map((friend) => {

                        return (
                          <View key={friend.id} style={styles.pendingRow}>
                            <Text style={styles.pendingName}>@{friend.username}</Text>
                            <View style={styles.pendingActions}>
                              <Pressable
                                onPress={() => handleApprovePendingFriend(friend.id)}
                                style={({ pressed }) => [
                                  styles.approveButton,
                                  pressed && styles.buttonPressed,
                                ]}
                              >
                                <Text style={styles.approveText}>Accept</Text>
                              </Pressable>
                              <Pressable
                                onPress={() => handleDeclinePendingFriend(friend.id)}
                                style={({ pressed }) => [
                                  styles.pendingDeclineButton,
                                  pressed && styles.buttonPressed,
                                ]}
                              >
                                <Text style={styles.pendingDeclineText}>Decline</Text>
                              </Pressable>
                            </View>
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
                          style={[
                            styles.postCard,
                            { width: cardWidth },
                          ]}
                        >
                          {reportedPostIds.includes(post.id) ? (
                            <Text style={styles.reportedText}>Reported</Text>
                          ) : null}

                          <View style={styles.postHeader}>
                            <Avatar
                              imageUrl={post.authorProfilePictureUrl}
                              size={34}
                              iconSize={15}
                            />
                            <View>
                              <Text style={styles.friendName}>{post.authorName}</Text>
                              <Text style={styles.friendUsername}>@{post.username}</Text>
                            </View>
                          </View>

                          {post.imageUrl ? (
                            <Image
                              source={{ uri: resolveApiAssetUrl(post.imageUrl) }}
                              style={styles.postImage}
                            />
                          ) : (
                            <View
                              style={[
                                styles.postImage,
                                { backgroundColor: post.imageTone },
                              ]}
                            >
                              <Ionicons name="image-outline" size={28} color="#FFFFFF" />
                            </View>
                          )}

                          <Text style={styles.postCaption}>{post.caption}</Text>

                          <View style={styles.postActions}>
                            <Pressable
                              onPress={() => router.push(`/social/post/${post.id}`)}
                              style={({ pressed }) => [
                                styles.postActionButton,
                                pressed && styles.buttonPressed,
                              ]}
                            >
                              <Text style={styles.postActionText}>Open</Text>
                            </Pressable>
                            <Pressable
                              onPress={() => handleToggleLike(post.id)}
                              style={({ pressed }) => [
                                styles.postActionButton,
                                (post.likedByMe || likedPostIds.includes(post.id)) &&
                                  styles.postActionButtonActive,
                                pressed && styles.buttonPressed,
                              ]}
                            >
                              <Ionicons
                                name={
                                  post.likedByMe || likedPostIds.includes(post.id)
                                    ? "heart"
                                    : "heart-outline"
                                }
                                size={15}
                                color={
                                  post.likedByMe || likedPostIds.includes(post.id)
                                    ? "#FFFFFF"
                                    : "#4EA955"
                                }
                              />
                              <Text
                                style={[
                                  styles.postActionText,
                                  (post.likedByMe || likedPostIds.includes(post.id)) &&
                                    styles.postActionTextActive,
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
                              pointerEvents="box-none"
                            >
                              {post.comments.length > 0 ? (
                                post.comments.map((comment) => (
                                  <View key={comment.id} style={styles.commentRow}>
                                    <Avatar
                                      imageUrl={comment.authorProfilePictureUrl}
                                      size={28}
                                      iconSize={13}
                                    />
                                    <View style={styles.commentCopy}>
                                      <Text style={styles.commentText}>
                                        <Text style={styles.commentAuthor}>
                                          {comment.author}:{" "}
                                        </Text>
                                        {comment.text}
                                      </Text>
                                    </View>
                                    {comment.isMine ? (
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
                      onScroll={handleFeedScroll}
                      onMomentumScrollEnd={handleFeedScroll}
                      viewabilityConfig={feedViewabilityConfig}
                      scrollEventThrottle={16}
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
                  onPress={handleSelectPostPhoto}
                  style={({ pressed }) => [
                    styles.uploadBox,
                    selectedPhoto && styles.uploadBoxActive,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  {selectedPhoto?.uri ? (
                    <Image source={{ uri: selectedPhoto.uri }} style={styles.composePreviewImage} />
                  ) : (
                    <>
                      <Ionicons
                        name="image-outline"
                        size={24}
                        color="#4EA955"
                      />
                      <Text style={styles.uploadText}>Upload photo</Text>
                    </>
                  )}
                </Pressable>

                {selectedPhoto?.name ? (
                  <Text style={styles.uploadFileName} numberOfLines={1}>
                    {selectedPhoto.name}
                  </Text>
                ) : null}

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
                      !caption.trim() && !selectedPhoto?.uri && styles.postButtonDisabled,
                      pressed && (caption.trim() || selectedPhoto?.uri) && styles.buttonPressed,
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
                        onPress={() => handleChangeProfileVisibility(option)}
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
  searchEmptyText: {
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
  pendingActions: {
    flexDirection: "row",
    gap: 6,
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
  pendingDeclineButton: {
    minHeight: 30,
    borderRadius: 999,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  pendingDeclineText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#991B1B",
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
    overflow: "hidden",
  },
  uploadBoxActive: {
    backgroundColor: "#4EA955",
    borderColor: "#4EA955",
  },
  composePreviewImage: {
    width: "100%",
    height: "100%",
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
  uploadFileName: {
    marginTop: -4,
    marginBottom: 10,
    fontSize: 10,
    fontWeight: "700",
    color: "#7A8699",
    textAlign: "center",
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
  commentCopy: {
    flex: 1,
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
