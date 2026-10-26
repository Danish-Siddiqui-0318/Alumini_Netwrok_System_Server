
const {
    createComment,
    getCommentsByPostId,
    getCommentById,
    updateComment,
    deleteComment: deleteCommentById
} = require("../models/commentModel");

const { getPostById } = require("../models/postModel");
const notificationModel = require("../models/notificationModel");

// Add a comment
const addComment = async (req, res) => {
    try {
        const postId = Number(req.params.postId);
        const userId = req.user.userId;
        const { content } = req.body;

        if (!Number.isInteger(postId) || postId <= 0) {
            return res.status(400).json({
                message: "Invalid post ID"
            });
        }

        if (typeof content !== "string" || !content.trim()) {
            return res.status(400).json({
                message: "Comment content is required"
            });
        }

        const post = await getPostById(postId);

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        const commentId = await createComment(
            postId,
            userId,
            content.trim()
        );

        // Notify the post owner, except when they comment on their own post.
        const postOwnerId = Number(post.user_id);

        if (postOwnerId !== Number(userId)) {
            try {
                await notificationModel.createNotification(
                    postOwnerId,
                    "comment",
                    "Someone commented on your post",
                    postId
                );
            } catch (notificationError) {
                console.error(
                    "Create comment notification error:",
                    notificationError
                );
            }
        }

        return res.status(201).json({
            message: "Comment added successfully",
            comment_id: commentId
        });
    } catch (error) {
        console.error("Add comment error:", error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};

// Get comments for a post
const getComments = async (req, res) => {
    try {
        const postId = Number(req.params.postId);

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

        const comments = await getCommentsByPostId(postId);

        return res.status(200).json({
            count: comments.length,
            comments
        });
    } catch (error) {
        console.error("Get comments error:", error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};

// Edit your own comment
const editComment = async (req, res) => {
    try {
        const commentId = Number(req.params.commentId);
        const userId = req.user.userId;
        const { content } = req.body;

        if (!Number.isInteger(commentId) || commentId <= 0) {
            return res.status(400).json({
                message: "Invalid comment ID"
            });
        }

        if (typeof content !== "string" || !content.trim()) {
            return res.status(400).json({
                message: "Comment content is required"
            });
        }

        const comment = await getCommentById(commentId);

        if (!comment) {
            return res.status(404).json({
                message: "Comment not found"
            });
        }

        if (Number(comment.user_id) !== Number(userId)) {
            return res.status(403).json({
                message: "You can only edit your own comments"
            });
        }

        await updateComment(commentId, content.trim());

        return res.status(200).json({
            message: "Comment updated successfully"
        });
    } catch (error) {
        console.error("Edit comment error:", error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};

// Delete your own comment
const removeComment = async (req, res) => {
    try {
        const commentId = Number(req.params.commentId);
        const userId = req.user.userId;

        if (!Number.isInteger(commentId) || commentId <= 0) {
            return res.status(400).json({
                message: "Invalid comment ID"
            });
        }

        const comment = await getCommentById(commentId);

        if (!comment) {
            return res.status(404).json({
                message: "Comment not found"
            });
        }

        if (Number(comment.user_id) !== Number(userId)) {
            return res.status(403).json({
                message: "You can only delete your own comments"
            });
        }

        const deletedRows = await deleteCommentById(commentId);

        if (!deletedRows) {
            return res.status(404).json({
                message: "Comment not found"
            });
        }

        return res.status(200).json({
            message: "Comment deleted successfully"
        });
    } catch (error) {
        console.error("Delete comment error:", error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    addComment,
    getComments,
    editComment,
    removeComment
};
