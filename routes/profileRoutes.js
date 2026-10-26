
const express = require("express");
const multer = require("multer");

const {
    getMyProfile,
    saveMyProfile,
    getPublicProfile,
    uploadProfilePicture
} = require("../controllers/profileController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB
    },
    fileFilter: (req, file, callback) => {
        if (file.mimetype.startsWith("image/")) {
            callback(null, true);
        } else {
            callback(new Error("Only image files are allowed"));
        }
    }
});

// Get logged-in user's profile
router.get("/me", authMiddleware, getMyProfile);

// Create or update logged-in user's profile
router.put("/me", authMiddleware, saveMyProfile);

// Upload profile picture
router.post(
    "/me/profile-picture",
    authMiddleware,
    upload.single("image"),
    uploadProfilePicture
);

// View another user's public profile
router.get("/:userId", authMiddleware, getPublicProfile);

module.exports = router;
