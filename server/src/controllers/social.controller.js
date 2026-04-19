const openDb = require("../db/connection");

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getWeekKey(date = new Date()) {
  const weekStart = new Date(date);
  const daysSinceMonday = (weekStart.getDay() + 6) % 7;
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - daysSinceMonday);
  return formatDateKey(weekStart);
}

function displayName(profile, fallbackEmail = "") {
  return profile?.full_name || profile?.username || fallbackEmail.split("@")[0] || "Jhoom user";
}

async function canViewPost(db, viewerId, postUserId) {
  if (!postUserId) {
    return false;
  }

  if (postUserId === viewerId) {
    return true;
  }

  const blocked = await db.get(
    `SELECT 1
     FROM user_blocks
     WHERE (blocker_id = ? AND blocked_id = ?)
        OR (blocker_id = ? AND blocked_id = ?)`,
    [viewerId, postUserId, postUserId, viewerId]
  );

  if (blocked) {
    return false;
  }

  const connection = await db.get(
    `SELECT 1
     FROM connections
     WHERE status = 'accepted'
       AND ((requester_id = ? AND receiver_id = ?)
         OR (receiver_id = ? AND requester_id = ?))`,
    [viewerId, postUserId, viewerId, postUserId]
  );

  return Boolean(connection);
}

async function getCommentsForPosts(db, postIds, userId) {
  if (postIds.length === 0) {
    return new Map();
  }

  const placeholders = postIds.map(() => "?").join(",");
  const comments = await db.all(
    `SELECT comments.*, profiles.username, profiles.full_name, profiles.profile_picture_url
     FROM comments
     LEFT JOIN profiles ON profiles.user_id = comments.user_id
     WHERE post_id IN (${placeholders})
     ORDER BY comments.created_at ASC`,
    postIds
  );

  const byPostId = new Map();
  comments.forEach((comment) => {
    const nextComment = {
      id: comment.id,
      author: displayName(comment),
      authorProfilePictureUrl: comment.profile_picture_url || null,
      text: comment.content,
      createdAt: comment.created_at,
      isMine: comment.user_id === userId,
    };

    byPostId.set(comment.post_id, [...(byPostId.get(comment.post_id) || []), nextComment]);
  });

  return byPostId;
}

async function parsePosts(db, rows, userId) {
  const postIds = rows.map((row) => row.id);
  const commentsByPostId = await getCommentsForPosts(db, postIds, userId);

  return rows.map((row) => ({
    id: row.id,
    friendId: row.user_id === userId ? "you" : row.user_id,
    authorName: displayName(row, row.email),
    username: row.username || row.email,
    authorProfilePictureUrl: row.profile_picture_url || null,
    caption: row.content,
    achievementType: row.achievement_type,
    imageUrl: row.image_url,
    imageTone: "#4EA955",
    weekKey: row.week_key || getWeekKey(new Date(row.created_at)),
    comments: commentsByPostId.get(row.id) || [],
    likeCount: row.like_count || 0,
    likedByMe: Boolean(row.liked_by_me),
    createdAt: row.created_at,
    isMine: row.user_id === userId,
  }));
}

async function getParsedPostById(db, postId, userId) {
  const rows = await db.all(
    `SELECT posts.*, users.email, profiles.username, profiles.full_name, profiles.profile_picture_url,
            COUNT(DISTINCT post_likes.id) AS like_count,
            MAX(CASE WHEN post_likes.user_id = ? THEN 1 ELSE 0 END) AS liked_by_me
     FROM posts
     JOIN users ON users.id = posts.user_id
     LEFT JOIN profiles ON profiles.user_id = posts.user_id
     LEFT JOIN post_likes ON post_likes.post_id = posts.id
     WHERE posts.id = ?
     GROUP BY posts.id`,
    [userId, postId]
  );

  const parsedPosts = await parsePosts(db, rows, userId);
  return parsedPosts[0] || null;
}

