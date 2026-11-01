const {
    createApplication,
    getApplicationById,
    getApplicationsByJobId,
    getApplicationsByUserId,
    updateApplicationStatus,
    deleteApplication
} = require("../models/applicationModel");

const {getJobById} = require("../models/jobModel");

const validStatuses = [
    "pending",
    "reviewed",
    "accepted",
    "rejected"
];

// job_applications.resume_url is VARCHAR(500)
const MAX_RESUME_URL_LENGTH = 500;

// IMPROVED: one place for the "valid positive integer ID" check that was
// repeated in every function. Same rule, same error messages.
const isValidId = (value) => Number.isInteger(value) && value > 0;

// Apply for a job
const applyForJob = async (req, res) => {
    try {
        const jobId = Number(req.params.jobId);
        const userId = req.user.userId;

        if (!isValidId(jobId)) {
            return res.status(400).json({
                message: "Invalid job ID"
            });
        }

        if (!["student", "alumni"].includes(req.user.role)) {
            return res.status(403).json({
                message: "Your role cannot apply for jobs"
            });
        }

        const job = await getJobById(jobId);

        if (!job) {
            return res.status(404).json({
                message: "Job not found"
            });
        }

        if (Number(job.posted_by) === Number(userId)) {
            return res.status(400).json({
                message: "You cannot apply for your own job"
            });
        }

        // IMPROVED: "|| {}" stops a crash when a request has no body
        // (Express 5 leaves req.body undefined; Express 4 already gives {}).
        const {cover_letter, resume_url} = req.body || {};

        if (
            cover_letter !== undefined &&
            cover_letter !== null &&
            typeof cover_letter !== "string"
        ) {
            return res.status(400).json({
                message: "Invalid cover letter"
            });
        }

        if (
            resume_url !== undefined &&
            resume_url !== null &&
            (typeof resume_url !== "string" || !resume_url.trim())
        ) {
            return res.status(400).json({
                message: "Invalid resume URL"
            });
        }

        // IMPROVED: a URL longer than the column used to fail inside MySQL and
        // come back as a generic 500. Now it is a clear 400.
        if (
            typeof resume_url === "string" &&
            resume_url.length > MAX_RESUME_URL_LENGTH
        ) {
            return res.status(400).json({
                message: "Resume URL is too long"
            });
        }

        const applicationId = await createApplication(
            jobId,
            userId,
            cover_letter?.trim() || null,
            resume_url || null
        );

        return res.status(201).json({
            message: "Job application submitted successfully",
            application_id: applicationId
        });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "You have already applied for this job"
            });
        }

        console.error("Apply for job error:", error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};

// View applications for a job you own
const getJobApplications = async (req, res) => {
    try {
        const jobId = Number(req.params.jobId);

        if (!isValidId(jobId)) {
            return res.status(400).json({
                message: "Invalid job ID"
            });
        }

        const job = await getJobById(jobId);

        if (!job) {
            return res.status(404).json({
                message: "Job not found"
            });
        }

        const isAdmin = req.user.role === "admin";
        const isOwner =
            Number(job.posted_by) === Number(req.user.userId);

        if (!isAdmin && !isOwner) {
            return res.status(403).json({
                message: "You cannot view applications for this job"
            });
        }

        const applications = await getApplicationsByJobId(jobId);

        return res.status(200).json({
            count: applications.length,
            applications
        });
    } catch (error) {
        console.error("Get job applications error:", error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};

// View your own applications
const getMyApplications = async (req, res) => {
    try {
        const applications = await getApplicationsByUserId(
            req.user.userId
        );

        return res.status(200).json({
            count: applications.length,
            applications
        });
    } catch (error) {
        console.error("Get my applications error:", error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};

// Update an application's status
const editApplicationStatus = async (req, res) => {
    try {
        const applicationId = Number(req.params.applicationId);
        const {status} = req.body || {};

        if (!isValidId(applicationId)) {
            return res.status(400).json({
                message: "Invalid application ID"
            });
        }

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid application status"
            });
        }

        const application = await getApplicationById(applicationId);

        if (!application) {
            return res.status(404).json({
                message: "Application not found"
            });
        }

        const job = await getJobById(application.job_id);

        // IMPROVED: if the job were ever missing, "job.posted_by" below would
        // throw and return a vague 500. Answer with a clear 404 instead.
        if (!job) {
            return res.status(404).json({
                message: "Job not found"
            });
        }

        const isAdmin = req.user.role === "admin";
        const isOwner =
            Number(job.posted_by) === Number(req.user.userId);

        if (!isAdmin && !isOwner) {
            return res.status(403).json({
                message: "Only the job owner or admin can update this status"
            });
        }

        await updateApplicationStatus(applicationId, status);

        return res.status(200).json({
            message: "Application status updated successfully",
            status
        });
    } catch (error) {
        console.error("Update application status error:", error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};

// Withdraw your own application
const withdrawApplication = async (req, res) => {
    try {
        const applicationId = Number(req.params.applicationId);

        if (!isValidId(applicationId)) {
            return res.status(400).json({
                message: "Invalid application ID"
            });
        }

        const application = await getApplicationById(applicationId);

        if (!application) {
            return res.status(404).json({
                message: "Application not found"
            });
        }

        if (
            Number(application.user_id) !== Number(req.user.userId)
        ) {
            return res.status(403).json({
                message: "You can only withdraw your own application"
            });
        }

        const deletedRows = await deleteApplication(applicationId);

        if (!deletedRows) {
            return res.status(404).json({
                message: "Application not found"
            });
        }

        return res.status(200).json({
            message: "Job application withdrawn successfully"
        });
    } catch (error) {
        console.error("Withdraw application error:", error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    applyForJob,
    getJobApplications,
    getMyApplications,
    editApplicationStatus,
    withdrawApplication
};