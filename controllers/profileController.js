const {
    findProfileByUserId,
    createProfile,
    updateProfile,
    getPublicProfileByUserId

} = require("../models/profileModel");
const cloudinary = require("../config/cloudinary");
const multer = require("multer");
const { Readable } = require("stream");

// Get current user's profile
const getMyProfile = async (req, res) => {
    try {
        const userId = req.user.userId;

        const profile = await findProfileByUserId(userId);

        if (!profile) {
            return res.status(404).json({
                message: "Profile not found"
            });
        }

        res.status(200).json({
            profile
        });

    } catch (error) {
        console.error("Get profile error:", error);

        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

// Create or update current user's profile
const saveMyProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const profileData = req.body;

        const existingProfile = await findProfileByUserId(userId);

        if (existingProfile) {
            await updateProfile(userId, profileData);
        } else {
            await createProfile(userId, profileData);
        }


        res.status(200).json({
            message: existingProfile
                ? "Profile updated successfully"
                : "Profile created successfully",
        });

    } catch (error) {
        console.error("Save profile error:", error);

        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


const getPublicProfile = async (req, res) => {
    try {
        const userId = Number(req.params.userId);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                message: "Invalid user ID"
            });
        }

        const profile = await getPublicProfileByUserId(userId);

        if (!profile) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            profile
        });

    } catch (error) {
        console.error("Get public profile error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

// Upload or update current user's profile picture
const uploadProfilePicture = async (req, res) => {
    try {
        const userId = req.user.userId;

        if (!req.file) {
            return res.status(400).json({
                message: "Please select an image"
            });
        }

        // Upload image to Cloudinary using a stream
        const uploadToCloudinary = () =>
            new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: "alumni_network/profile_pictures",
                        resource_type: "image"
                    },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result);
                    }
                );

                Readable.from(req.file.buffer).pipe(stream);
            });

        const result = await uploadToCloudinary();
        const imageUrl = result.secure_url;

        const existingProfile = await findProfileByUserId(userId);

        if (existingProfile) {
            await updateProfile(userId, {
                ...existingProfile,
                profile_picture: imageUrl
            });
        } else {
            await createProfile(userId, {
                profile_picture: imageUrl
            });
        }

        return res.status(200).json({
            message: "Profile picture updated successfully",
            profile_picture: imageUrl
        });
    } catch (error) {
        console.error("Profile picture upload error:", error);

        return res.status(500).json({
            message: "Failed to upload profile picture"
        });
    }
};

module.exports = {
    getMyProfile,
    saveMyProfile,
    getPublicProfile,
    uploadProfilePicture
};