const express = require("express");
const pool = require("../config/db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Get all subjects for user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM Subjects WHERE user_id = $1",
      [req.user.userId],
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Create new subject
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { name, difficulty, exam_date } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "Subject name is required" });
    }

    // Free-tier (public) students not attached to a school can create up to 5 subjects.
    if (req.user.role === "student" && !req.user.school_id) {
      const countResult = await pool.query(
        "SELECT COUNT(*)::int as count FROM Subjects WHERE user_id = $1",
        [req.user.userId],
      );

      if (countResult.rows[0].count >= 5) {
        return res.status(403).json({
          error: "Basic Free plan allows up to 5 subjects. Upgrade to add more.",
        });
      }
    }

    const result = await pool.query(
      "INSERT INTO Subjects (user_id, name, difficulty, exam_date) VALUES ($1, $2, $3, $4) RETURNING *",
      [req.user.userId, String(name).trim(), difficulty, exam_date],
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update subject
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, difficulty, exam_date } = req.body;

    // Verify subject belongs to user
    const subjectResult = await pool.query(
      "SELECT * FROM Subjects WHERE subject_id = $1 AND user_id = $2",
      [id, req.user.userId],
    );

    if (subjectResult.rows.length === 0) {
      return res
        .status(403)
        .json({ error: "Subject not found or access denied" });
    }

    const result = await pool.query(
      "UPDATE Subjects SET name = $1, difficulty = $2, exam_date = $3 WHERE subject_id = $4 RETURNING *",
      [name, difficulty, exam_date, id],
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete subject
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify subject belongs to user
    const subjectResult = await pool.query(
      "SELECT * FROM Subjects WHERE subject_id = $1 AND user_id = $2",
      [id, req.user.userId],
    );

    if (subjectResult.rows.length === 0) {
      return res
        .status(403)
        .json({ error: "Subject not found or access denied" });
    }

    await pool.query("DELETE FROM Subjects WHERE subject_id = $1", [id]);

    res.json({ message: "Subject deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
