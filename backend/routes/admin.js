const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const pool = require("../config/db");
const { authenticateToken, requireSchoolAdmin } = require("../middleware/auth");

const router = express.Router();

// All routes require authentication and school admin role
router.use(authenticateToken, requireSchoolAdmin);

// Get all students for a school (School Admin only)
router.get("/students", async (req, res) => {
  try {
    const schoolId = req.user.school_id;

    const result = await pool.query(
      `
      SELECT u.user_id, u.name, u.email, u.phone, u.is_active, u.created_at,
             (SELECT COUNT(*) FROM Subjects WHERE user_id = u.user_id) as subject_count,
             (SELECT AVG(pl.score) FROM PerformanceLogs pl 
              JOIN Subjects s ON pl.subject_id = s.subject_id 
              WHERE s.user_id = u.user_id) as avg_performance
      FROM Users u
      WHERE u.school_id = $1 AND u.role = 'student'
      ORDER BY u.created_at DESC
    `,
      [schoolId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get single student details (School Admin only)
router.get("/students/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const schoolId = req.user.school_id;

    // Verify student belongs to this school
    const studentResult = await pool.query(
      `SELECT user_id, name, email, phone, role, school_id, is_active, created_at
       FROM Users
       WHERE user_id = $1 AND school_id = $2 AND role = 'student'`,
      [id, schoolId],
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    const student = studentResult.rows[0];

    // Get student's subjects
    const subjectsResult = await pool.query(
      "SELECT * FROM Subjects WHERE user_id = $1 ORDER BY name",
      [id],
    );

    // Get student's performance logs
    const performanceResult = await pool.query(
      `
      SELECT pl.*, s.name as subject_name
      FROM PerformanceLogs pl
      JOIN Subjects s ON pl.subject_id = s.subject_id
      WHERE s.user_id = $1
      ORDER BY pl.created_at DESC
      LIMIT 20
    `,
      [id],
    );

    // Get comments made by school admins for this student's performance
    const commentsResult = await pool.query(
      `
      SELECT pc.comment_id, pc.log_id, pc.comment, pc.created_at,
             sa.name as admin_name
      FROM PerformanceComments pc
      JOIN Users sa ON pc.school_admin_id = sa.user_id
      WHERE pc.student_id = $1
      ORDER BY pc.created_at DESC
    `,
      [id],
    );

    // Get student's study plans
    const studyPlanResult = await pool.query(
      `
      SELECT sp.*, s.name as subject_name
      FROM StudyPlans sp
      JOIN Subjects s ON sp.subject_id = s.subject_id
      WHERE s.user_id = $1
      ORDER BY sp.week_number DESC
      LIMIT 20
    `,
      [id],
    );

    res.json({
      student,
      subjects: subjectsResult.rows,
      performance: performanceResult.rows,
      study_plans: studyPlanResult.rows,
      performance_comments: commentsResult.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Add a comment on student's performance log (School Admin only)
router.post("/students/:id/performance-comments", async (req, res) => {
  try {
    const studentId = Number(req.params.id);
    const logId = Number(req.body.log_id);
    const comment = String(req.body.comment || "").trim();
    const schoolId = req.user.school_id;

    if (!Number.isInteger(studentId) || studentId <= 0) {
      return res.status(400).json({ error: "Invalid student id" });
    }
    if (!Number.isInteger(logId) || logId <= 0) {
      return res.status(400).json({ error: "Valid log_id is required" });
    }
    if (!comment) {
      return res.status(400).json({ error: "Comment is required" });
    }

    // Verify student belongs to this school
    const studentResult = await pool.query(
      "SELECT user_id FROM Users WHERE user_id = $1 AND school_id = $2 AND role = 'student'",
      [studentId, schoolId],
    );
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Verify performance log belongs to this student
    const logResult = await pool.query(
      `
      SELECT pl.log_id
      FROM PerformanceLogs pl
      JOIN Subjects s ON pl.subject_id = s.subject_id
      WHERE pl.log_id = $1 AND s.user_id = $2
    `,
      [logId, studentId],
    );
    if (logResult.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Performance log not found for this student" });
    }

    const insertResult = await pool.query(
      `
      INSERT INTO PerformanceComments (log_id, student_id, school_admin_id, comment)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
      [logId, studentId, req.user.userId, comment],
    );

    res.status(201).json(insertResult.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Reset student password (School Admin only)
router.put("/students/:id/reset-password", async (req, res) => {
  try {
    const { id } = req.params;
    const schoolId = req.user.school_id;
    const requestedPassword = String(req.body?.new_password || "").trim();

    const studentResult = await pool.query(
      `SELECT user_id
       FROM Users
       WHERE user_id = $1 AND school_id = $2 AND role = 'student'`,
      [id, schoolId],
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    const temporaryPassword =
      requestedPassword.length >= 8
        ? requestedPassword
        : `${crypto.randomBytes(6).toString("base64url")}A1!`;

    if (requestedPassword && requestedPassword.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters long" });
    }

    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    await pool.query(
      "UPDATE Users SET password = $1 WHERE user_id = $2 AND school_id = $3 AND role = 'student'",
      [hashedPassword, id, schoolId],
    );

    res.json({
      message: "Student password reset successfully",
      temporary_password: temporaryPassword,
      generated: !requestedPassword,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Register new student (School Admin only)
router.post("/students", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const normalizedPhone = String(phone || "").trim() || null;
    const schoolId = req.user.school_id;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email, and password are required" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters long" });
    }

    // Check if user exists
    const existingUser = await pool.query(
      "SELECT * FROM Users WHERE email = $1",
      [email.toLowerCase().trim()],
    );

    if (existingUser.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "User with this email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create student with school_id
    const result = await pool.query(
      "INSERT INTO Users (name, email, phone, password, role, school_id) VALUES ($1, $2, $3, $4, 'student', $5) RETURNING user_id, name, email, phone, role, school_id, is_active",
      [
        name.trim(),
        email.toLowerCase().trim(),
        normalizedPhone,
        hashedPassword,
        schoolId,
      ],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Deactivate student (School Admin only)
router.put("/students/:id/deactivate", async (req, res) => {
  try {
    const { id } = req.params;
    const schoolId = req.user.school_id;

    const result = await pool.query(
      "UPDATE Users SET is_active = false WHERE user_id = $1 AND school_id = $2 AND role = 'student' RETURNING *",
      [id, schoolId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json({
      message: "Student deactivated successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Activate student (School Admin only)
router.put("/students/:id/activate", async (req, res) => {
  try {
    const { id } = req.params;
    const schoolId = req.user.school_id;

    const result = await pool.query(
      "UPDATE Users SET is_active = true WHERE user_id = $1 AND school_id = $2 AND role = 'student' RETURNING *",
      [id, schoolId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json({
      message: "Student activated successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get school analytics (School Admin only)
router.get("/analytics", async (req, res) => {
  try {
    const schoolId = req.user.school_id;

    // Get total students
    const studentCountResult = await pool.query(
      "SELECT COUNT(*) as count FROM Users WHERE school_id = $1 AND role = 'student' AND is_active = true",
      [schoolId],
    );

    // Get active students (with recent activity)
    const activeStudentsResult = await pool.query(
      `SELECT COUNT(DISTINCT u.user_id) as count
       FROM Users u
       JOIN Subjects s ON u.user_id = s.user_id
       LEFT JOIN PerformanceLogs pl ON s.subject_id = pl.subject_id
       WHERE u.school_id = $1 AND u.role = 'student' AND u.is_active = true
       AND (pl.created_at > NOW() - INTERVAL '30 days' OR s.created_at > NOW() - INTERVAL '30 days')`,
      [schoolId],
    );

    // Get total subjects
    const subjectsResult = await pool.query(
      `SELECT COUNT(*) as count FROM Subjects 
       WHERE user_id IN (SELECT user_id FROM Users WHERE school_id = $1 AND role = 'student')`,
      [schoolId],
    );

    // Get average performance across school
    const performanceResult = await pool.query(
      `SELECT AVG(pl.score) as avg_score
       FROM PerformanceLogs pl
       JOIN Subjects s ON pl.subject_id = s.subject_id
       JOIN Users u ON s.user_id = u.user_id
       WHERE u.school_id = $1 AND u.role = 'student'`,
      [schoolId],
    );

    // Get performance by subject
    const performanceBySubjectResult = await pool.query(
      `SELECT s.name, AVG(pl.score) as avg_score, COUNT(pl.log_id) as log_count
       FROM Subjects s
       JOIN Users u ON s.user_id = u.user_id
       LEFT JOIN PerformanceLogs pl ON s.subject_id = pl.subject_id
       WHERE u.school_id = $1 AND u.role = 'student'
       GROUP BY s.subject_id, s.name
       ORDER BY avg_score DESC`,
      [schoolId],
    );

    // Get top performing students
    const topStudentsResult = await pool.query(
      `SELECT u.name, AVG(pl.score) as avg_score
       FROM Users u
       JOIN Subjects s ON u.user_id = s.user_id
       JOIN PerformanceLogs pl ON s.subject_id = pl.subject_id
       WHERE u.school_id = $1 AND u.role = 'student' AND u.is_active = true
       GROUP BY u.user_id, u.name
       ORDER BY avg_score DESC
       LIMIT 10`,
      [schoolId],
    );

    res.json({
      total_students: parseInt(studentCountResult.rows[0].count),
      active_students: parseInt(activeStudentsResult.rows[0].count),
      total_subjects: parseInt(subjectsResult.rows[0].count),
      average_performance: performanceResult.rows[0].avg_score
        ? parseFloat(performanceResult.rows[0].avg_score).toFixed(2)
        : 0,
      performance_by_subject: performanceBySubjectResult.rows,
      top_students: topStudentsResult.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get school info (School Admin only)
router.get("/school", async (req, res) => {
  try {
    const schoolId = req.user.school_id;

    const result = await pool.query(
      "SELECT school_id, name, email, address, is_active, created_at FROM Schools WHERE school_id = $1",
      [schoolId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "School not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
