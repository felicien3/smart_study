import React from "react";

const RecommendationModal = ({ open, recommendation, onClose }) => {
  if (!open || !recommendation) return null;
  const trackScores = recommendation.track_scores || [];

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
      </div>
    </div>
  );
};

export default RecommendationModal;
