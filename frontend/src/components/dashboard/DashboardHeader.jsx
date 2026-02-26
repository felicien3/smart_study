import React from "react";

const TITLES = {
  overview: {
    title: "Dashboard Overview",
    subtitle: "Track your progress and update your study plan.",
  },
  subjects: {
    title: "Subjects",
    subtitle: "Manage subjects, difficulty, and exam dates.",
  },
  "study-plan": {
    title: "Study Plan",
    subtitle: "Review your latest generated study allocations.",
  },
  "academic-path": {
    title: "Academic Path",
    subtitle: "Enter national exam marks to explore faculties and programs.",
  },
  analytics: {
    title: "Analytics",
    subtitle: "Monitor trends and performance insights.",
  },
  profile: {
    title: "Profile",
    subtitle: "View your account and academic summary.",
  },
};

const DashboardHeader = ({ user, activeView, stats }) => {
  const currentDate = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const header = TITLES[activeView] || TITLES.overview;
  const initials =
    user?.name
      ?.split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "ST";

  return (
    <header className="dashboard-topbar">
      <div>
        <h1 className="dashboard-topbar-title">{header.title}</h1>
        <p className="dashboard-topbar-subtitle">{header.subtitle}</p>
      </div>
      <div className="dashboard-topbar-user">
        <div className="dashboard-topbar-date inline-flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">calendar_month</span>
          {currentDate}
        </div>
        <div className="dashboard-topbar-profile">
          <div className="dashboard-topbar-avatar">{initials}</div>
          <div>
            <div className="dashboard-topbar-name">{user?.name || "Student"}</div>
            <div className="dashboard-topbar-metric">Avg: {stats?.avgScore || 0}%</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
