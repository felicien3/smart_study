import React from "react";

const AnalyticsSection = ({ stats, topPerformers, onGetRecommendation }) => {
  const utilization = Math.min(100, Math.round((stats.totalHours / 35) * 100));

  return (
    <section className="card">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold">Analytics</h3>
        <button className="btn-primary" onClick={onGetRecommendation}>
          Get Recommendation
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
          <p className="text-sm text-blue-700">Average Performance</p>
          <p className="text-2xl font-bold text-blue-900">{stats.avgScore}%</p>
        </div>
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
          <p className="text-sm text-emerald-700">Study Hours Used</p>
          <p className="text-2xl font-bold text-emerald-900">
            {stats.totalHours}h / 35h
          </p>
        </div>
        <div className="p-4 rounded-xl bg-violet-50 border border-violet-100">
          <p className="text-sm text-violet-700">Active Subjects</p>
          <p className="text-2xl font-bold text-violet-900">{stats.totalSubjects}</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Weekly Study Utilization</span>
          <span className="text-sm font-semibold text-gray-900">{utilization}%</span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
            style={{ width: `${utilization}%` }}
          />
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Top 3 Subjects</h4>
        {topPerformers.length === 0 ? (
          <p className="text-sm text-gray-500">No analytics yet. Add subjects and scores.</p>
        ) : (
          <div className="space-y-2">
            {topPerformers.map((subject, idx) => (
              <div
                key={subject.subject_id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  idx % 2 === 0 ? "bg-gray-50" : "bg-white border border-gray-200"
                }`}
              >
                <span className="text-sm font-medium text-gray-800">
                  {idx + 1}. {subject.name}
                </span>
                <span className="text-sm font-bold text-blue-700">
                  {Number(subject.latest_score) || 0}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default AnalyticsSection;
