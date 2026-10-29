const multer = require("multer");

const storage = multer.memoryStorage();

const fileFilter = (req, file, callback) => {
     console.log("Upload field:", file.fieldname);
    console.log("Upload filename:", file.originalname);
    console.log("Upload MIME type:", file.mimetype);
    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif"
    ];

    if (!allowedTypes.includes(file.mimetype)) {
        return callback(
            new Error("Only JPEG, PNG, WEBP, and GIF images are allowed")
        );
    }

    callback(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1
    }
});

module.exports = upload;