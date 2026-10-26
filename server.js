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

// Get me error: Error: read ECONNRESET
//     at findUserById (D:\University\Sem 4\SPM\project\Server\models\userModel.js:27:29)
//     at getMe (D:\University\Sem 4\SPM\project\Server\controllers\authController.js:117:28)
//     at Layer.handleRequest (D:\University\Sem 4\SPM\project\Server\node_modules\router\lib\layer.js:152:17)
//     at next (D:\University\Sem 4\SPM\project\Server\node_modules\router\lib\route.js:157:13)
//     at authMiddleware (D:\University\Sem 4\SPM\project\Server\middleware\authMiddleware.js:38:9)
//     at Layer.handleRequest (D:\University\Sem 4\SPM\project\Server\node_modules\router\lib\layer.js:152:17)
//     at next (D:\University\Sem 4\SPM\project\Server\node_modules\router\lib\route.js:157:13)
//     at Route.dispatch (D:\University\Sem 4\SPM\project\Server\node_modules\router\lib\route.js:117:3)
//     at handle (D:\University\Sem 4\SPM\project\Server\node_modules\router\index.js:435:11)
//     at Layer.handleRequest (D:\University\Sem 4\SPM\project\Server\node_modules\router\lib\layer.js:152:17) {
//   errno: -4077,
//   code: 'ECONNRESET',
//   syscall: 'read',
//   fatal: true
// }