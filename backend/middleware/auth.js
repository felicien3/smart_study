const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await pool.query(
      `
      SELECT u.user_id, u.role, u.school_id, u.is_active,
             s.is_active as school_active
      FROM Users u
      LEFT JOIN Schools s ON u.school_id = s.school_id
      WHERE u.user_id = $1
      `,
      [decoded.userId],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }

    const currentUser = result.rows[0];

    if (!currentUser.is_active) {
      return res.status(403).json({ error: "Account is deactivated" });
    }

    if (currentUser.role !== "super_admin") {
      const isFreeStudent =
        currentUser.role === "student" && !currentUser.school_id;

      if (!isFreeStudent) {
        if (!currentUser.school_id || currentUser.school_active !== true) {
          return res.status(403).json({ error: "School access is inactive" });
        }
      }
    }

    req.user = {
      userId: currentUser.user_id,
      role: currentUser.role,
      school_id: currentUser.school_id,
    };

    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid token" });
  }
};

// Middleware to require specific roles
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Access denied. Insufficient permissions.",
        required: allowedRoles,
        current: req.user.role,
      });
    }

    next();
  };
};

// Convenience middlewares for common roles
const requireSuperAdmin = requireRole("super_admin");
const requireSchoolAdmin = requireRole("school_admin");
const requireStudent = requireRole("student");
const requireAdminOrSuperAdmin = requireRole("super_admin", "school_admin");

module.exports = {
  authenticateToken,
  requireRole,
  requireSuperAdmin,
  requireSchoolAdmin,
  requireStudent,
  requireAdminOrSuperAdmin,
};
