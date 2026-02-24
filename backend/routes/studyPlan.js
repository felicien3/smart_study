const express = require("express");
const pool = require("../config/db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Generate adaptive study plan
router.post("/generate", authenticateToken, async (req, res) => {
  let transactionStarted = false;
  try {
    const { week_number } = req.body;
    const parsedWeekNumber = Number(week_number);

    if (!Number.isInteger(parsedWeekNumber) || parsedWeekNumber <= 0) {
      return res.status(400).json({ error: "Valid week_number is required" });
    }

    // Get user's subjects
    const subjectsResult = await pool.query(
      "SELECT * FROM Subjects WHERE user_id = $1",
      [req.user.userId],
    );

    const subjects = subjectsResult.rows;

    if (subjects.length === 0) {
      return res.json({ week_number, study_plan: [] });
    }

    // 5 hours max per day -> 35 max per week
    const totalWeeklyHours = 35;

    const subjectPlans = [];

    for (const subject of subjects) {
      // Get latest two performance scores for this subject
      const performanceResult = await pool.query(
        "SELECT score FROM PerformanceLogs WHERE subject_id = $1 ORDER BY week_number DESC LIMIT 2",
        [subject.subject_id],
      );

      const latestScore = Number(performanceResult.rows[0]?.score ?? 50);
      const previousScore = Number(performanceResult.rows[1]?.score ?? latestScore);
      const scoreChange = latestScore - previousScore;

      // Calculate days until exam
      const daysUntilExam = subject.exam_date
        ? Math.ceil(
            (new Date(subject.exam_date) - new Date()) / (1000 * 60 * 60 * 24),
          )
        : 30;

      // Marks-driven allocation:
      // High marks -> 1 hour, average -> 2 hours, low marks -> 3 hours.
      let allocatedHours = 2;
      if (latestScore >= 80) {
        allocatedHours = 1;
      } else if (latestScore < 60) {
        allocatedHours = 3;
      }

      // Harder subjects can get one extra hour if they are not already top-scoring.
      if (Number(subject.difficulty || 3) >= 4 && latestScore < 80) {
        allocatedHours += 1;
      }

      // Near exams can get one extra hour for non-top scores.
      if (daysUntilExam < 14 && latestScore < 80) {
        allocatedHours += 1;
      }

      // Trend adjustments:
      // Improving well -> reduce load, dropping -> increase load.
      if (scoreChange >= 10) {
        allocatedHours -= 1;
      } else if (scoreChange <= -10) {
        allocatedHours += 1;
      }

      // Final per-subject range: 1..3 hours
      subjectPlans.push({
        subject_id: subject.subject_id,
        subject_name: subject.name,
        allocated_hours: Math.max(1, Math.min(allocatedHours, 3)),
        latest_score: latestScore,
        previous_score: previousScore,
        score_change: scoreChange,
        days_until_exam: daysUntilExam,
      });
    }

    // Keep the whole week under 35 hours while preserving 1..3 per subject.
    let totalAllocated = subjectPlans.reduce(
      (sum, plan) => sum + plan.allocated_hours,
      0,
    );

    if (totalAllocated > totalWeeklyHours) {
      const ordered = [...subjectPlans].sort((a, b) => {
        // Reduce from stronger/improving subjects first.
        if (a.latest_score !== b.latest_score) {
          return b.latest_score - a.latest_score;
        }
        return b.score_change - a.score_change;
      });

      let overflow = totalAllocated - totalWeeklyHours;
      while (overflow > 0) {
        let changed = false;
        for (const plan of ordered) {
          if (overflow <= 0) break;
          if (plan.allocated_hours > 1) {
            plan.allocated_hours -= 1;
            overflow -= 1;
            changed = true;
          }
        }

        if (!changed) {
          break;
        }
      }

      totalAllocated = subjectPlans.reduce(
        (sum, plan) => sum + plan.allocated_hours,
        0,
      );
    }

    // Replace (not append) study plan for this user + week.
    await pool.query("BEGIN");
    transactionStarted = true;

    await pool.query(
      `
        DELETE FROM StudyPlans sp
        USING Subjects s
        WHERE sp.subject_id = s.subject_id
          AND s.user_id = $1
          AND sp.week_number = $2
      `,
      [req.user.userId, parsedWeekNumber],
    );

    for (const plan of subjectPlans) {
      await pool.query(
        "INSERT INTO StudyPlans (subject_id, hours, week_number) VALUES ($1, $2, $3)",
        [plan.subject_id, plan.allocated_hours, parsedWeekNumber],
      );
    }

    await pool.query("COMMIT");
    transactionStarted = false;

    res.json({
      week_number: parsedWeekNumber,
      study_plan: subjectPlans,
      total_hours: totalAllocated,
    });
  } catch (error) {
    if (transactionStarted) {
      try {
        await pool.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Rollback failed:", rollbackError);
      }
    }
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get study plan for a specific week
router.get("/:weekNumber", authenticateToken, async (req, res) => {
  try {
    const { weekNumber } = req.params;

    const result = await pool.query(
      `
            SELECT sp.*, s.name as subject_name
            FROM StudyPlans sp
            JOIN Subjects s ON sp.subject_id = s.subject_id
            WHERE s.user_id = $1 AND sp.week_number = $2
        `,
      [req.user.userId, weekNumber],
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