const searchUsers = async (req, res) => {
  try {
    const db = await openDb();
    const query = `%${(req.query.query || "").trim()}%`;
    const rows = await db.all(
      `SELECT profiles.user_id AS id, profiles.username, profiles.full_name, profiles.bio, profiles.profile_picture_url
       FROM profiles
       WHERE profiles.user_id != ?
         AND NOT EXISTS (
           SELECT 1 FROM user_blocks
           WHERE (blocker_id = ? AND blocked_id = profiles.user_id)
              OR (blocker_id = profiles.user_id AND blocked_id = ?)
         )
         AND (? = '%%' OR profiles.username LIKE ?)
       ORDER BY profiles.username ASC
       LIMIT 20`,
      [req.user.id, req.user.id, req.user.id, query, query]
    );

    res.json(
      rows.map((row) => ({
        id: row.id,
        name: displayName(row),
        username: row.username,
        focus: row.bio || "Fitness and consistency",
        profilePictureUrl: row.profile_picture_url || null,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getWeeklyFeed = async (req, res) => {
  try {
    const db = await openDb();
    const weekKey = getWeekKey();
    const rows = await db.all(
      `SELECT posts.*, users.email, profiles.username, profiles.full_name, profiles.profile_picture_url,
              COUNT(DISTINCT post_likes.id) AS like_count,
              MAX(CASE WHEN post_likes.user_id = ? THEN 1 ELSE 0 END) AS liked_by_me
       FROM posts
       JOIN users ON users.id = posts.user_id
       LEFT JOIN profiles ON profiles.user_id = posts.user_id
       LEFT JOIN post_likes ON post_likes.post_id = posts.id
       WHERE COALESCE(posts.week_key, date(posts.created_at, 'weekday 1', '-7 days')) = ?
         AND NOT EXISTS (
           SELECT 1 FROM user_blocks
           WHERE (blocker_id = ? AND blocked_id = posts.user_id)
              OR (blocker_id = posts.user_id AND blocked_id = ?)
         )
         AND (
           posts.user_id = ?
           OR EXISTS (
             SELECT 1 FROM connections
             WHERE status = 'accepted'
               AND ((requester_id = ? AND receiver_id = posts.user_id)
                 OR (receiver_id = ? AND requester_id = posts.user_id))
           )
         )
       GROUP BY posts.id
       ORDER BY posts.created_at DESC`,
      [req.user.id, weekKey, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id]
    );

    res.json(await parsePosts(db, rows, req.user.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createPost = async (req, res) => {
  try {
    const content = (req.body.caption || req.body.content || "").trim();

    if (!content && !req.body.imageUrl) {
      return res.status(400).json({ error: "caption or imageUrl is required" });
    }

    const db = await openDb();
    const now = new Date().toISOString();
    const result = await db.run(
      `INSERT INTO posts (user_id, content, achievement_type, image_url, week_key, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        content || "Photo update",
        req.body.achievementType || null,
        req.body.imageUrl || null,
        getWeekKey(),
        now,
        now,
      ]
    );

    const rows = await db.all(
      `SELECT posts.*, users.email, profiles.username, profiles.full_name, profiles.profile_picture_url,
              0 AS like_count,
              0 AS liked_by_me
       FROM posts
       JOIN users ON users.id = posts.user_id
       LEFT JOIN profiles ON profiles.user_id = posts.user_id
       WHERE posts.id = ?`,
      [result.lastID]
    );

    const posts = await parsePosts(db, rows, req.user.id);
    res.status(201).json(posts[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getPostById = async (req, res) => {
  try {
    const db = await openDb();
    const postId = Number(req.params.postId);

    if (!postId) {
      return res.status(400).json({ error: "Valid post id is required" });
    }

    const post = await getParsedPostById(db, postId, req.user.id);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const rawPost = await db.get("SELECT user_id FROM posts WHERE id = ?", [postId]);
    const canView = rawPost ? await canViewPost(db, req.user.id, rawPost.user_id) : false;

    if (!canView) {
      return res.status(403).json({ error: "You do not have access to this post" });
    }

    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addComment = async (req, res) => {
  try {
    const content = (req.body.text || req.body.content || "").trim();

    if (!content) {
      return res.status(400).json({ error: "comment text is required" });
    }

    const db = await openDb();
    const post = await db.get("SELECT * FROM posts WHERE id = ?", [req.params.postId]);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const canView = await canViewPost(db, req.user.id, post.user_id);

    if (!canView) {
      return res.status(403).json({ error: "You do not have access to this post" });
    }

    const now = new Date().toISOString();
    const result = await db.run(
      `INSERT INTO comments (post_id, user_id, content, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [req.params.postId, req.user.id, content, now, now]
    );

    const profile = await db.get("SELECT * FROM profiles WHERE user_id = ?", [req.user.id]);

    res.status(201).json({
      id: result.lastID,
      author: displayName(profile),
      authorProfilePictureUrl: profile?.profile_picture_url || null,
      text: content,
      createdAt: now,
      isMine: true,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteComment = async (req, res) => {
  try {
    const db = await openDb();
    const result = await db.run(
      "DELETE FROM comments WHERE id = ? AND post_id = ? AND user_id = ?",
      [req.params.commentId, req.params.postId, req.user.id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Comment not found" });
    }

    res.json({ message: "Comment deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const togglePostLike = async (req, res) => {
  try {
    const db = await openDb();
    const post = await db.get("SELECT user_id FROM posts WHERE id = ?", [req.params.postId]);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const canView = await canViewPost(db, req.user.id, post.user_id);

    if (!canView) {
      return res.status(403).json({ error: "You do not have access to this post" });
    }

    const existing = await db.get(
      "SELECT * FROM post_likes WHERE post_id = ? AND user_id = ?",
      [req.params.postId, req.user.id]
    );

    if (existing) {
      await db.run("DELETE FROM post_likes WHERE id = ?", [existing.id]);
    } else {
      await db.run(
        "INSERT INTO post_likes (post_id, user_id, created_at) VALUES (?, ?, ?)",
        [req.params.postId, req.user.id, new Date().toISOString()]
      );
    }

    const row = await db.get(
      "SELECT COUNT(*) AS likeCount FROM post_likes WHERE post_id = ?",
      [req.params.postId]
    );

    res.json({ likedByMe: !existing, likeCount: row.likeCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getConnections = async (req, res) => {
  try {
    const db = await openDb();
    const rows = await db.all(
      `SELECT connections.*,
              other_profiles.user_id AS other_id,
              other_profiles.username,
              other_profiles.full_name,
              other_profiles.bio,
              other_profiles.profile_picture_url
       FROM connections
       JOIN profiles AS other_profiles
         ON other_profiles.user_id = CASE
           WHEN connections.requester_id = ? THEN connections.receiver_id
           ELSE connections.requester_id
         END
       WHERE connections.requester_id = ? OR connections.receiver_id = ?
       ORDER BY connections.updated_at DESC`,
      [req.user.id, req.user.id, req.user.id]
    );

    const mappedRows = rows.map((row) => ({
      id: row.other_id,
      connectionId: row.id,
      name: displayName(row),
      username: row.username,
      focus: row.bio || "Fitness and consistency",
      profilePictureUrl: row.profile_picture_url || null,
      status: row.status,
      direction: row.requester_id === req.user.id ? "outgoing" : "incoming",
    }));

    res.json({
      friends: mappedRows.filter((row) => row.status === "accepted"),
      pendingIncoming: mappedRows.filter((row) => row.status === "pending" && row.direction === "incoming"),
      pendingOutgoing: mappedRows.filter((row) => row.status === "pending" && row.direction === "outgoing"),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const sendFriendRequest = async (req, res) => {
  try {
    const receiverId = Number(req.params.userId);

    if (!receiverId || receiverId === req.user.id) {
      return res.status(400).json({ error: "Valid friend user id is required" });
    }

    const db = await openDb();
    const receiver = await db.get(
      "SELECT user_id FROM profiles WHERE user_id = ?",
      [receiverId]
    );

    if (!receiver) {
      return res.status(404).json({ error: "User not found" });
    }

    const blocked = await db.get(
      `SELECT * FROM user_blocks
       WHERE (blocker_id = ? AND blocked_id = ?)
          OR (blocker_id = ? AND blocked_id = ?)`,
      [req.user.id, receiverId, receiverId, req.user.id]
    );

    if (blocked) {
      return res.status(400).json({ error: "Friend request cannot be sent." });
    }

    const existing = await db.get(
      `SELECT * FROM connections
       WHERE (requester_id = ? AND receiver_id = ?)
          OR (requester_id = ? AND receiver_id = ?)`,
      [req.user.id, receiverId, receiverId, req.user.id]
    );

    if (existing) {
      if (existing.status === "accepted") {
        return res.json({
          message: "Already friends",
          status: "accepted",
          connectionId: existing.id,
        });
      }

      if (existing.requester_id === req.user.id) {
        return res.json({
          message: "Friend request already sent",
          status: "pending",
          direction: "outgoing",
          connectionId: existing.id,
        });
      }

      const now = new Date().toISOString();
      await db.run(
        "UPDATE connections SET status = 'accepted', updated_at = ? WHERE id = ?",
        [now, existing.id]
      );

      return res.json({
        message: "Friend request accepted",
        status: "accepted",
        connectionId: existing.id,
      });
    }

    const now = new Date().toISOString();
    const result = await db.run(
      `INSERT INTO connections (requester_id, receiver_id, status, created_at, updated_at)
       VALUES (?, ?, 'pending', ?, ?)`,
      [req.user.id, receiverId, now, now]
    );

    res.status(201).json({
      id: result.lastID,
      requesterId: req.user.id,
      receiverId,
      status: "pending",
      createdAt: now,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const respondToFriendRequest = async (req, res) => {
  try {
    const requesterId = Number(req.params.userId);
    const action = String(req.body.action || "").toLowerCase();

    if (!["accept", "decline", "refuse", "reject"].includes(action)) {
      return res.status(400).json({ error: "Action must be accept or decline" });
    }

    const db = await openDb();
    const connection = await db.get(
      `SELECT * FROM connections
       WHERE requester_id = ? AND receiver_id = ? AND status = 'pending'`,
      [requesterId, req.user.id]
    );

    if (!connection) {
      return res.status(404).json({ error: "Friend request not found" });
    }

    if (action === "accept") {
      const now = new Date().toISOString();
      await db.run(
        "UPDATE connections SET status = 'accepted', updated_at = ? WHERE id = ?",
        [now, connection.id]
      );
      return res.json({ message: "Friend request accepted", status: "accepted" });
    }

    await db.run("DELETE FROM connections WHERE id = ?", [connection.id]);
    res.json({ message: "Friend request declined", status: "declined" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const removeFriend = async (req, res) => {
  try {
    const otherUserId = Number(req.params.userId);
    const db = await openDb();
    await db.run(
      `DELETE FROM connections
       WHERE (requester_id = ? AND receiver_id = ?)
          OR (requester_id = ? AND receiver_id = ?)`,
      [req.user.id, otherUserId, otherUserId, req.user.id]
    );

    res.json({ message: "Connection removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const blockUser = async (req, res) => {
  try {
    const blockedId = Number(req.params.userId);

    if (!blockedId || blockedId === req.user.id) {
      return res.status(400).json({ error: "Valid user id is required" });
    }

    const db = await openDb();
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO user_blocks (blocker_id, blocked_id, created_at)
       VALUES (?, ?, ?)
       ON CONFLICT(blocker_id, blocked_id) DO NOTHING`,
      [req.user.id, blockedId, now]
    );

    await db.run(
      `DELETE FROM connections
       WHERE (requester_id = ? AND receiver_id = ?)
          OR (requester_id = ? AND receiver_id = ?)`,
      [req.user.id, blockedId, blockedId, req.user.id]
    );

    res.json({ message: "User blocked" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const reportContent = async (req, res) => {
  try {
    const reason = (req.body.reason || "").trim();

    if (!reason) {
      return res.status(400).json({ error: "Report reason is required" });
    }

    const db = await openDb();
    const postId = req.body.postId ? Number(req.body.postId) : null;
    const commentId = req.body.commentId ? Number(req.body.commentId) : null;
    let reportedUserId = req.body.reportedUserId ? Number(req.body.reportedUserId) : null;

    if (!reportedUserId && postId) {
      const post = await db.get("SELECT user_id FROM posts WHERE id = ?", [postId]);
      reportedUserId = post?.user_id || null;
    }

    if (!reportedUserId && commentId) {
      const comment = await db.get("SELECT user_id FROM comments WHERE id = ?", [commentId]);
      reportedUserId = comment?.user_id || null;
    }

    const now = new Date().toISOString();
    const result = await db.run(
      `INSERT INTO reports
       (reporter_id, reported_user_id, post_id, comment_id, reason, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, reportedUserId, postId, commentId, reason, now, now]
    );

    res.status(201).json({
      id: result.lastID,
      message: "Report submitted",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  searchUsers,
  getWeeklyFeed,
  createPost,
  getPostById,
  addComment,
  deleteComment,
  togglePostLike,
  getConnections,
  sendFriendRequest,
  respondToFriendRequest,
  removeFriend,
  blockUser,
  reportContent,
};
