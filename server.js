const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const db = require("./config/db");
// Route Imports

const profileRoutes = require("./routes/profileRoutes");
const directoryRoutes = require("./routes/directoryRoutes");
const postRoutes = require("./routes/postRoutes");
const authRoutes = require("./routes/authRoutes");
const commentRoutes = require("./routes/commentRoutes");
const likeRoutes = require("./routes/likeRoutes");
const jobRoutes = require("./routes/jobRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const messageRoutes = require("./routes/messageRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutes");


const app = express();

app.use(cors());
app.use(express.json());


const PORT = process.env.PORT || 5000;


// Routes
app.use("/auth", authRoutes);
app.use("/profiles", profileRoutes);
app.use("/users", directoryRoutes); // Alummini Apis
app.use("/posts", postRoutes);
app.use("/api", commentRoutes);
app.use("/api", likeRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api", applicationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);




app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});