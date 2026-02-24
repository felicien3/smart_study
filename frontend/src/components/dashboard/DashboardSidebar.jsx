import React from "react";

const DashboardSidebar = ({
  onLogout,
  activeView,
  onChangeView,
  analyticsLocked = false,
}) => {
  const navItems = [
    { id: "overview", label: "Overview", icon: "dashboard" },
    { id: "subjects", label: "Subjects", icon: "menu_book" },
    { id: "study-plan", label: "Study Plan", icon: "schedule" },
    {
      id: "analytics",
      label: analyticsLocked ? "Analytics (Upgrade)" : "Analytics",
      icon: analyticsLocked ? "lock" : "analytics",
    },
    { id: "profile", label: "Profile", icon: "person" },
  ];

  return (
    <aside className="dashboard-sidebar">
      <div>
        <div className="dashboard-sidebar-brand">SmartStudy</div>
        <p className="dashboard-sidebar-caption">Adaptive Planner</p>
      </div>

      <nav className="dashboard-sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`dashboard-sidebar-link ${
              activeView === item.id ? "active" : ""
            }`}
            onClick={() => onChangeView(item.id)}
          >
            <span className="inline-flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">
                {item.icon}
              </span>
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      <button className="dashboard-sidebar-logout" onClick={onLogout}>
        <span className="inline-flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">logout</span>
          Logout
        </span>
      </button>
    </aside>
  );
};

export default DashboardSidebar;
