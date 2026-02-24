import React from "react";

const DashboardCards = ({ stats, topPerformers }) => {
  return (
    <div className="dashboard-grid">
      <section className="dashboard-card">
        <h3 className="dashboard-card-title">Statistics</h3>
        <div className="dashboard-stat-item">
          <span className="dashboard-stat-label">Total Subjects</span>
          <span className="dashboard-stat-value">{stats.totalSubjects}</span>
        </div>
        <div className="dashboard-stat-item">
          <span className="dashboard-stat-label">Plan Sessions</span>
          <span className="dashboard-stat-value">{stats.sessions}</span>
        </div>
        <div className="dashboard-stat-item">
          <span className="dashboard-stat-label">Study Hours</span>
          <span className="dashboard-stat-value">{stats.totalHours}h</span>
        </div>
        <div className="dashboard-stat-item">
          <span className="dashboard-stat-label">Average Score</span>
          <span className="dashboard-stat-value">{stats.avgScore}%</span>
        </div>
      </section>

      <section className="dashboard-card">
        <h3 className="dashboard-card-title">Performance Range</h3>
        <div className="dashboard-stat-item">
          <span className="dashboard-stat-label">Highest</span>
          <span className="dashboard-stat-value text-green-600">{stats.max}%</span>
        </div>
        <div className="dashboard-stat-item">
          <span className="dashboard-stat-label">Lowest</span>
          <span className="dashboard-stat-value text-red-600">{stats.min}%</span>
        </div>
        <div className="dashboard-stat-item">
          <span className="dashboard-stat-label">Range</span>
          <span className="dashboard-stat-value">{stats.range}%</span>
        </div>
      </section>

      <section className="dashboard-card">
        <h3 className="dashboard-card-title">Top Performers</h3>
        {topPerformers.length === 0 && <p className="text-sm text-gray-500">No subjects yet</p>}
        {topPerformers.map((subject, index) => (
          <div className="dashboard-performer-item" key={subject.subject_id}>
            <span className="dashboard-performer-name">
              {index + 1}. {subject.name}
            </span>
            <span
              className={`dashboard-performer-score ${
                Number(subject.latest_score) >= 80
                  ? "high"
                  : Number(subject.latest_score) >= 60
                    ? "medium"
                    : "low"
              }`}
            >
              {Number(subject.latest_score) || 0}%
            </span>
          </div>
        ))}
      </section>
    </div>
  );
};

export default DashboardCards;
