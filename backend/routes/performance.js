const express = require("express");
const pool = require("../config/db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Log performance
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { subject_id, score, week_number } = req.body;

    // Verify subject belongs to user
    const subjectResult = await pool.query(
      "SELECT * FROM Subjects WHERE subject_id = $1 AND user_id = $2",
      [subject_id, req.user.userId],
    );

    if (subjectResult.rows.length === 0) {
      return res
        .status(403)
        .json({ error: "Subject not found or access denied" });
    }

    const result = await pool.query(
      "INSERT INTO PerformanceLogs (subject_id, score, week_number) VALUES ($1, $2, $3) RETURNING *",
      [subject_id, score, week_number],
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get performance logs for user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `
            SELECT pl.*, s.name as subject_name
            FROM PerformanceLogs pl
            JOIN Subjects s ON pl.subject_id = s.subject_id
            WHERE s.user_id = $1
            ORDER BY pl.week_number DESC
        `,
      [req.user.userId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get performance for specific subject
router.get("/subject/:subjectId", authenticateToken, async (req, res) => {
  try {
    const { subjectId } = req.params;

    // Verify subject belongs to user
    const subjectResult = await pool.query(
      "SELECT * FROM Subjects WHERE subject_id = $1 AND user_id = $2",
      [subjectId, req.user.userId],
    );

    if (subjectResult.rows.length === 0) {
      return res
        .status(403)
        .json({ error: "Subject not found or access denied" });
    }

    const result = await pool.query(
      "SELECT * FROM PerformanceLogs WHERE subject_id = $1 ORDER BY week_number DESC",
      [subjectId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
