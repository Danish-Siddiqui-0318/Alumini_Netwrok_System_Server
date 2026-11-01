const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const {
    findUserByEmail,
    createUser,
    findUserById
} = require("../models/userModel");

const isProduction = process.env.NODE_ENV === "production";

// Matches the limits of the users table (name VARCHAR(100), email VARCHAR(150)).
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 150;

// Same minimum the signup screen already enforces.
const MIN_PASSWORD_LENGTH = 6;

// bcrypt only uses the first 72 bytes of a password; anything longer would be
// silently ignored, so new passwords above this are rejected.
const MAX_PASSWORD_BYTES = 72;

// Simple "something@something.something" check (no spaces).
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// IMPROVED: a real bcrypt hash used only to keep login timing equal when the
// email does not exist (see login). It never matches any password.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

// IMPROVED: internal error text (database messages, etc.) is no longer sent to
// clients in production. In development the response is exactly as before.
const serverError = (res, error) => {
    const body = {message: "Server error"};

    if (!isProduction) {
        body.error = error.message;
    }

    return res.status(500).json(body);
};

// Register
const register = async (req, res) => {
    try {
        // IMPROVED: "|| {}" avoids a crash when a request has no body.
        const {name, email, password, role} = req.body || {};

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        // IMPROVED: a JSON body can contain numbers/objects; bcrypt and the
        // string methods below would throw on those.
        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string"
        ) {
            return res.status(400).json({
                message: "Name, email and password must be text"
            });
        }

        const cleanName = name.trim();
        const cleanEmail = email.trim();

        if (!cleanName || !cleanEmail) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        if (cleanName.length > MAX_NAME_LENGTH) {
            return res.status(400).json({
                message: `Name must be ${MAX_NAME_LENGTH} characters or fewer`
            });
        }

        if (
            cleanEmail.length > MAX_EMAIL_LENGTH ||
            !EMAIL_PATTERN.test(cleanEmail)
        ) {
            return res.status(400).json({
                message: "Please enter a valid email address"
            });
        }

        // IMPROVED: the app checks this on the phone, but the API itself
        // accepted any password, even one character long.
        if (password.length < MIN_PASSWORD_LENGTH) {
            return res.status(400).json({
                message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
            });
        }

        if (Buffer.byteLength(password, "utf8") > MAX_PASSWORD_BYTES) {
            return res.status(400).json({
                message: "Password is too long (maximum 72 characters)"
            });
        }

        const existingUser = await findUserByEmail(cleanEmail);

        if (existingUser) {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const userRole = role === "alumni" ? "alumni" : "student";

        await createUser(
            cleanName,
            cleanEmail,
            passwordHash,
            userRole
        );

        res.status(201).json({
            message: "User registered successfully"
        });

    } catch (error) {
        // IMPROVED: two people registering the same email at the same moment
        // both pass the check above; the database's UNIQUE rule stops the
        // second one. Answer with the same message instead of a 500.
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        console.error("Register error:", error);

        serverError(res, error);
    }
};


// Login
const login = async (req, res) => {
    try {
        const {email, password} = req.body || {};

        // Check required fields
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        if (typeof email !== "string" || typeof password !== "string") {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        // Find user
        const user = await findUserByEmail(email.trim());

        // IMPROVED: when the email does not exist we still run a bcrypt
        // comparison, so the response takes the same time either way and
        // attackers cannot tell which emails are registered by timing.
        const isPasswordValid = await bcrypt.compare(
            password,
            user ? user.password_hash : DUMMY_HASH
        );

        if (!user || !isPasswordValid) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // Generate JWT
        const token = jwt.sign(
            {
                userId: user.user_id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        res.status(200).json({
            message: "Login successful",
            token
        });

    } catch (error) {
        console.error("Login error:", error);

        serverError(res, error);
    }
};

const getMe = async (req, res) => {
    try {
        const user = await findUserById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            user: {
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                role: user.role,
                is_verified: user.is_verified,
                created_at: user.created_at
            }
        });

    } catch (error) {
        console.error("Get me error:", error);

        serverError(res, error);
    }
};


module.exports = {
    register,
    login,
    getMe
};