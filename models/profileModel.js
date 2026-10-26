const db = require("../config/db");

// Get profile by user ID

const findProfileByUserId = async (userId) => {
    const [rows] = await db.query(
        `SELECT
            u.user_id,
            u.name,
            u.role,
            u.is_verified,
            p.profile_picture,
            p.bio,
            p.phone,
            p.department,
            p.degree,
            p.graduation_year,
            p.current_company,
            p.job_title,
            p.location,
            p.skills,
            p.linkedin_url,
            p.github_url
         FROM users u
         LEFT JOIN profiles p ON u.user_id = p.user_id
         WHERE u.user_id = ?`,
        [userId]
    );

    return rows[0];
};


// Create profile
const createProfile = async (userId, profileData) => {
    const {
        profile_picture,
        bio,
        phone,
        department,
        degree,
        graduation_year,
        current_company,
        job_title,
        location,
        skills,
        linkedin_url,
        github_url
    } = profileData;

    const [result] = await db.query(
        `INSERT INTO profiles
         (user_id,
          profile_picture,
          bio,
          phone,
          department,
          degree,
          graduation_year,
          current_company,
          job_title,
          location,
          skills,
          linkedin_url,
          github_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            userId,
            profile_picture || null,
            bio || null,
            phone || null,
            department || null,
            degree || null,
            graduation_year || null,
            current_company || null,
            job_title || null,
            location || null,
            skills || null,
            linkedin_url || null,
            github_url || null
        ]
    );

    return result.insertId;
};

// Update profile
const updateProfile = async (userId, profileData) => {
    const {
        profile_picture,
        bio,
        phone,
        department,
        degree,
        graduation_year,
        current_company,
        job_title,
        location,
        skills,
        linkedin_url,
        github_url
    } = profileData;

    await db.query(
        `UPDATE profiles
         SET profile_picture = ?,
             bio             = ?,
             phone           = ?,
             department      = ?,
             degree          = ?,
             graduation_year = ?,
             current_company = ?,
             job_title       = ?,
             location        = ?,
             skills          = ?,
             linkedin_url    = ?,
             github_url      = ?
         WHERE user_id = ?`,
        [
            profile_picture || null,
            bio || null,
            phone || null,
            department || null,
            degree || null,
            graduation_year || null,
            current_company || null,
            job_title || null,
            location || null,
            skills || null,
            linkedin_url || null,
            github_url || null,
            userId
        ]
    );
};


const getPublicProfileByUserId = async (userId) => {
    const [rows] = await db.query(
        `SELECT
            u.user_id,
            u.name,
            u.role,
            u.is_verified,
            p.profile_picture,
            p.bio,
            p.department,
            p.degree,
            p.graduation_year,
            p.current_company,
            p.job_title,
            p.location,
            p.skills,
            p.linkedin_url,
            p.github_url
        FROM users u
        LEFT JOIN profiles p
            ON u.user_id = p.user_id
        WHERE u.user_id = ?`,
        [userId]
    );

    return rows[0];
};

module.exports = {
    findProfileByUserId,
    createProfile,
    updateProfile,
    getPublicProfileByUserId
};