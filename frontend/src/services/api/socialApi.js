/*
 * Social API functions.
 *
 * Friend search, weekly feed posts, comments, likes, and friend requests should
 * all route through this module once the backend social system exists.
 */
import { apiRequest, getAuthHeaders } from "./client";

export function searchUsers(token, query) {
  // Search by username/display name from the social screen.
  return apiRequest(`/social/users?query=${encodeURIComponent(query)}`, {
    headers: getAuthHeaders(token),
  });
}

export function getWeeklyFeed(token) {
  // Returns only posts that belong to the current weekly feed window.
  return apiRequest("/social/feed/weekly", {
    headers: getAuthHeaders(token),
  });
}

export function createPost(token, payload) {
  // Creates a weekly post. Media upload may happen before this call and pass a URL.
  return apiRequest("/social/posts", {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function addComment(token, postId, payload) {
  // Adds a comment to one post in the weekly feed.
  return apiRequest(`/social/posts/${postId}/comments`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function deleteComment(token, postId, commentId) {
  // Allows users to remove their own comment or moderate where permitted.
  return apiRequest(`/social/posts/${postId}/comments/${commentId}`, {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });
}

export function togglePostLike(token, postId) {
  // Backend should return updated like state/count after toggling.
  return apiRequest(`/social/posts/${postId}/like`, {
    method: "POST",
    headers: getAuthHeaders(token),
  });
}

export function sendFriendRequest(token, userId) {
  // Creates a pending friend request to another user.
  return apiRequest(`/social/friends/${userId}/request`, {
    method: "POST",
    headers: getAuthHeaders(token),
  });
}

export function removeFriend(token, userId) {
  // Removes or cancels a friend relationship/request.
  return apiRequest(`/social/friends/${userId}`, {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });
}
