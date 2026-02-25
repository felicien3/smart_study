const express = require("express");
const pool = require("../config/db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

const TRACK_PATHWAY_MAP = {
  Science: {
    alevel_combinations: [
      "PCM (Physics, Chemistry, Mathematics)",
      "PCB (Physics, Chemistry, Biology)",
      "MCE (Mathematics, Computer Science, Economics)",
    ],
    university_faculties: [
      "Engineering",
      "Health and Medical Sciences",
      "Computer Science and IT",
      "Natural Sciences",
    ],
    career_directions: [
      "Software Engineering",
      "Medicine and Allied Health",
      "Civil and Electrical Engineering",
      "Data Science",
    ],
  },
  "Social Sciences / Arts": {
    alevel_combinations: [
      "HEG (History, Economics, Geography)",
      "LEG (Literature, Economics, Geography)",
      "HGL (History, Geography, Literature)",
    ],
    university_faculties: [
      "Law",
      "Economics and Management",
      "Social Sciences",
      "Arts and Humanities",
    ],
    career_directions: [
      "Public Administration",
      "Policy and Governance",
      "Journalism and Media",
      "Business Analysis",
    ],
  },
  Language: {
    alevel_combinations: [
      "LKG (Literature, Languages, Geography)",
      "LEH (Literature, Economics, History)",
      "Language-focused Arts Combination",
    ],
    university_faculties: [
      "Languages and Linguistics",
      "Communication and Media",
      "Education",
      "International Relations",
    ],
    career_directions: [
      "Teaching and Education",
      "Translation and Interpretation",
      "Public Relations",
      "Content and Communications",
    ],
  },
  ICT: {
    alevel_combinations: [
      "MCE (Mathematics, Computer Science, Economics)",
      "MPC (Mathematics, Physics, Computer Science)",
      "Computer and Technology-focused Combination",
    ],
    university_faculties: [
      "Computer Science",
      "Information Systems",
      "Software Engineering",
      "Cybersecurity",
    ],
    career_directions: [
      "Software Development",
      "Network and Systems Administration",
      "Cybersecurity Analysis",
      "Product and Technical Support",
    ],
  },
  Mechanics: {
    alevel_combinations: [
      "Technical Mechanics-focused Combination",
      "Physics and Technical Drawing Combination",
      "Automobile and Mechanical Studies Combination",
    ],
    university_faculties: [
      "Mechanical Engineering",
      "Automotive Engineering",
      "Industrial Technology",
      "Technical Education",
    ],
    career_directions: [
      "Mechanical Technician",
      "Automotive Engineering",
      "Industrial Maintenance",
      "Manufacturing Operations",
    ],
  },
  Construction: {
    alevel_combinations: [
      "Building and Construction Combination",
      "Civil and Technical Drawing Combination",
      "Woodwork and Masonry Combination",
    ],
    university_faculties: [
      "Civil Engineering",
      "Architecture",
      "Construction Management",
      "Quantity Surveying",
    ],
    career_directions: [
      "Site Engineering",
      "Construction Project Management",
      "Architecture Support",
      "Building Inspection",
    ],
  },
  Hospitality: {
    alevel_combinations: [
      "Hospitality and Tourism Combination",
      "Nutrition and Home Management Combination",
      "Catering and Services Combination",
    ],
    university_faculties: [
      "Hospitality Management",
      "Tourism and Travel",
      "Food Science and Nutrition",
      "Business Administration",
    ],
    career_directions: [
      "Hotel Operations",
      "Tourism Management",
      "Culinary and Food Services",
      "Event Management",
    ],
  },
  Fashion: {
    alevel_combinations: [
      "Fashion and Textile Combination",
      "Design and Garment Combination",
      "Creative Arts and Fashion Combination",
    ],
    university_faculties: [
      "Fashion Design",
      "Textile Engineering",
      "Creative Arts",
      "Business and Entrepreneurship",
    ],
    career_directions: [
      "Fashion Design",
      "Textile and Garment Production",
      "Creative Direction",
      "Fashion Entrepreneurship",
    ],
  },
  General: {
    alevel_combinations: [
      "Balanced Science-Arts Combination",
      "General Education Combination",
      "Interest-led Combination with guidance",
    ],
    university_faculties: [
      "General Studies",
      "Interdisciplinary Programs",
      "Education",
      "Business",
    ],
    career_directions: [
      "Explore through internships and projects",
      "Foundational business and communication",
      "Education and training pathways",
      "Interdisciplinary entry roles",
    ],
  },
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const buildTrackAnalysis = (subjects) => {
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

    if (normalizedKeyword.includes(" ")) {
      return normalizedSubject.includes(normalizedKeyword);
    }
    const escaped = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const wordBoundary = new RegExp(`\\b${escaped}\\b`, "i");
    return (
      wordBoundary.test(normalizedSubject) ||
      normalizedSubject.includes(normalizedKeyword)
    );
  };

  subjects.forEach((subject) => {
    const subjectName = normalizeText(subject.name);
    const score = Number(subject.avg_score) || 0;

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

  return {
    rankedTracks: rankTracks(trackResults),
    rankedMatchedTracks: rankTracks(matchedTracks),
    matchedTracks,
  };
};

const buildRuleBasedRecommendation = (trackAnalysis) => {
  const { rankedTracks, rankedMatchedTracks, matchedTracks } = trackAnalysis;
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

  return {
    recommended_path: recommendedPath,
    reasoning,
    track_scores: rankedTracks.map((track) => ({
      track: track.label,
      average: track.average.toFixed(1),
      matched_subjects: track.count,
    })),
  };
};

const buildDeterministicInsights = (subjects, recommendedPath) => {
  const now = new Date();

  const normalized = subjects.map((subject) => {
    const average = Number(subject.avg_score) || 0;
    const latestScore = Number(subject.latest_score ?? average) || 0;
    const previousScore = Number(subject.previous_score ?? latestScore) || latestScore;
    const scoreChange = latestScore - previousScore;
    const difficulty = Number(subject.difficulty || 3);

    const daysUntilExam = subject.exam_date
      ? Math.ceil((new Date(subject.exam_date) - now) / (1000 * 60 * 60 * 24))
      : null;

    let recommendedHours = 2;
    const rationale = [];

    if (latestScore < 60 || average < 60) {
      recommendedHours += 2;
      rationale.push("low performance trend");
    } else if (latestScore < 75 || average < 75) {
      recommendedHours += 1;
      rationale.push("moderate performance trend");
    }

    if (difficulty >= 4) {
      recommendedHours += 1;
      rationale.push("high subject difficulty");
    }

    if (daysUntilExam !== null && daysUntilExam <= 14) {
      recommendedHours += 1;
      rationale.push("exam urgency within 14 days");
    }

    if (scoreChange >= 10) {
      recommendedHours -= 1;
      rationale.push("strong recent improvement");
    } else if (scoreChange <= -10) {
      recommendedHours += 1;
      rationale.push("declining recent performance");
    }

    return {
      subject: subject.name,
      average_score: Number(average.toFixed(1)),
      latest_score: Number(latestScore.toFixed(1)),
      score_change: Number(scoreChange.toFixed(1)),
      days_until_exam: daysUntilExam,
      recommended_hours: clamp(recommendedHours, 1, 5),
      rationale,
    };
  });

  const weakSubjects = normalized
    .filter((item) => item.latest_score < 65 || item.average_score < 65)
    .sort(
      (a, b) =>
        Math.min(a.latest_score, a.average_score) -
        Math.min(b.latest_score, b.average_score),
    )
    .slice(0, 5)
    .map((item) => ({
      subject: item.subject,
      average_score: item.average_score,
      latest_score: item.latest_score,
      gap_to_target_70: Number((70 - Math.max(item.latest_score, item.average_score)).toFixed(1)),
      days_until_exam: item.days_until_exam,
    }));

  const studyHourAdjustments = normalized
    .sort((a, b) => b.recommended_hours - a.recommended_hours)
    .slice(0, 10);

  const mappedPath = TRACK_PATHWAY_MAP[recommendedPath]
    ? recommendedPath
    : "General";

  const schoolDecisionSupport = [
    weakSubjects.length > 0
      ? `Prioritize intervention sessions for ${weakSubjects[0].subject} and other weak subjects this week.`
      : "Maintain weekly mentorship check-ins to preserve strong performance momentum.",
    "Use study-hour adjustments to allocate coaching time and track improvement every week.",
    "Review subject performance before each exam cycle to update pathway and faculty guidance.",
  ];

  return {
    weak_subjects: weakSubjects,
    study_hour_adjustments: studyHourAdjustments,
    alevel_combinations: TRACK_PATHWAY_MAP[mappedPath].alevel_combinations,
    university_faculties: TRACK_PATHWAY_MAP[mappedPath].university_faculties,
    career_directions: TRACK_PATHWAY_MAP[mappedPath].career_directions,
    school_decision_support: schoolDecisionSupport,
  };
};

const ensureStringArray = (value, fallback = []) => {
  if (!Array.isArray(value)) return fallback;
  const normalized = value
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .slice(0, 8);
  return normalized.length > 0 ? normalized : fallback;
};

const ensureWeakSubjects = (value, fallback) => {
  if (!Array.isArray(value)) return fallback;
  const normalized = value
    .map((item) => ({
      subject: String(item?.subject || "").trim(),
      average_score: Number(item?.average_score ?? 0),
      latest_score: Number(item?.latest_score ?? 0),
      gap_to_target_70: Number(item?.gap_to_target_70 ?? 0),
      days_until_exam:
        item?.days_until_exam === null || item?.days_until_exam === undefined
          ? null
          : Number(item?.days_until_exam),
    }))
    .filter((item) => item.subject)
    .slice(0, 5);

  return normalized.length > 0 ? normalized : fallback;
};

const ensureStudyAdjustments = (value, fallback) => {
  if (!Array.isArray(value)) return fallback;
  const normalized = value
    .map((item) => ({
      subject: String(item?.subject || "").trim(),
      average_score: Number(item?.average_score ?? 0),
      latest_score: Number(item?.latest_score ?? 0),
      score_change: Number(item?.score_change ?? 0),
      days_until_exam:
        item?.days_until_exam === null || item?.days_until_exam === undefined
          ? null
          : Number(item?.days_until_exam),
      recommended_hours: clamp(Number(item?.recommended_hours ?? 2), 1, 8),
      rationale: ensureStringArray(item?.rationale || [], []),
    }))
    .filter((item) => item.subject)
    .slice(0, 10);

  return normalized.length > 0 ? normalized : fallback;
};

const fetchImpl = (...args) => {
  if (typeof fetch === "function") return fetch(...args);
  return import("node-fetch").then(({ default: nodeFetch }) => nodeFetch(...args));
};

const getOpenAiRecommendation = async ({ subjects, fallbackRecommendation, fallbackInsights }) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const endpoint =
    process.env.OPENAI_BASE_URL || "https://api.openai.com/v1/chat/completions";

  const payload = {
    model,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You are an academic advisor assistant. Return ONLY valid JSON with keys: recommended_path, reasoning, alevel_combinations, university_faculties, career_directions, school_decision_support, weak_subjects, study_hour_adjustments.",
      },
      {
        role: "user",
        content: JSON.stringify({
          allowed_paths: Object.keys(TRACK_PATHWAY_MAP),
          subjects: subjects.map((subject) => ({
            name: subject.name,
            difficulty: Number(subject.difficulty || 3),
            exam_date: subject.exam_date,
            avg_score: Number(subject.avg_score) || 0,
            latest_score: Number(subject.latest_score ?? subject.avg_score) || 0,
            previous_score: Number(subject.previous_score ?? subject.avg_score) || 0,
            performance_count: Number(subject.performance_count) || 0,
          })),
          baseline_recommendation: fallbackRecommendation,
          baseline_insights: fallbackInsights,
          instruction:
            "Pick one allowed path. Keep reasoning concise and evidence-based. Return practical arrays for school support and study adjustments.",
        }),
      },
    ],
    response_format: { type: "json_object" },
  };

  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) return null;

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    return null;
  }

  const recommendedPath = String(parsed.recommended_path || "").trim();
  const reasoning = String(parsed.reasoning || "").trim();
  if (!recommendedPath || !reasoning) return null;

  return {
    recommended_path: recommendedPath,
    reasoning,
    alevel_combinations: parsed.alevel_combinations,
    university_faculties: parsed.university_faculties,
    career_directions: parsed.career_directions,
    school_decision_support: parsed.school_decision_support,
    weak_subjects: parsed.weak_subjects,
    study_hour_adjustments: parsed.study_hour_adjustments,
  };
};

