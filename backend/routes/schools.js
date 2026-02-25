const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const pool = require("../config/db");
const { authenticateToken, requireSuperAdmin } = require("../middleware/auth");

const router = express.Router();

const parseSchoolId = (value) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
};

const parseUserId = (value) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
};

// Get all schools (Super Admin only)
router.get("/", authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, 
             (SELECT COUNT(*) FROM Users WHERE school_id = s.school_id AND role = 'school_admin') as admin_count,
             (SELECT COUNT(*) FROM Users WHERE school_id = s.school_id AND role = 'student') as student_count,
             COALESCE(
               (
                 SELECT json_agg(
                   json_build_object(
                     'user_id', u.user_id,
                     'name', u.name,
                     'email', u.email,
                     'phone', u.phone,
                     'is_active', u.is_active,
                     'created_at', u.created_at
                   )
                   ORDER BY u.created_at DESC
                 )
                 FROM Users u
                 WHERE u.school_id = s.school_id AND u.role = 'school_admin'
               ),
               '[]'::json
             ) as admins
      FROM Schools s
      ORDER BY s.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get public students (students without school access) - Super Admin only
router.get(
  "/public-students",
  authenticateToken,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT user_id, name, email, phone, is_active, created_at
         FROM Users
         WHERE role = 'student' AND school_id IS NULL
         ORDER BY created_at DESC`,
      );

      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  },
);

// Update public student (student without school access) - Super Admin only
router.put(
  "/public-students/:studentId",
  authenticateToken,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const studentId = parseUserId(req.params.studentId);
      if (!studentId) {
        return res.status(400).json({ error: "Invalid student id" });
      }

      const name = String(req.body?.name || "").trim();
      const email = String(req.body?.email || "").trim().toLowerCase();
      const phone = String(req.body?.phone || "").trim() || null;

      if (!name || !email) {
        return res
          .status(400)
          .json({ error: "Name and email are required" });
      }

      const studentResult = await pool.query(
        `SELECT user_id
         FROM Users
         WHERE user_id = $1 AND role = 'student' AND school_id IS NULL`,
        [studentId],
      );

      if (studentResult.rows.length === 0) {
        return res.status(404).json({ error: "Public student not found" });
      }

      const existingUser = await pool.query(
        "SELECT user_id FROM Users WHERE email = $1 AND user_id <> $2",
        [email, studentId],
      );

      if (existingUser.rows.length > 0) {
        return res
          .status(400)
          .json({ error: "Another user already uses this email" });
      }

      const result = await pool.query(
        `UPDATE Users
         SET name = $1, email = $2, phone = $3
         WHERE user_id = $4 AND role = 'student' AND school_id IS NULL
         RETURNING user_id, name, email, phone, is_active, created_at`,
        [name, email, phone, studentId],
      );

      res.json({
        message: "Public student updated successfully",
        student: result.rows[0],
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  },
);

// Delete public student (student without school access) - Super Admin only
router.delete(
  "/public-students/:studentId",
  authenticateToken,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const studentId = parseUserId(req.params.studentId);
      if (!studentId) {
        return res.status(400).json({ error: "Invalid student id" });
      }

      const result = await pool.query(
        `DELETE FROM Users
         WHERE user_id = $1 AND role = 'student' AND school_id IS NULL
         RETURNING user_id, name, email`,
        [studentId],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Public student not found" });
      }

      res.json({
        message: "Public student deleted successfully",
        student: result.rows[0],
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  },
);

// Get all schools analytics overview (Super Admin only)
router.get(
  "/analytics/overview",
  authenticateToken,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const [summaryResult, schoolsResult] = await Promise.all([
        pool.query(`
          SELECT
            (SELECT COUNT(*)::int FROM Schools) AS total_schools,
            (SELECT COUNT(*)::int FROM Schools WHERE is_active = true) AS active_schools,
            (
              SELECT COUNT(*)::int
              FROM Users
              WHERE role = 'student' AND school_id IS NOT NULL AND is_active = true
            ) AS school_students,
            (
              SELECT COUNT(*)::int
              FROM Users
              WHERE role = 'student' AND school_id IS NULL AND is_active = true
            ) AS public_students,
            (
              SELECT COUNT(*)::int
              FROM Subjects sub
              JOIN Users u ON u.user_id = sub.user_id
              WHERE u.school_id IS NOT NULL
            ) AS total_subjects,
            (
              SELECT ROUND(AVG(pl.score)::numeric, 2)
              FROM PerformanceLogs pl
              JOIN Subjects sub ON sub.subject_id = pl.subject_id
              JOIN Users u ON u.user_id = sub.user_id
              WHERE u.school_id IS NOT NULL
            ) AS overall_average_performance
        `),
        pool.query(`
          SELECT
            s.school_id,
            s.name,
            s.email,
            s.is_active,
            (
              SELECT COUNT(*)::int
              FROM Users u
              WHERE u.school_id = s.school_id AND u.role = 'student' AND u.is_active = true
            ) AS student_count,
            (
              SELECT COUNT(*)::int
              FROM Users sa
              WHERE sa.school_id = s.school_id AND sa.role = 'school_admin'
            ) AS admin_count,
            (
              SELECT COUNT(*)::int
              FROM Subjects sub
              JOIN Users u ON u.user_id = sub.user_id
              WHERE u.school_id = s.school_id
            ) AS subject_count,
            (
              SELECT ROUND(AVG(pl.score)::numeric, 2)
              FROM PerformanceLogs pl
              JOIN Subjects sub ON pl.subject_id = sub.subject_id
              JOIN Users u ON sub.user_id = u.user_id
              WHERE u.school_id = s.school_id
            ) AS average_performance
          FROM Schools s
          ORDER BY average_performance DESC NULLS LAST, s.created_at DESC
        `),
      ]);

      const summary = summaryResult.rows[0] || {};
      const schoolStudents = Number(summary.school_students || 0);
      const publicStudents = Number(summary.public_students || 0);
      res.json({
        total_schools: Number(summary.total_schools || 0),
        active_schools: Number(summary.active_schools || 0),
        total_students: schoolStudents + publicStudents,
        school_students: schoolStudents,
        public_students: publicStudents,
        total_subjects: Number(summary.total_subjects || 0),
        overall_average_performance: summary.overall_average_performance
          ? Number(summary.overall_average_performance)
          : 0,
        schools: schoolsResult.rows.map((school) => ({
          ...school,
          average_performance: school.average_performance
            ? Number(school.average_performance)
            : 0,
        })),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  },
);

// Get single school (Super Admin only)
router.get("/:id", authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const schoolId = parseSchoolId(req.params.id);
    if (!schoolId) {
      return res.status(400).json({ error: "Invalid school id" });
    }
    const result = await pool.query(
      "SELECT * FROM Schools WHERE school_id = $1",
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

// Create new school (Super Admin only)
router.post("/", authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { name, email, address } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    // Check if school email already exists
    const existingSchool = await pool.query(
      "SELECT * FROM Schools WHERE email = $1",
      [email],
    );

    if (existingSchool.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "School with this email already exists" });
    }

    const result = await pool.query(
      "INSERT INTO Schools (name, email, address) VALUES ($1, $2, $3) RETURNING *",
      [name, email, address || null],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Create school admin access for a school (Super Admin only)
router.post(
  "/:id/admins",
  authenticateToken,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const schoolId = parseSchoolId(req.params.id);
      if (!schoolId) {
        return res.status(400).json({ error: "Invalid school id" });
      }
      const { name, email, password, phone } = req.body;
      const normalizedPhone = String(phone || "").trim() || null;

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

      const schoolResult = await pool.query(
        "SELECT school_id, is_active FROM Schools WHERE school_id = $1",
        [schoolId],
      );

      if (schoolResult.rows.length === 0) {
        return res.status(404).json({ error: "School not found" });
      }

      if (!schoolResult.rows[0].is_active) {
        return res
          .status(400)
          .json({ error: "Cannot create admin for an inactive school" });
      }

      const existingUser = await pool.query(
        "SELECT user_id FROM Users WHERE email = $1",
        [email.toLowerCase().trim()],
      );

      if (existingUser.rows.length > 0) {
        return res
          .status(400)
          .json({ error: "User with this email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await pool.query(
        "INSERT INTO Users (name, email, phone, password, role, school_id) VALUES ($1, $2, $3, $4, 'school_admin', $5) RETURNING user_id, name, email, phone, role, school_id, is_active, created_at",
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
  },
);

// Update school admin profile (Super Admin only)
router.put(
  "/:id/admins/:adminId",
  authenticateToken,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const schoolId = parseSchoolId(req.params.id);
      const adminId = parseUserId(req.params.adminId);
      if (!schoolId || !adminId) {
        return res.status(400).json({ error: "Invalid school or admin id" });
      }

      const name = String(req.body?.name || "").trim();
      const email = String(req.body?.email || "").trim().toLowerCase();
      const phone = String(req.body?.phone || "").trim() || null;

      if (!name || !email) {
        return res
          .status(400)
          .json({ error: "Name and email are required" });
      }

      const adminResult = await pool.query(
        `SELECT user_id
         FROM Users
         WHERE user_id = $1 AND school_id = $2 AND role = 'school_admin'`,
        [adminId, schoolId],
      );

      if (adminResult.rows.length === 0) {
        return res.status(404).json({ error: "School admin not found" });
      }

      const existingUser = await pool.query(
        "SELECT user_id FROM Users WHERE email = $1 AND user_id <> $2",
        [email, adminId],
      );

      if (existingUser.rows.length > 0) {
        return res
          .status(400)
          .json({ error: "Another user already uses this email" });
      }

      const result = await pool.query(
        `UPDATE Users
         SET name = $1, email = $2, phone = $3
         WHERE user_id = $4 AND school_id = $5 AND role = 'school_admin'
         RETURNING user_id, name, email, phone, role, school_id, is_active, created_at`,
        [name, email, phone, adminId, schoolId],
      );

      res.json({
        message: "School admin updated successfully",
        admin: result.rows[0],
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  },
);

// Activate school admin (Super Admin only)
router.put(
  "/:id/admins/:adminId/activate",
  authenticateToken,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const schoolId = parseSchoolId(req.params.id);
      const adminId = parseUserId(req.params.adminId);
      if (!schoolId || !adminId) {
        return res.status(400).json({ error: "Invalid school or admin id" });
      }

      const result = await pool.query(
        `UPDATE Users
         SET is_active = true
         WHERE user_id = $1 AND school_id = $2 AND role = 'school_admin'
         RETURNING user_id, name, email, phone, role, school_id, is_active, created_at`,
        [adminId, schoolId],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "School admin not found" });
      }

      res.json({
        message: "School admin activated successfully",
        admin: result.rows[0],
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  },
);

// Deactivate school admin (Super Admin only)
router.put(
  "/:id/admins/:adminId/reset-password",
  authenticateToken,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const schoolId = parseSchoolId(req.params.id);
      const adminId = parseUserId(req.params.adminId);
      if (!schoolId || !adminId) {
        return res.status(400).json({ error: "Invalid school or admin id" });
      }

      const requestedPassword = String(req.body?.new_password || "").trim();
      if (requestedPassword && requestedPassword.length < 8) {
        return res
          .status(400)
          .json({ error: "Password must be at least 8 characters long" });
      }

      const adminResult = await pool.query(
        `SELECT user_id
         FROM Users
         WHERE user_id = $1 AND school_id = $2 AND role = 'school_admin'`,
        [adminId, schoolId],
      );

      if (adminResult.rows.length === 0) {
        return res.status(404).json({ error: "School admin not found" });
      }

      const temporaryPassword =
        requestedPassword || `${crypto.randomBytes(6).toString("base64url")}A1!`;
      const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

      await pool.query(
        `UPDATE Users
         SET password = $1
         WHERE user_id = $2 AND school_id = $3 AND role = 'school_admin'`,
        [hashedPassword, adminId, schoolId],
      );

      res.json({
        message: "School admin password reset successfully",
        temporary_password: temporaryPassword,
        generated: !requestedPassword,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  },
);

router.put(
  "/:id/admins/:adminId/deactivate",
  authenticateToken,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const schoolId = parseSchoolId(req.params.id);
      const adminId = parseUserId(req.params.adminId);
      if (!schoolId || !adminId) {
        return res.status(400).json({ error: "Invalid school or admin id" });
      }

      const result = await pool.query(
        `UPDATE Users
         SET is_active = false
         WHERE user_id = $1 AND school_id = $2 AND role = 'school_admin'
         RETURNING user_id, name, email, phone, role, school_id, is_active, created_at`,
        [adminId, schoolId],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "School admin not found" });
      }

      res.json({
        message: "School admin deactivated successfully",
        admin: result.rows[0],
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  },
);

// Update school (Super Admin only)
router.put("/:id", authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const schoolId = parseSchoolId(req.params.id);
    if (!schoolId) {
      return res.status(400).json({ error: "Invalid school id" });
    }
    const { name, email, address, is_active } = req.body;

    const result = await pool.query(
      `UPDATE Schools 
       SET name = COALESCE($1, name), 
           email = COALESCE($2, email), 
           address = COALESCE($3, address),
           is_active = COALESCE($4, is_active)
       WHERE school_id = $5
       RETURNING *`,
      [name, email, address, is_active, schoolId],
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

// Deactivate school (Super Admin only)
router.delete(
  "/:id",
  authenticateToken,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const schoolId = parseSchoolId(req.params.id);
      if (!schoolId) {
        return res.status(400).json({ error: "Invalid school id" });
      }

      // Deactivate school instead of deleting
      const result = await pool.query(
        "UPDATE Schools SET is_active = false WHERE school_id = $1 RETURNING *",
        [schoolId],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "School not found" });
      }

      // Also deactivate all users in this school
      await pool.query(
        "UPDATE Users SET is_active = false WHERE school_id = $1",
        [schoolId],
      );

      res.json({
        message: "School deactivated successfully",
        school: result.rows[0],
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  },
);

// Get school analytics (Super Admin only)
router.get(
  "/:id/analytics",
  authenticateToken,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const schoolId = parseSchoolId(req.params.id);
      if (!schoolId) {
        return res.status(400).json({ error: "Invalid school id" });
      }

      // Get school info
      const schoolResult = await pool.query(
        "SELECT * FROM Schools WHERE school_id = $1",
        [schoolId],
      );

      if (schoolResult.rows.length === 0) {
        return res.status(404).json({ error: "School not found" });
      }

      const [
        studentCountResult,
        subjectsResult,
        performanceResult,
        schoolAdminsResult,
        publicStudentCountResult,
        publicStudentsResult,
      ] = await Promise.all([
        // Get active student count for selected school
        pool.query(
          "SELECT COUNT(*) as count FROM Users WHERE school_id = $1 AND role = 'student' AND is_active = true",
          [schoolId],
        ),
        // Get total subjects for selected school users
        pool.query(
          `SELECT COUNT(*) as count FROM Subjects 
           WHERE user_id IN (SELECT user_id FROM Users WHERE school_id = $1)`,
          [schoolId],
        ),
        // Get average performance for selected school users
        pool.query(
          `SELECT AVG(pl.score) as avg_score
           FROM PerformanceLogs pl
           JOIN Subjects s ON pl.subject_id = s.subject_id
           JOIN Users u ON s.user_id = u.user_id
           WHERE u.school_id = $1`,
          [schoolId],
        ),
        // Get admin details of selected school
        pool.query(
          `SELECT user_id, school_id, name, email, phone, is_active, created_at
           FROM Users
           WHERE school_id = $1 AND role = 'school_admin'
           ORDER BY created_at DESC`,
          [schoolId],
        ),
        // Count public students (students without school access)
        pool.query(
          "SELECT COUNT(*) as count FROM Users WHERE role = 'student' AND school_id IS NULL",
        ),
        // Latest public students for quick admin visibility
        pool.query(
          `SELECT user_id, name, email, phone, is_active, created_at
           FROM Users
           WHERE role = 'student' AND school_id IS NULL
           ORDER BY created_at DESC
           LIMIT 20`,
        ),
      ]);

      res.json({
        school: schoolResult.rows[0],
        total_students: parseInt(studentCountResult.rows[0].count),
        total_subjects: parseInt(subjectsResult.rows[0].count),
        average_performance: performanceResult.rows[0].avg_score
          ? parseFloat(performanceResult.rows[0].avg_score).toFixed(2)
          : 0,
        school_admins: schoolAdminsResult.rows,
        public_students: {
          total: parseInt(publicStudentCountResult.rows[0].count),
          recent: publicStudentsResult.rows,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  },
);

module.exports = router;
