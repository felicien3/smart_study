const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const router = express.Router();

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Register (bootstrap only - first super admin)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const normalizedPhone = String(phone || "").trim() || null;

    const superAdminCount = await pool.query(
      "SELECT COUNT(*)::int as count FROM Users WHERE role = 'super_admin'",
    );

    if (superAdminCount.rows[0].count > 0) {
      return res.status(403).json({
        error:
          "Self registration is disabled. Contact your administrator for access.",
      });
    }

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email, and password are required" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters long" });
    }

    // Check if user exists
    const existingUser = await pool.query(
      "SELECT * FROM Users WHERE email = $1",
      [email],
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create initial super admin
    const result = await pool.query(
      "INSERT INTO Users (name, email, phone, password, role, school_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id, name, email, phone, role, school_id, is_active",
      [
        name.trim(),
        email.toLowerCase().trim(),
        normalizedPhone,
        hashedPassword,
        "super_admin",
        null,
      ],
    );

    const user = result.rows[0];

    // Generate token with role and school_id
    const token = jwt.sign(
      {
        userId: user.user_id,
        role: user.role,
        school_id: user.school_id,
      },
      process.env.JWT_SECRET,
    );

    res.json({
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        school_id: user.school_id,
        is_active: user.is_active,
      },
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Public student registration for Basic Free tier
router.post("/register/student", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const normalizedPhone = String(phone || "").trim() || null;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email, and password are required" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters long" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await pool.query(
      "SELECT user_id FROM Users WHERE email = $1",
      [normalizedEmail],
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Free-tier student accounts are not attached to a school.
    const result = await pool.query(
      "INSERT INTO Users (name, email, phone, password, role, school_id, is_active) VALUES ($1, $2, $3, $4, 'student', NULL, true) RETURNING user_id, name, email, phone, role, school_id, is_active",
      [name.trim(), normalizedEmail, normalizedPhone, hashedPassword],
    );

    const user = result.rows[0];

    const token = jwt.sign(
      {
        userId: user.user_id,
        role: user.role,
        school_id: user.school_id,
      },
      process.env.JWT_SECRET,
    );

    res.status(201).json({
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        school_id: user.school_id,
        is_active: user.is_active,
      },
      token,
      plan: {
        name: "Basic",
        tier: "free",
        max_subjects: 5,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user
    const result = await pool.query("SELECT * FROM Users WHERE email = $1", [
      email.toLowerCase().trim(),
    ]);

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];

    // Check if user account is active
    if (!user.is_active) {
      return res.status(403).json({ error: "Account is deactivated" });
    }

    // Non-super-admin users usually need active school access,
    // except free-tier students created via public signup.
    if (user.role !== "super_admin") {
      const isFreeStudent = user.role === "student" && !user.school_id;

      if (!isFreeStudent) {
        if (!user.school_id) {
          return res
            .status(403)
            .json({ error: "No school assigned to account" });
        }

        const schoolResult = await pool.query(
          "SELECT is_active FROM Schools WHERE school_id = $1",
          [user.school_id],
        );

        if (
          schoolResult.rows.length === 0 ||
          schoolResult.rows[0].is_active !== true
        ) {
          return res.status(403).json({
            error: "School access is inactive. Contact administrator.",
          });
        }
      }
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Generate token with role and school_id
    const token = jwt.sign(
      {
        userId: user.user_id,
        role: user.role,
        school_id: user.school_id,
      },
      process.env.JWT_SECRET,
    );

    res.json({
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        school_id: user.school_id,
        is_active: user.is_active,
      },
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
