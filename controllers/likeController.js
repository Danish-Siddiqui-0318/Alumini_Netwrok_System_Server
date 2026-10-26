
const {
    addLike,
    removeLike,
    checkLike,
    getLikeCount
} = require("../models/likeModel");

const { getPostById } = require("../models/postModel");
const notificationModel = require("../models/notificationModel");

// Like a post
const likePost = async (req, res) => {
    try {
        const postId = Number(req.params.postId);
        const userId = req.user.userId;

        if (!Number.isInteger(postId) || postId <= 0) {
            return res.status(400).json({
                message: "Invalid post ID"
            });
        }

        const post = await getPostById(postId);

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        const alreadyLiked = await checkLike(postId, userId);

        if (alreadyLiked) {
            return res.status(409).json({
                message: "You have already liked this post"
            });
        }

        await addLike(postId, userId);

        // Notify the post owner, but never notify users about their own likes.
        const postOwnerId = Number(post.user_id);

        if (postOwnerId !== Number(userId)) {
            try {
                await notificationModel.createNotification(
                    postOwnerId,
                    "like",
                    "Someone liked your post",
                    postId
                );
            } catch (notificationError) {
                console.error(
                    "Create like notification error:",
                    notificationError
                );
            }
        }

        const likeCount = await getLikeCount(postId);

        return res.status(201).json({
            message: "Post liked successfully",
            liked: true,
            like_count: likeCount
        });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "You have already liked this post"
            });
        }

        console.error("Like post error:", error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};

// Unlike a post
const unlikePost = async (req, res) => {
    try {
        const postId = Number(req.params.postId);
        const userId = req.user.userId;

        if (!Number.isInteger(postId) || postId <= 0) {
            return res.status(400).json({
                message: "Invalid post ID"
            });
        }

        const post = await getPostById(postId);

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        const deletedRows = await removeLike(postId, userId);

        if (!deletedRows) {
            return res.status(404).json({
                message: "You have not liked this post"
            });
        }

        const likeCount = await getLikeCount(postId);

        return res.status(200).json({
            message: "Post unliked successfully",
            liked: false,
            like_count: likeCount
        });
    } catch (error) {
        console.error("Unlike post error:", error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};

// Check whether the logged-in user liked a post
const getLikeStatus = async (req, res) => {
    try {
        const postId = Number(req.params.postId);
        const userId = req.user.userId;

        if (!Number.isInteger(postId) || postId <= 0) {
            return res.status(400).json({
                message: "Invalid post ID"
            });
        }

        const post = await getPostById(postId);

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        const liked = await checkLike(postId, userId);
        const likeCount = await getLikeCount(postId);

        return res.status(200).json({
            post_id: postId,
            liked,
            like_count: likeCount
        });
    } catch (error) {
        console.error("Get like status error:", error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    likePost,
    unlikePost,
    getLikeStatus
};
