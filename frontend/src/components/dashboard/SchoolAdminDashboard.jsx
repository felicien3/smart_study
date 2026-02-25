import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { downloadExcelFromRows } from "../../utils/exportExcel.js";
import ActionToast from "../common/ActionToast.jsx";

const SchoolAdminDashboard = () => {
  const { user, token, logout } = useAuth();
  const [students, setStudents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [schoolInfo, setSchoolInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("students");
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentTarget, setCommentTarget] = useState({ studentId: null, logId: null });
  const [commentText, setCommentText] = useState("");
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [editStudentForm, setEditStudentForm] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [studentPage, setStudentPage] = useState(1);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    Promise.all([fetchSchoolInfo(), fetchStudents(), fetchAnalytics()]).finally(() =>
      setLoading(false),
    );
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        student.name?.toLowerCase().includes(search.toLowerCase()) ||
        student.email?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && student.is_active) ||
        (statusFilter === "inactive" && !student.is_active);
      return matchesSearch && matchesStatus;
    });
  }, [students, search, statusFilter]);

  const stats = useMemo(() => {
    const total = students.length;
    const active = students.filter((s) => s.is_active).length;
    const avg =
      total > 0
        ? (
            students.reduce((sum, s) => sum + Number(s.avg_performance || 0), 0) /
            total
          ).toFixed(1)
        : "0.0";
    return { total, active, inactive: total - active, avg };
  }, [students]);

  const studentsPerPage = 5;
  const totalStudentPages = Math.max(
    1,
    Math.ceil(filteredStudents.length / studentsPerPage),
  );
  const paginatedStudents = useMemo(() => {
    const startIndex = (studentPage - 1) * studentsPerPage;
    return filteredStudents.slice(startIndex, startIndex + studentsPerPage);
  }, [filteredStudents, studentPage]);

  useEffect(() => {
    setStudentPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    if (studentPage > totalStudentPages) {
      setStudentPage(totalStudentPages);
    }
  }, [studentPage, totalStudentPages]);

  const request = async (url, options = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }
    return data;
  };

  const fetchSchoolInfo = async () => {
    try {
      const data = await request("http://localhost:5000/api/admin/school");
      setSchoolInfo(data);
    } catch (e) {
      setError(e.message);
    }
  };

  const fetchStudents = async () => {
    try {
      setError("");
      const data = await request("http://localhost:5000/api/admin/students");
      setStudents(data);
    } catch (e) {
      setError(e.message);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const data = await request("http://localhost:5000/api/admin/analytics");
      setAnalytics(data);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const data = await request("http://localhost:5000/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStudent),
      });
      setSuccess(`Student created: ${data.email}`);
      setShowAddStudent(false);
      setNewStudent({ name: "", email: "", phone: "", password: "" });
      fetchStudents();
      fetchAnalytics();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleToggleStudentStatus = async (studentId, currentStatus) => {
    setError("");
    setSuccess("");
    try {
      const endpoint = currentStatus ? "deactivate" : "activate";
      const data = await request(
        `http://localhost:5000/api/admin/students/${studentId}/${endpoint}`,
        { method: "PUT" },
      );
      setSuccess(data.message || "Status updated");
      fetchStudents();
      fetchAnalytics();
    } catch (e) {
      setError(e.message);
    }
  };

  const openEditStudentModal = (student) => {
    setEditingStudentId(student.user_id);
    setEditStudentForm({
      name: student.name || "",
      email: student.email || "",
      phone: student.phone || "",
    });
    setShowEditStudentModal(true);
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    if (!editingStudentId) return;

    try {
      setError("");
      setSuccess("");
      const payload = {
        name: editStudentForm.name.trim(),
        email: editStudentForm.email.trim(),
        phone: editStudentForm.phone.trim(),
      };

      const data = await request(
        `http://localhost:5000/api/admin/students/${editingStudentId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      setSuccess(data.message || "Student updated successfully");
      setShowEditStudentModal(false);
      setEditingStudentId(null);
      await fetchStudents();
      await fetchAnalytics();

      if (selectedStudent === editingStudentId) {
        await fetchStudentDetails(editingStudentId);
      }
    } catch (e) {
      setError(e.message);
    }
  };

  const fetchStudentDetails = async (studentId) => {
    try {
      const data = await request(`http://localhost:5000/api/admin/students/${studentId}`);
      setStudentDetails(data);
      setSelectedStudent(studentId);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleResetStudentPassword = async (studentId) => {
    const input = window.prompt(
      "Enter a new password (min 8 chars), or leave blank for an auto-generated temporary password:",
      "",
    );

    if (input === null) return;

    const payload = input.trim()
      ? { new_password: input.trim() }
      : {};

    try {
      setError("");
      setSuccess("");
      const data = await request(
        `http://localhost:5000/api/admin/students/${studentId}/reset-password`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const passwordLabel = data.generated
        ? "Temporary password (generated)"
        : "New password";
      setSuccess(
        `${data.message}. ${passwordLabel}: ${data.temporary_password}`,
      );
    } catch (e) {
      setError(e.message);
    }
  };

  const openCommentModal = (studentId, logId) => {
    setCommentTarget({ studentId, logId });
    setCommentText("");
    setShowCommentModal(true);
  };

  const handleAddPerformanceComment = async (e) => {
    e.preventDefault();
    const studentId = commentTarget.studentId;
    const logId = commentTarget.logId;
    const comment = commentText.trim();
    if (!studentId || !logId || !comment) return;

    try {
      setError("");
      setSuccess("");
      await request(`http://localhost:5000/api/admin/students/${studentId}/performance-comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ log_id: logId, comment }),
      });
      setSuccess("Performance comment added successfully.");
      setShowCommentModal(false);
      await fetchStudentDetails(studentId);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleExportStudents = () => {
    if (filteredStudents.length === 0) {
      setError("No student data available to export.");
      return;
    }

    setError("");

    const exportRows = filteredStudents.map((student, index) => ({
      sn: index + 1,
      name: student.name || "-",
      email: student.email || "-",
      phone: student.phone || "-",
      subjects: student.subject_count || 0,
      average: `${student.avg_performance ? Number(student.avg_performance).toFixed(1) : 0}%`,
      status: student.is_active ? "Active" : "Inactive",
    }));

    downloadExcelFromRows({
      fileName: `students_${new Date().toISOString().slice(0, 10)}`,
      sheetName: "Students",
      columns: [
        { header: "#", key: "sn" },
        { header: "Name", key: "name" },
        { header: "Email", key: "email" },
        { header: "Phone", key: "phone" },
        { header: "Subjects", key: "subjects" },
        { header: "Average", key: "average" },
        { header: "Status", key: "status" },
      ],
      rows: exportRows,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const initials =
    user?.name
      ?.split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AD";

  return (
    <div className="dashboard-container">
      <ActionToast
        type="error"
        message={error}
        onClose={() => setError("")}
      />
      <ActionToast
        type="success"
        message={success}
        offset={error ? 1 : 0}
        onClose={() => setSuccess("")}
      />
      <aside className="dashboard-sidebar">
        <div>
          <div className="dashboard-sidebar-brand">SmartStudy</div>
          <p className="dashboard-sidebar-caption">School Admin</p>
        </div>
        <nav className="dashboard-sidebar-nav">
          <button
            onClick={() => setActiveTab("profile")}
            className={`dashboard-sidebar-link ${activeTab === "profile" ? "active" : ""}`}
          >
            <span className="material-symbols-outlined text-[18px] mr-2 align-middle">person</span>
            Profile
          </button>
          <button
            onClick={() => setActiveTab("students")}
            className={`dashboard-sidebar-link ${activeTab === "students" ? "active" : ""}`}
          >
            <span className="material-symbols-outlined text-[18px] mr-2 align-middle">groups</span>
            Students
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`dashboard-sidebar-link ${activeTab === "analytics" ? "active" : ""}`}
          >
            <span className="material-symbols-outlined text-[18px] mr-2 align-middle">bar_chart</span>
            Analytics
          </button>
        </nav>
        <button className="dashboard-sidebar-logout" onClick={logout}>
          <span className="material-symbols-outlined text-[18px] mr-2 align-middle">logout</span>
          Logout
        </button>
      </aside>

      <div className="dashboard-workspace">
        <header className="dashboard-topbar">
          <div>
            <h1 className="dashboard-topbar-title">School Admin Dashboard</h1>
            <p className="dashboard-topbar-subtitle">
              {schoolInfo?.name || "Your School"} | Manage students and performance
            </p>
          </div>
          <div className="dashboard-topbar-user">
            <div className="dashboard-topbar-date inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">calendar_today</span>
              {currentDate}
            </div>
            <div className="dashboard-topbar-profile">
              <div className="dashboard-topbar-avatar">{initials}</div>
              <div>
                <div className="dashboard-topbar-name">{user?.name || "School Admin"}</div>
                <div className="dashboard-topbar-metric">Students: {stats.total}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="dashboard-main space-y-4">
          {activeTab === "profile" && (
            <div className="bg-white rounded-xl shadow p-5">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Profile</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-slate-500">Admin</p>
                  <p className="font-semibold text-slate-900">{user?.name || "-"}</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-slate-500">Email</p>
                  <p className="font-semibold text-slate-900">{user?.email || "-"}</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-slate-500">Phone</p>
                  <p className="font-semibold text-slate-900">{user?.phone || "-"}</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-slate-500">School</p>
                  <p className="font-semibold text-slate-900">{schoolInfo?.name || "-"}</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-slate-500">Session</p>
                  <p className="inline-flex items-center gap-2 font-semibold text-emerald-700">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                    Active
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-cyan-100 bg-cyan-50 p-4">
                <p className="text-sm font-medium text-cyan-700 mb-2">Status</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 rounded-full border border-cyan-200 bg-white text-cyan-700">
                    Students: {stats.total}
                  </span>
                  <span className="px-2 py-1 rounded-full border border-emerald-200 bg-emerald-100 text-emerald-700">
                    Active: {stats.active}
                  </span>
                  <span className="px-2 py-1 rounded-full border border-slate-200 bg-white text-slate-700">
                    Avg Score: {stats.avg}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "students" && (
            <div className="bg-white rounded-xl shadow p-5">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold text-slate-900 mr-auto">Student Management</h3>
                <input
                  className="border rounded-md px-3 py-2 text-sm"
                  placeholder="Search name or email"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select
                  className="border rounded-md px-3 py-2 text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <button
                  onClick={() => setShowAddStudent(true)}
                  className="px-4 py-2 rounded-md text-sm bg-cyan-600 text-white hover:bg-cyan-700 inline-flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                  Add Student
                </button>
                <button
                  onClick={handleExportStudents}
                  className="px-4 py-2 rounded-md text-sm bg-emerald-600 text-white hover:bg-emerald-700 inline-flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  Download Excel
                </button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <table className="min-w-[1100px] w-full text-sm border-collapse">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold border-b-2 border-slate-300">#</th>
                      <th className="px-4 py-3 text-left font-semibold border-b-2 border-slate-300">Name</th>
                      <th className="px-4 py-3 text-left font-semibold border-b-2 border-slate-300">Email</th>
                      <th className="px-4 py-3 text-left font-semibold border-b-2 border-slate-300">Phone</th>
                      <th className="px-4 py-3 text-left font-semibold border-b-2 border-slate-300">Subjects</th>
                      <th className="px-4 py-3 text-left font-semibold border-b-2 border-slate-300">Avg</th>
                      <th className="px-4 py-3 text-left font-semibold border-b-2 border-slate-300">Status</th>
                      <th className="px-4 py-3 text-left font-semibold border-b-2 border-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedStudents.map((student, idx) => (
                      <tr
                        key={student.user_id}
                        className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}
                      >
                        <td className="px-4 py-3 border-b-2 border-slate-300 text-slate-500">
                          {(studentPage - 1) * studentsPerPage + idx + 1}
                        </td>
                        <td className="px-4 py-3 border-b-2 border-slate-300 font-medium text-slate-900">
                          {student.name}
                        </td>
                        <td className="px-4 py-3 border-b-2 border-slate-300 text-slate-600">
                          {student.email}
                        </td>
                        <td className="px-4 py-3 border-b-2 border-slate-300 text-slate-600">
                          {student.phone || "-"}
                        </td>
                        <td className="px-4 py-3 border-b-2 border-slate-300 text-slate-900">
                          {student.subject_count || 0}
                        </td>
                        <td className="px-4 py-3 border-b-2 border-slate-300 text-slate-900">
                          {student.avg_performance ? Number(student.avg_performance).toFixed(1) : 0}%
                        </td>
                        <td className="px-4 py-3 border-b-2 border-slate-300">
                          <span
                            className={`px-2 py-1 rounded-full text-xs border ${
                              student.is_active
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                : "bg-rose-100 text-rose-700 border-rose-200"
                            }`}
                          >
                            {student.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3 border-b-2 border-slate-300">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => fetchStudentDetails(student.user_id)}
                              className="px-3 py-1 rounded-md text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 inline-flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[18px]">badge</span>
                              View Profile
                            </button>
                            <button
                              onClick={() => openEditStudentModal(student)}
                              className="px-3 py-1 rounded-md text-sm bg-violet-100 text-violet-700 hover:bg-violet-200 inline-flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                              Edit User
                            </button>
                            <button
                              onClick={() => handleToggleStudentStatus(student.user_id, student.is_active)}
                              className={`px-3 py-1 rounded-md text-sm inline-flex items-center gap-1 ${
                                student.is_active
                                  ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                                  : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                              }`}
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                {student.is_active ? "block" : "check_circle"}
                              </span>
                              {student.is_active ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              onClick={() => handleResetStudentPassword(student.user_id)}
                              className="px-3 py-1 rounded-md text-sm bg-amber-100 text-amber-700 hover:bg-amber-200 inline-flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[18px]">password</span>
                              Reset Password
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredStudents.length === 0 && (
                  <p className="text-sm text-slate-500 px-4 py-4">No students match your filter.</p>
                )}
              </div>
              {filteredStudents.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <p className="text-slate-600">
                    Showing {(studentPage - 1) * studentsPerPage + 1}-
                    {Math.min(studentPage * studentsPerPage, filteredStudents.length)} of{" "}
                    {filteredStudents.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setStudentPage((prev) => Math.max(1, prev - 1))}
                      disabled={studentPage === 1}
                      className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Prev
                    </button>
                    <span className="text-slate-700">
                      Page {studentPage} of {totalStudentPages}
                    </span>
                    <button
                      onClick={() =>
                        setStudentPage((prev) => Math.min(totalStudentPages, prev + 1))
                      }
                      disabled={studentPage === totalStudentPages}
                      className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="bg-white rounded-xl shadow p-5 space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">Performance Analytics</h3>
              {!analytics && <p className="text-sm text-slate-500">No analytics available yet.</p>}
              {analytics && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="text-sm text-slate-500">Total Students</p>
                      <p className="text-xl font-bold text-slate-900">{analytics.total_students}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="text-sm text-slate-500">Active Students</p>
                      <p className="text-xl font-bold text-slate-900">{analytics.active_students}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="text-sm text-slate-500">Total Subjects</p>
                      <p className="text-xl font-bold text-slate-900">{analytics.total_subjects}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="text-sm text-slate-500">Average Performance</p>
                      <p className="text-xl font-bold text-slate-900">{analytics.average_performance}%</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border border-slate-200">
                      <h4 className="font-semibold text-slate-900 mb-2">Performance by Subject</h4>
                      <div className="space-y-2">
                        {analytics.performance_by_subject?.map((subject, idx) => (
                          <div
                            key={subject.name}
                            className={`text-sm rounded-md px-2 py-2 ${
                              idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                            }`}
                          >
                            <div className="flex justify-between">
                              <span className="text-slate-700">{subject.name}</span>
                              <span className="text-slate-900 font-medium">
                                {subject.avg_score ? Number(subject.avg_score).toFixed(1) : 0}%
                              </span>
                            </div>
                            <div className="w-full h-2 mt-1 rounded bg-slate-100">
                              <div
                                className="h-2 rounded bg-cyan-500"
                                style={{ width: `${Math.max(0, Math.min(100, Number(subject.avg_score || 0)))}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border border-slate-200">
                      <h4 className="font-semibold text-slate-900 mb-2">Top Students</h4>
                      <div className="space-y-2">
                        {analytics.top_students?.map((student, idx) => (
                          <div
                            key={student.name}
                            className={`flex justify-between text-sm pb-2 px-2 py-2 rounded-md ${
                              idx % 2 === 0
                                ? "bg-white border border-slate-100"
                                : "bg-slate-50"
                            }`}
                          >
                            <span className="text-slate-700">{student.name}</span>
                            <span className="text-slate-900 font-medium">
                              {student.avg_score ? Number(student.avg_score).toFixed(1) : 0}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>

      {selectedStudent && studentDetails && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{studentDetails.student?.name}</h2>
                  <p className="text-slate-500">{studentDetails.student?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedStudent(null);
                    setStudentDetails(null);
                  }}
                  className="text-slate-500 hover:text-slate-700"
                >
                  X
                </button>
              </div>

              <div className="mb-5">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Subjects</h3>
                <div className="flex flex-wrap gap-2">
                  {studentDetails.subjects?.length > 0 ? (
                    studentDetails.subjects.map((subject) => (
                      <span
                        key={subject.subject_id}
                        className="text-sm px-3 py-1 rounded-full bg-cyan-100 text-cyan-700 border border-cyan-200"
                      >
                        {subject.name}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No subjects yet.</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Recent Performance</h3>
                <div className="space-y-2">
                  {studentDetails.performance?.slice(0, 8).map((perf, idx) => (
                    <div
                      key={perf.log_id}
                      className={`border border-slate-200 p-2 rounded-md text-sm ${
                        idx % 2 === 0 ? "bg-slate-50" : "bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-slate-700">{perf.subject_name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{perf.score}%</span>
                          <button
                            onClick={() =>
                              openCommentModal(studentDetails.student?.user_id, perf.log_id)
                            }
                            className="px-2 py-1 rounded-md text-xs bg-cyan-100 text-cyan-700 hover:bg-cyan-200"
                          >
                            Add Comment
                          </button>
                        </div>
                      </div>
                      {studentDetails.performance_comments
                        ?.filter((c) => c.log_id === perf.log_id)
                        .map((comment) => (
                          <div
                            key={comment.comment_id}
                            className="mt-2 rounded-md border border-cyan-200 bg-cyan-50 px-2 py-1 text-xs text-cyan-800"
                          >
                            <span className="font-semibold">{comment.admin_name}:</span>{" "}
                            {comment.comment}
                            <p className="mt-1 text-[11px] text-cyan-700">
                              {comment.created_at
                                ? new Date(comment.created_at).toLocaleString()
                                : ""}
                            </p>
                          </div>
                        ))}
                    </div>
                  ))}
                  {(!studentDetails.performance || studentDetails.performance.length === 0) && (
                    <p className="text-sm text-slate-500">No performance records yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddStudent && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Add Student</h3>
            <form onSubmit={handleAddStudent} className="space-y-3">
              <input
                required
                className="w-full border rounded-md px-3 py-2"
                placeholder="Student name"
                value={newStudent.name}
                onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
              />
              <input
                required
                type="email"
                className="w-full border rounded-md px-3 py-2"
                placeholder="Student email"
                value={newStudent.email}
                onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
              />
              <input
                type="tel"
                className="w-full border rounded-md px-3 py-2"
                placeholder="Phone (optional)"
                value={newStudent.phone}
                onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
              />
              <input
                required
                type="password"
                minLength={8}
                className="w-full border rounded-md px-3 py-2"
                placeholder="Password (min 8 chars)"
                value={newStudent.password}
                onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudent(false)}
                  className="px-4 py-2 rounded-md bg-slate-100 text-slate-700"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 rounded-md bg-cyan-600 text-white hover:bg-cyan-700">
                  Create Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditStudentModal && editingStudentId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Edit Student</h3>
            <p className="text-sm text-slate-500 mb-4">ID: {editingStudentId}</p>
            <form onSubmit={handleUpdateStudent} className="space-y-3">
              <input
                required
                className="w-full border rounded-md px-3 py-2"
                placeholder="Student name"
                value={editStudentForm.name}
                onChange={(e) =>
                  setEditStudentForm({ ...editStudentForm, name: e.target.value })
                }
              />
              <input
                required
                type="email"
                className="w-full border rounded-md px-3 py-2"
                placeholder="Student email"
                value={editStudentForm.email}
                onChange={(e) =>
                  setEditStudentForm({ ...editStudentForm, email: e.target.value })
                }
              />
              <input
                type="tel"
                className="w-full border rounded-md px-3 py-2"
                placeholder="Phone (optional)"
                value={editStudentForm.phone}
                onChange={(e) =>
                  setEditStudentForm({ ...editStudentForm, phone: e.target.value })
                }
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditStudentModal(false);
                    setEditingStudentId(null);
                  }}
                  className="px-4 py-2 rounded-md bg-slate-100 text-slate-700"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 rounded-md bg-violet-600 text-white hover:bg-violet-700">
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCommentModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Add Performance Comment</h3>
            <p className="text-sm text-slate-500 mb-4">Log ID: {commentTarget.logId}</p>
            <form onSubmit={handleAddPerformanceComment} className="space-y-3">
              <textarea
                required
                rows={4}
                className="w-full border rounded-md px-3 py-2"
                placeholder="Write your comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCommentModal(false);
                    setCommentTarget({ studentId: null, logId: null });
                    setCommentText("");
                  }}
                  className="px-4 py-2 rounded-md bg-slate-100 text-slate-700"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 rounded-md bg-cyan-600 text-white hover:bg-cyan-700">
                  Save Comment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolAdminDashboard;
