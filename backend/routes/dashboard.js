const express = require("express");
const pool = require("../config/db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

const getWeekNumber = (date = new Date()) => {
  const utcDate = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const day = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  return Math.ceil(((utcDate - yearStart) / 86400000 + 1) / 7);
};

// Get dashboard data
router.get("/", authenticateToken, async (req, res) => {
  try {
    const currentWeek = getWeekNumber();
    const schoolResult = await pool.query(
      `
        SELECT s.name AS school_name
        FROM Users u
        LEFT JOIN Schools s ON u.school_id = s.school_id
        WHERE u.user_id = $1
      `,
      [req.user.userId],
    );
    const schoolName = schoolResult.rows[0]?.school_name || null;

    // Get subjects with latest performance
    const subjectsResult = await pool.query(
      `
            SELECT
              s.*,
              COALESCE(latest.score, 0) AS latest_score,
              latest.week_number AS last_performance_week
            FROM Subjects s
            LEFT JOIN LATERAL (
              SELECT pl.score, pl.week_number
              FROM PerformanceLogs pl
              WHERE pl.subject_id = s.subject_id
              ORDER BY pl.week_number DESC, pl.log_id DESC
              LIMIT 1
            ) latest ON true
            WHERE s.user_id = $1
            ORDER BY s.created_at DESC
        `,
      [req.user.userId],
    );

    // Get current week study plan
    const currentWeekResult = await pool.query(
      `
            SELECT sp.*, s.name as subject_name
            FROM StudyPlans sp
            JOIN Subjects s ON sp.subject_id = s.subject_id
            WHERE s.user_id = $1 AND sp.week_number = $2
        `,
      [req.user.userId, currentWeek],
    );

    const latestWeekResult = await pool.query(
      `
            SELECT MAX(sp.week_number)::int as latest_week
            FROM StudyPlans sp
            JOIN Subjects s ON sp.subject_id = s.subject_id
            WHERE s.user_id = $1
        `,
      [req.user.userId],
    );
    const previousWeekResult = await pool.query(
      `
            SELECT MAX(sp.week_number)::int as previous_week
            FROM StudyPlans sp
            JOIN Subjects s ON sp.subject_id = s.subject_id
            WHERE s.user_id = $1 AND sp.week_number < $2
        `,
      [req.user.userId, currentWeek],
    );

    const latestStudyPlanWeek = latestWeekResult.rows[0]?.latest_week ?? null;
    const previousStudyPlanWeek =
      previousWeekResult.rows[0]?.previous_week ?? null;
    const needsNewPlan =
      subjectsResult.rows.length > 0 && currentWeekResult.rows.length === 0;

    const commentsResult = await pool.query(
      `
        SELECT pc.comment_id, pc.comment, pc.created_at, pc.log_id,
               sa.name as admin_name,
               pl.score, pl.week_number,
               s.name as subject_name
        FROM PerformanceComments pc
        LEFT JOIN Users sa ON pc.school_admin_id = sa.user_id
        LEFT JOIN PerformanceLogs pl ON pc.log_id = pl.log_id
        LEFT JOIN Subjects s ON pl.subject_id = s.subject_id
        WHERE pc.student_id = $1
        ORDER BY pc.created_at DESC
        LIMIT 20
      `,
      [req.user.userId],
    );

    res.json({
      school_name: schoolName,
      subjects: subjectsResult.rows,
      current_study_plan: currentWeekResult.rows,
      current_week: currentWeek,
      latest_study_plan_week: latestStudyPlanWeek,
      previous_study_plan_week: previousStudyPlanWeek,
      needs_new_plan: needsNewPlan,
      performance_comments: commentsResult.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