// Get academic path recommendation
router.get("/", authenticateToken, async (req, res) => {
  try {
    if (req.user.role === "student" && !req.user.school_id) {
      return res.status(403).json({
        error:
          "Academic recommendations are not available on the Basic Free plan.",
      });
    }

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

    const subjects = subjectsResult.rows.map((row) => ({
      ...row,
      avg_score: Number(row.avg_score) || 50,
      performance_count: Number(row.performance_count) || 0,
    }));

    const performanceRows = await pool.query(
      `
        SELECT s.subject_id, pl.score, pl.week_number, pl.log_id
        FROM Subjects s
        LEFT JOIN PerformanceLogs pl ON s.subject_id = pl.subject_id
        WHERE s.user_id = $1
        ORDER BY s.subject_id ASC, pl.week_number DESC, pl.log_id DESC
      `,
      [req.user.userId],
    );

    const performanceBySubject = new Map();
    performanceRows.rows.forEach((entry) => {
      if (entry.score === null || entry.score === undefined) return;
      if (!performanceBySubject.has(entry.subject_id)) {
        performanceBySubject.set(entry.subject_id, []);
      }
      const scores = performanceBySubject.get(entry.subject_id);
      if (scores.length < 2) {
        scores.push(Number(entry.score));
      }
    });

    const subjectsWithTrend = subjects.map((subject) => {
      const recent = performanceBySubject.get(subject.subject_id) || [];
      const latest = recent[0] ?? subject.avg_score;
      const previous = recent[1] ?? latest;
      return {
        ...subject,
        latest_score: latest,
        previous_score: previous,
      };
    });

    const trackAnalysis = buildTrackAnalysis(subjectsWithTrend);
    const fallbackRecommendation = buildRuleBasedRecommendation(trackAnalysis);
    const normalizedFallbackPath = TRACK_PATHWAY_MAP[fallbackRecommendation.recommended_path]
      ? fallbackRecommendation.recommended_path
      : "General";
    const fallbackInsights = buildDeterministicInsights(
      subjectsWithTrend,
      normalizedFallbackPath,
    );

    let aiRecommendation = null;
    try {
      aiRecommendation = await getOpenAiRecommendation({
        subjects: subjectsWithTrend,
        fallbackRecommendation,
        fallbackInsights,
      });
    } catch (openAiError) {
      console.error("OpenAI recommendation failed; using fallback:", openAiError);
    }

    const aiSuggestedPath = String(aiRecommendation?.recommended_path || "").trim();
    const recommendedPath = TRACK_PATHWAY_MAP[aiSuggestedPath]
      ? aiSuggestedPath
      : normalizedFallbackPath;

    const reasoning = aiRecommendation?.reasoning || fallbackRecommendation.reasoning;

    const aiInsights = {
      weak_subjects: ensureWeakSubjects(
        aiRecommendation?.weak_subjects,
        fallbackInsights.weak_subjects,
      ),
      study_hour_adjustments: ensureStudyAdjustments(
        aiRecommendation?.study_hour_adjustments,
        fallbackInsights.study_hour_adjustments,
      ),
      alevel_combinations: ensureStringArray(
        aiRecommendation?.alevel_combinations,
        (TRACK_PATHWAY_MAP[recommendedPath] || TRACK_PATHWAY_MAP.General).alevel_combinations,
      ),
      university_faculties: ensureStringArray(
        aiRecommendation?.university_faculties,
        (TRACK_PATHWAY_MAP[recommendedPath] || TRACK_PATHWAY_MAP.General).university_faculties,
      ),
      career_directions: ensureStringArray(
        aiRecommendation?.career_directions,
        (TRACK_PATHWAY_MAP[recommendedPath] || TRACK_PATHWAY_MAP.General).career_directions,
      ),
      school_decision_support: ensureStringArray(
        aiRecommendation?.school_decision_support,
        fallbackInsights.school_decision_support,
      ),
    };

    await pool.query(
      "INSERT INTO AcademicRecommendations (user_id, recommended_path, reasoning) VALUES ($1, $2, $3)",
      [req.user.userId, recommendedPath, reasoning],
    );

    res.json({
      recommended_path: recommendedPath,
      reasoning,
      track_scores: fallbackRecommendation.track_scores,
      ai_insights: aiInsights,
      model_source: aiRecommendation ? "openai" : "rule_engine",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
