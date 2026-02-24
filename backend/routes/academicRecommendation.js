const express = require("express");
const pool = require("../config/db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Get academic path recommendation
router.get("/", authenticateToken, async (req, res) => {
  try {
    if (req.user.role === "student" && !req.user.school_id) {
      return res.status(403).json({
        error:
          "Academic recommendations are not available on the Basic Free plan.",
      });
    }

    // Get user's subjects and performance
    const subjectsResult = await pool.query(
      `
            SELECT s.*,
                   COALESCE(AVG(pl.score), 50) as avg_score,
                   COUNT(pl.log_id) as performance_count
            FROM Subjects s
            LEFT JOIN PerformanceLogs pl ON s.subject_id = pl.subject_id
            WHERE s.user_id = $1
            GROUP BY s.subject_id
        `,
      [req.user.userId],
    );

    const subjects = subjectsResult.rows;

    const trackDefinitions = [
      {
        key: "science",
        label: "Science",
        keywords: [
          "physics",
          "chemistry",
          "mathematics",
          "math",
          "biology",
          "agric",
          "further math",
        ],
      },
      {
        key: "social_sciences_arts",
        label: "Social Sciences / Arts",
        keywords: [
          "history",
          "economics",
          "geography",
          "literature",
          "government",
          "civic",
          "religious",
          "art",
          "music",
        ],
      },
      {
        key: "language",
        label: "Language",
        keywords: [
          "language",
          "english",
          "anglais",
          "french",
          "francais",
          "swahili",
          "kiswahili",
          "kinyarwanda",
          "ikinyarwanda",
          "rwanda",
          "linguistics",
          "communication",
        ],
      },
      {
        key: "construction",
        label: "Construction",
        keywords: [
          "construction",
          "building",
          "woodwork",
          "carpentry",
          "masonry",
          "civil",
          "quantity surveying",
        ],
      },
      {
        key: "ict",
        label: "ICT",
        keywords: [
          "ict",
          "computer",
          "computing",
          "information technology",
          "programming",
          "software",
          "data",
          "network",
        ],
      },
      {
        key: "mechanics",
        label: "Mechanics",
        keywords: [
          "mechanic",
          "automobile",
          "auto",
          "technical drawing",
          "engineering",
          "metalwork",
          "machine",
        ],
      },
      {
        key: "hospitality",
        label: "Hospitality",
        keywords: [
          "hospitality",
          "catering",
          "food",
          "nutrition",
          "tourism",
          "hotel",
          "home management",
        ],
      },
      {
        key: "fashion",
        label: "Fashion",
        keywords: [
          "fashion",
          "textile",
          "clothing",
          "garment",
          "design",
          "tailoring",
        ],
      },
    ];

    const trackStats = trackDefinitions.reduce((acc, track) => {
      acc[track.key] = { label: track.label, total: 0, count: 0 };
      return acc;
    }, {});

    const normalizeText = (value) =>
      String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const keywordMatches = (subjectName, keyword) => {
      const normalizedSubject = normalizeText(subjectName);
      const normalizedKeyword = normalizeText(keyword);

      // Word-boundary match where possible; fallback to substring for phrases.
      if (normalizedKeyword.includes(" ")) {
        return normalizedSubject.includes(normalizedKeyword);
      }
      const escaped = normalizedKeyword.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&",
      );
      const wordBoundary = new RegExp(`\\b${escaped}\\b`, "i");
      return (
        wordBoundary.test(normalizedSubject) ||
        normalizedSubject.includes(normalizedKeyword)
      );
    };

    subjects.forEach((subject) => {
      const subjectName = normalizeText(subject.name);
      const score = Number(subject.avg_score) || 0;

      // Hard language override for common language subjects.
      const hardLanguageTerms = [
        "english",
        "anglais",
        "french",
        "francais",
        "swahili",
        "kiswahili",
        "kinyarwanda",
        "ikinyarwanda",
      ];
      const isHardLanguageMatch = hardLanguageTerms.some((term) =>
        subjectName.includes(normalizeText(term)),
      );
      if (isHardLanguageMatch) {
        trackStats.language.total += score;
        trackStats.language.count += 1;
        return;
      }

      // Language takes precedence if matched.
      const languageTrack = trackDefinitions.find((track) => track.key === "language");
      const isLanguageMatch =
        languageTrack &&
        languageTrack.keywords.some((keyword) => keywordMatches(subjectName, keyword));

      if (isLanguageMatch) {
        trackStats.language.total += score;
        trackStats.language.count += 1;
        return;
      }

      trackDefinitions.forEach((track) => {
        if (track.key === "language") return;
        const isMatch = track.keywords.some((keyword) =>
          keywordMatches(subjectName, keyword),
        );
        if (isMatch) {
          trackStats[track.key].total += score;
          trackStats[track.key].count += 1;
        }
      });
    });

    const trackResults = trackDefinitions.map((track) => {
      const { total, count, label } = trackStats[track.key];
      const average = count > 0 ? total / count : 0;
      return {
        key: track.key,
        label,
        average,
        count,
      };
    });

    const matchedTracks = trackResults.filter((track) => track.count > 0);
    const trackPriority = {
      language: 1,
      science: 2,
      social_sciences_arts: 3,
      ict: 4,
      mechanics: 5,
      construction: 6,
      hospitality: 7,
      fashion: 8,
    };
    const rankTracks = (tracks) =>
      [...tracks].sort((a, b) => {
        if (b.average !== a.average) return b.average - a.average;
        if (b.count !== a.count) return b.count - a.count;
        const aPriority = trackPriority[a.key] ?? 99;
        const bPriority = trackPriority[b.key] ?? 99;
        return aPriority - bPriority;
      });

    const rankedTracks = rankTracks(trackResults);
    const rankedMatchedTracks = rankTracks(matchedTracks);
    const topTrack = rankedMatchedTracks[0];

    let recommendedPath = "General";
    let reasoning =
      "Based on your academic performance, we analyzed your scores across available tracks. ";

    if (matchedTracks.length === 0) {
      reasoning +=
        "No subject names matched the supported track categories yet. Add more subjects (or clearer subject names) to get a stronger recommendation.";
    } else if (topTrack.average >= 70) {
      recommendedPath = topTrack.label;
      reasoning += `Your strongest track is ${topTrack.label} with an average score of ${topTrack.average.toFixed(1)}%.`;
    } else if (topTrack.average >= 60) {
      recommendedPath = `${topTrack.label} (with additional support)`;
      reasoning += `You show potential in ${topTrack.label} with an average score of ${topTrack.average.toFixed(1)}%. Focus on consistency to strengthen this pathway.`;
    } else {
      recommendedPath = topTrack.label;
      reasoning += `Your current highest track is ${topTrack.label} (${topTrack.average.toFixed(1)}%), but performance is still developing. Focus on foundational improvement before specialization.`;
    }

    // Save recommendation
    await pool.query(
      "INSERT INTO AcademicRecommendations (user_id, recommended_path, reasoning) VALUES ($1, $2, $3)",
      [req.user.userId, recommendedPath, reasoning],
    );

    res.json({
      recommended_path: recommendedPath,
      reasoning,
      track_scores: rankedTracks.map((track) => ({
        track: track.label,
        average: track.average.toFixed(1),
        matched_subjects: track.count,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
