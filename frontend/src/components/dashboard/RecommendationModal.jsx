import React from "react";

const RecommendationModal = ({ open, recommendation, onClose }) => {
  if (!open || !recommendation) return null;
  const trackScores = recommendation.track_scores || [];
  const insights = recommendation.ai_insights || {};
  const weakSubjects = insights.weak_subjects || [];
  const studyAdjustments = insights.study_hour_adjustments || [];
  const alevelCombinations = insights.alevel_combinations || [];
  const universityFaculties = insights.university_faculties || [];
  const careerDirections = insights.career_directions || [];
  const schoolDecisionSupport = insights.school_decision_support || [];

  const trackOrder = [
    "Science",
    "Language",
    "Social Sciences / Arts",
    "ICT",
    "Mechanics",
    "Construction",
    "Hospitality",
    "Fashion",
  ];

  const sortedTrackScores = [...trackScores].sort((a, b) => {
    const ai = trackOrder.indexOf(a.track);
    const bi = trackOrder.indexOf(b.track);
    const safeAi = ai === -1 ? Number.MAX_SAFE_INTEGER : ai;
    const safeBi = bi === -1 ? Number.MAX_SAFE_INTEGER : bi;
    if (safeAi !== safeBi) return safeAi - safeBi;
    return Number(b.average) - Number(a.average);
  });
  const matchedTrackScores = sortedTrackScores.filter(
    (track) => Number(track.matched_subjects) > 0,
  );
  const tracksToDisplay =
    matchedTrackScores.length > 0 ? matchedTrackScores : sortedTrackScores;

  const trackCardClass = (trackName) => {
    if (trackName === "Language") {
      return "p-3 rounded-lg border border-amber-200 bg-amber-50";
    }
    return "p-3 rounded-lg border border-slate-200 bg-slate-50";
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Academic Recommendation</h3>
          <button onClick={onClose} className="text-gray-600">
            Close
          </button>
        </div>
        <div className="p-4 rounded-lg border border-blue-200 bg-blue-50 mb-4">
          <p className="text-sm text-blue-700 font-medium">Recommended Path</p>
          <p className="text-xl font-bold text-blue-900">
            {recommendation.recommended_path}
          </p>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Recommendation tracks now include Language.
        </p>
        <p className="text-gray-700 mb-4">{recommendation.reasoning}</p>
        <p className="text-xs text-slate-500 mb-4">
          Recommendation source: {recommendation.model_source || "rule_engine"}.
        </p>
        {tracksToDisplay.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tracksToDisplay.map((track) => (
              <div
                key={track.track}
                className={trackCardClass(track.track)}
              >
                <p className="text-sm text-slate-700">{track.track}</p>
                <p className="text-xl font-bold text-slate-900">
                  {track.average}%
                </p>
                <p className="text-xs text-slate-500">
                  Matched subjects: {track.matched_subjects}
                </p>
              </div>
            ))}
          </div>
        )}
        {matchedTrackScores.length > 0 &&
          matchedTrackScores.length < sortedTrackScores.length && (
            <p className="mt-3 text-xs text-slate-500">
              Showing tracks with matched subjects only.
            </p>
          )}

        {alevelCombinations.length > 0 && (
          <div className="mt-5 p-4 rounded-lg border border-indigo-200 bg-indigo-50">
            <p className="text-sm font-semibold text-indigo-800 mb-2">
              Suggested A' Level Combinations
            </p>
            <ul className="text-sm text-indigo-900 space-y-1">
              {alevelCombinations.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
        )}

        {universityFaculties.length > 0 && (
          <div className="mt-4 p-4 rounded-lg border border-emerald-200 bg-emerald-50">
            <p className="text-sm font-semibold text-emerald-800 mb-2">
              Recommended University Faculties
            </p>
            <ul className="text-sm text-emerald-900 space-y-1">
              {universityFaculties.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
        )}

        {careerDirections.length > 0 && (
          <div className="mt-4 p-4 rounded-lg border border-fuchsia-200 bg-fuchsia-50">
            <p className="text-sm font-semibold text-fuchsia-800 mb-2">
              Career and Education Directions
            </p>
            <ul className="text-sm text-fuchsia-900 space-y-1">
              {careerDirections.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
        )}

        {weakSubjects.length > 0 && (
          <div className="mt-4 p-4 rounded-lg border border-rose-200 bg-rose-50">
            <p className="text-sm font-semibold text-rose-800 mb-2">
              Weak Subject Analysis
            </p>
            <div className="space-y-2">
              {weakSubjects.map((subject) => (
                <div
                  key={subject.subject}
                  className="rounded-md border border-rose-200 bg-white p-2"
                >
                  <p className="text-sm font-medium text-rose-900">{subject.subject}</p>
                  <p className="text-xs text-rose-700">
                    Avg: {subject.average_score}% | Latest: {subject.latest_score}% | Gap to 70%:{" "}
                    {subject.gap_to_target_70}%
                  </p>
                  <p className="text-xs text-rose-700">
                    Exam in days: {subject.days_until_exam ?? "N/A"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {studyAdjustments.length > 0 && (
          <div className="mt-4 p-4 rounded-lg border border-amber-200 bg-amber-50">
            <p className="text-sm font-semibold text-amber-800 mb-2">
              Study Hour Adjustment Advice
            </p>
            <div className="space-y-2">
              {studyAdjustments.map((subject) => (
                <div
                  key={subject.subject}
                  className="rounded-md border border-amber-200 bg-white p-2"
                >
                  <p className="text-sm font-medium text-amber-900">
                    {subject.subject}: {subject.recommended_hours}h/week
                  </p>
                  <p className="text-xs text-amber-700">
                    Latest: {subject.latest_score}% | Change: {subject.score_change}% | Exam in days:{" "}
                    {subject.days_until_exam ?? "N/A"}
                  </p>
                  {Array.isArray(subject.rationale) && subject.rationale.length > 0 && (
                    <p className="text-xs text-amber-700">
                      Factors: {subject.rationale.join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {schoolDecisionSupport.length > 0 && (
          <div className="mt-4 p-4 rounded-lg border border-slate-300 bg-slate-100">
            <p className="text-sm font-semibold text-slate-800 mb-2">
              School Decision Support
            </p>
            <ul className="text-sm text-slate-700 space-y-1">
              {schoolDecisionSupport.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationModal;
