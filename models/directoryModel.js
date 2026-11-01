const db = require("../config/db");

// Get all alumni with their profile information
const getAllAlumni = async () => {
    const [rows] = await db.query(
        `SELECT u.user_id,
                u.name,
                u.email,
                u.role,
                u.is_verified,
                u.created_at,
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
         WHERE u.role = 'alumni'
         ORDER BY u.created_at DESC`
    );

    return rows;
};



const searchUsersByName = async (name) => {
    const [rows] = await db.query(
        `SELECT
            u.user_id,
            u.name,
            u.role,
            p.profile_picture,
            p.bio,
            p.department,
            p.degree,
            p.graduation_year,
            p.current_company,
            p.job_title,
            p.location
        FROM users u
        LEFT JOIN profiles p
            ON u.user_id = p.user_id
        WHERE u.role = 'alumni'
        AND u.name LIKE ?
        ORDER BY u.name ASC`,
        [`%${name}%`]
    );

    return rows;
};

module.exports = {
    getAllAlumni,
    searchUsersByName
};