import React from "react";

const ProfileSection = ({ user, stats, schoolName }) => {
  const initials =
    user?.name
      ?.split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "ST";

  return (
    <section className="card">
      <h3 className="text-lg font-semibold mb-4">Profile</h3>

      <div className="flex items-center gap-4 mb-6">
        <div className="dashboard-profile-avatar">{initials}</div>
        <div>
          <p className="text-lg font-semibold text-gray-900">{user?.name || "Student"}</p>
          <p className="text-sm text-gray-600">{user?.email || "No email found"}</p>
          <p className="text-sm text-gray-600">{user?.phone || "No phone number"}</p>
          <p className="text-sm text-gray-600">
            School: {schoolName || (user?.school_id ? `School ID: ${user.school_id}` : "Public Student")}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">Average Score</p>
          <p className="text-2xl font-bold text-gray-900">{stats.avgScore}%</p>
        </div>
        <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">Study Hours (Current Week)</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalHours}h</p>
        </div>
        <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">Subjects Managed</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalSubjects}</p>
        </div>
        <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">Performance Range</p>
          <p className="text-2xl font-bold text-gray-900">{stats.range}%</p>
        </div>
      </div>
    </section>
  );
};

export default ProfileSection;
