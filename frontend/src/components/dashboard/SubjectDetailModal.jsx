import React from "react";
import { scoreBadge } from "./utils";

const SubjectDetailModal = ({ open, subject, performanceHistory, onClose }) => {
  if (!open || !subject) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{subject.name} Performance</h3>
          <button onClick={onClose} className="text-gray-600">
            Close
          </button>
        </div>
        {performanceHistory.length === 0 ? (
          <p className="text-sm text-gray-500">No performance history yet.</p>
        ) : (
          <div className="space-y-2">
            {[...performanceHistory]
              .sort((a, b) => b.week_number - a.week_number)
              .map((entry, idx) => (
                <div
                  key={entry.log_id}
                  className={`flex justify-between items-center p-3 rounded-lg ${
                    idx % 2 === 0 ? "bg-gray-50" : "bg-white border border-gray-200"
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium">Week {entry.week_number}</p>
                    <p className="text-xs text-gray-500">
                      {entry.created_at
                        ? new Date(entry.created_at).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-md text-sm ${scoreBadge(entry.score)}`}>
                    {entry.score}%
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubjectDetailModal;
