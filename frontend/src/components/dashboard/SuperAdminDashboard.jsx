import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { downloadExcelFromRows } from "../../utils/exportExcel.js";

const statusClass = (active) =>
  active
    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
    : "bg-rose-100 text-rose-700 border-rose-200";

const SuperAdminDashboard = () => {
  const { user, token, logout } = useAuth();
  const [schools, setSchools] = useState([]);
  const [publicStudents, setPublicStudents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [systemAnalytics, setSystemAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("schools");
  const [showAddSchool, setShowAddSchool] = useState(false);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [showEditSchool, setShowEditSchool] = useState(false);
  const [showSchoolAnalyticsModal, setShowSchoolAnalyticsModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [schoolSearch, setSchoolSearch] = useState("");
  const [adminSearch, setAdminSearch] = useState("");
  const [publicSearch, setPublicSearch] = useState("");
  const [schoolPage, setSchoolPage] = useState(1);
  const [adminPage, setAdminPage] = useState(1);
  const [publicPage, setPublicPage] = useState(1);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newSchool, setNewSchool] = useState({ name: "", email: "", address: "" });
  const [adminForm, setAdminForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [editSchoolForm, setEditSchoolForm] = useState({
    name: "",
    email: "",
    address: "",
    is_active: true,
  });

  useEffect(() => {
    fetchSchools();
  }, []);

  const stats = useMemo(() => {
    const totalSchools = schools.length;
    const activeSchools = schools.filter((s) => s.is_active).length;
    const totalStudents = schools.reduce(
      (sum, s) => sum + Number(s.student_count || 0),
      0,
    );
    const totalAdmins = schools.reduce(
      (sum, s) => sum + Number(s.admin_count || 0),
      0,
    );
    return { totalSchools, activeSchools, totalStudents, totalAdmins };
  }, [schools]);

  const filteredSchools = useMemo(() => {
    const keyword = schoolSearch.trim().toLowerCase();
    if (!keyword) return schools;

    return schools.filter((school) => {
      const adminsText = (school.admins || [])
        .map((admin) => `${admin.name || ""} ${admin.email || ""} ${admin.phone || ""}`)
        .join(" ")
        .toLowerCase();

      return (
        school.name?.toLowerCase().includes(keyword) ||
        school.email?.toLowerCase().includes(keyword) ||
        school.address?.toLowerCase().includes(keyword) ||
        adminsText.includes(keyword)
      );
    });
  }, [schools, schoolSearch]);

  const schoolAdminRows = useMemo(() => {
    return schools.flatMap((school) =>
      (school.admins || []).map((admin) => ({
        school_id: school.school_id,
        school_name: school.name,
        school_email: school.email,
        user_id: admin.user_id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        is_active: admin.is_active,
      })),
    );
  }, [schools]);

  const filteredSchoolAdminRows = useMemo(() => {
    const keyword = adminSearch.trim().toLowerCase();
    if (!keyword) return schoolAdminRows;

    return schoolAdminRows.filter((admin) => {
      const statusText = admin.is_active ? "active" : "inactive";
      return (
        admin.school_name?.toLowerCase().includes(keyword) ||
        admin.school_email?.toLowerCase().includes(keyword) ||
        admin.name?.toLowerCase().includes(keyword) ||
        admin.email?.toLowerCase().includes(keyword) ||
        admin.phone?.toLowerCase().includes(keyword) ||
        statusText.includes(keyword)
      );
    });
  }, [schoolAdminRows, adminSearch]);

  const adminsPerPage = 5;
  const totalAdminPages = Math.max(
    1,
    Math.ceil(filteredSchoolAdminRows.length / adminsPerPage),
  );
  const paginatedAdminRows = useMemo(() => {
    const startIndex = (adminPage - 1) * adminsPerPage;
    return filteredSchoolAdminRows.slice(startIndex, startIndex + adminsPerPage);
  }, [filteredSchoolAdminRows, adminPage]);

  const filteredPublicStudents = useMemo(() => {
    const keyword = publicSearch.trim().toLowerCase();
    if (!keyword) return publicStudents;

    return publicStudents.filter((student) => {
      const statusText = student.is_active ? "active" : "inactive";
      return (
        student.name?.toLowerCase().includes(keyword) ||
        student.email?.toLowerCase().includes(keyword) ||
        student.phone?.toLowerCase().includes(keyword) ||
        statusText.includes(keyword)
      );
    });
  }, [publicStudents, publicSearch]);

  const publicPerPage = 5;
  const totalPublicPages = Math.max(
    1,
    Math.ceil(filteredPublicStudents.length / publicPerPage),
  );
  const paginatedPublicStudents = useMemo(() => {
    const startIndex = (publicPage - 1) * publicPerPage;
    return filteredPublicStudents.slice(startIndex, startIndex + publicPerPage);
  }, [filteredPublicStudents, publicPage]);

  const schoolsPerPage = 5;
  const totalSchoolPages = Math.max(
    1,
    Math.ceil(filteredSchools.length / schoolsPerPage),
  );
  const paginatedSchools = useMemo(() => {
    const startIndex = (schoolPage - 1) * schoolsPerPage;
    return filteredSchools.slice(startIndex, startIndex + schoolsPerPage);
  }, [filteredSchools, schoolPage]);

  useEffect(() => {
    setSchoolPage(1);
  }, [schoolSearch]);

  useEffect(() => {
    setAdminPage(1);
  }, [adminSearch]);

  useEffect(() => {
    setPublicPage(1);
  }, [publicSearch]);

  useEffect(() => {
    if (schoolPage > totalSchoolPages) {
      setSchoolPage(totalSchoolPages);
    }
  }, [schoolPage, totalSchoolPages]);

  useEffect(() => {
    if (adminPage > totalAdminPages) {
      setAdminPage(totalAdminPages);
    }
  }, [adminPage, totalAdminPages]);

  useEffect(() => {
    if (publicPage > totalPublicPages) {
      setPublicPage(totalPublicPages);
    }
  }, [publicPage, totalPublicPages]);

  const fetchSchools = async () => {
    try {
      setError("");
      const response = await fetch("http://localhost:5000/api/schools", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to load schools");
      }
      setSchools(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPublicStudents = async () => {
    try {
      setError("");
      const response = await fetch(
        "http://localhost:5000/api/schools/public-students",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to load public students");
      }
      setPublicStudents(data);
    } catch (e) {
      setError(e.message);
    }
  };

  const fetchSystemAnalytics = async () => {
    try {
      setError("");
      const response = await fetch(
        "http://localhost:5000/api/schools/analytics/overview",
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to load system analytics");
      }
      setSystemAnalytics(data);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleAddSchool = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const response = await fetch("http://localhost:5000/api/schools", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newSchool),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to add school");
      }
      setSuccess(`School created: ${data.name}`);
      setShowAddSchool(false);
      setNewSchool({ name: "", email: "", address: "" });
      fetchSchools();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDeleteSchool = async (schoolId) => {
    if (!confirm("Delete school access? This will deactivate the school and its users.")) return;
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`http://localhost:5000/api/schools/${schoolId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete school");
      }
      setSuccess(data.message || "School deleted");
      fetchSchools();
      if (analytics?.school?.school_id === schoolId) {
        setAnalytics(null);
      }
    } catch (e) {
      setError(e.message);
    }
  };

  const openEditSchool = (school) => {
    setSelectedSchool(school);
    setEditSchoolForm({
      name: school.name || "",
      email: school.email || "",
      address: school.address || "",
      is_active: Boolean(school.is_active),
    });
    setShowEditSchool(true);
  };

  const handleUpdateSchool = async (e) => {
    e.preventDefault();
    if (!selectedSchool) return;

    setError("");
    setSuccess("");
    try {
      const response = await fetch(
        `http://localhost:5000/api/schools/${selectedSchool.school_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(editSchoolForm),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update school");
      }
      setSuccess(`School updated: ${data.name}`);
      setShowEditSchool(false);
      fetchSchools();
      if (analytics?.school?.school_id === selectedSchool.school_id) {
        fetchSchoolAnalytics(selectedSchool.school_id);
      }
    } catch (e) {
      setError(e.message);
    }
  };

  const fetchSchoolAnalytics = async (schoolId, options = {}) => {
    const { openModal = false } = options;
    setError("");
    try {
      await fetchSystemAnalytics();
      const response = await fetch(
        `http://localhost:5000/api/schools/${schoolId}/analytics`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to load analytics");
      }
      setAnalytics(data);
      if (openModal) {
        setShowSchoolAnalyticsModal(true);
      }
    } catch (e) {
      setError(e.message);
    }
  };

  const handleToggleSchoolAdminStatus = async (
    schoolId,
    adminId,
    currentStatus,
  ) => {
    if (!schoolId || !adminId) {
      setError("Missing school admin identifiers. Refresh and try again.");
      return;
    }
    setError("");
    setSuccess("");
    try {
      const endpoint = currentStatus ? "deactivate" : "activate";
      const response = await fetch(
        `http://localhost:5000/api/schools/${schoolId}/admins/${adminId}/${endpoint}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update school admin status");
      }
      setSuccess(data.message || "School admin status updated");
      fetchSchools();
      if (analytics?.school?.school_id === schoolId) {
        fetchSchoolAnalytics(schoolId);
      }
    } catch (e) {
      setError(e.message);
    }
  };

  const handleResetSchoolAdminPassword = async (schoolId, adminId) => {
    if (!schoolId || !adminId) {
      setError("Missing school admin identifiers. Refresh and try again.");
      return;
    }

    const input = window.prompt(
      "Enter a new password (min 8 chars), or leave blank for an auto-generated temporary password:",
      "",
    );
    if (input === null) return;

    const payload = input.trim() ? { new_password: input.trim() } : {};

    setError("");
    setSuccess("");
    try {
      const response = await fetch(
        `http://localhost:5000/api/schools/${schoolId}/admins/${adminId}/reset-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to reset school admin password");
      }

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

  const openCreateAdmin = (school) => {
    setSelectedSchool(school);
    setAdminForm({ name: "", email: "", phone: "", password: "" });
    setShowCreateAdmin(true);
  };

  const handleCreateSchoolAdmin = async (e) => {
    e.preventDefault();
    if (!selectedSchool) return;
    setError("");
    setSuccess("");
    try {
      const response = await fetch(
        `http://localhost:5000/api/schools/${selectedSchool.school_id}/admins`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(adminForm),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create school admin");
      }
      setSuccess(`School admin created: ${data.email}`);
      setShowCreateAdmin(false);
      fetchSchools();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleSchoolActionSelect = async (school, action) => {
    if (!action) return;

    if (action === "analytics") {
      await fetchSchoolAnalytics(school.school_id, { openModal: true });
      return;
    }

    if (action === "edit") {
      openEditSchool(school);
      return;
    }

    if (action === "create_admin") {
      if (school.is_active) {
        openCreateAdmin(school);
      }
      return;
    }

    if (action === "delete") {
      await handleDeleteSchool(school.school_id);
    }
  };

  const handleExportSchools = () => {
    if (filteredSchools.length === 0) {
      setError("No school data available to export.");
      return;
    }

    setError("");

    const exportRows = filteredSchools.map((school, index) => ({
      sn: index + 1,
      school: school.name || "-",
      email: school.email || "-",
      students: Number(school.student_count || 0),
      admins: Number(school.admin_count || 0),
      status: school.is_active ? "Active" : "Inactive",
    }));

    downloadExcelFromRows({
      fileName: `schools_${new Date().toISOString().slice(0, 10)}`,
      sheetName: "Schools",
      columns: [
        { header: "#", key: "sn" },
        { header: "School", key: "school" },
        { header: "Email", key: "email" },
        { header: "Students", key: "students" },
        { header: "Admins", key: "admins" },
        { header: "Status", key: "status" },
      ],
      rows: exportRows,
    });
  };

  const handleExportSchoolAdmins = () => {
    if (filteredSchoolAdminRows.length === 0) {
      setError("No school admin data available to export.");
      return;
    }

    setError("");

    const exportRows = filteredSchoolAdminRows.map((admin, index) => ({
      sn: index + 1,
      school: admin.school_name || "-",
      school_email: admin.school_email || "-",
      admin_name: admin.name || "-",
      admin_email: admin.email || "-",
      phone: admin.phone || "-",
      status: admin.is_active ? "Active" : "Inactive",
    }));

    downloadExcelFromRows({
      fileName: `school_admins_${new Date().toISOString().slice(0, 10)}`,
      sheetName: "School Admins",
      columns: [
        { header: "#", key: "sn" },
        { header: "School", key: "school" },
        { header: "School Email", key: "school_email" },
        { header: "Admin Name", key: "admin_name" },
        { header: "Admin Email", key: "admin_email" },
        { header: "Phone", key: "phone" },
        { header: "Status", key: "status" },
      ],
      rows: exportRows,
    });
  };

  const handleExportPublicStudents = () => {
    if (filteredPublicStudents.length === 0) {
      setError("No public student data available to export.");
      return;
    }

    setError("");

    const exportRows = filteredPublicStudents.map((student, index) => ({
      sn: index + 1,
      name: student.name || "-",
      email: student.email || "-",
      phone: student.phone || "-",
      status: student.is_active ? "Active" : "Inactive",
    }));

    downloadExcelFromRows({
      fileName: `public_students_${new Date().toISOString().slice(0, 10)}`,
      sheetName: "Public Students",
      columns: [
        { header: "#", key: "sn" },
        { header: "Name", key: "name" },
        { header: "Email", key: "email" },
        { header: "Phone", key: "phone" },
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
      .toUpperCase() || "SA";

  return (
    <div className="dashboard-container">
      <aside className="dashboard-sidebar">
        <div>
          <div className="dashboard-sidebar-brand">SmartStudy</div>
          <p className="dashboard-sidebar-caption">Super Admin</p>
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
            onClick={() => setActiveTab("schools")}
            className={`dashboard-sidebar-link ${activeTab === "schools" ? "active" : ""}`}
          >
            <span className="material-symbols-outlined text-[18px] mr-2 align-middle">apartment</span>
            Schools
          </button>
          <button
            onClick={() => setActiveTab("schoolAdmins")}
            className={`dashboard-sidebar-link ${activeTab === "schoolAdmins" ? "active" : ""}`}
          >
            <span className="material-symbols-outlined text-[18px] mr-2 align-middle">admin_panel_settings</span>
            School Admin Info
          </button>
          <button
            onClick={() => {
              setActiveTab("publicStudents");
              setPublicPage(1);
              fetchPublicStudents();
            }}
            className={`dashboard-sidebar-link ${activeTab === "publicStudents" ? "active" : ""}`}
          >
            <span className="material-symbols-outlined text-[18px] mr-2 align-middle">group</span>
            Public Students
          </button>
          <button
            onClick={() => {
              setActiveTab("analytics");
              fetchSystemAnalytics();
            }}
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
            <h1 className="dashboard-topbar-title">Super Admin Dashboard</h1>
            <p className="dashboard-topbar-subtitle">
              Manage schools, access, and system health
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
                <div className="dashboard-topbar-name">{user?.name || "Super Admin"}</div>
                <div className="dashboard-topbar-metric">Schools: {stats.totalSchools}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="dashboard-main space-y-4">
          {error && <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">{error}</div>}
          {success && <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">{success}</div>}

          {activeTab === "profile" && (
            <div className="bg-white rounded-xl shadow p-5">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Profile</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-slate-500">Name</p>
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
                  <p className="text-slate-500">Role</p>
                  <p className="font-semibold text-slate-900">{user?.role || "-"}</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-slate-500">Session</p>
                  <p className="inline-flex items-center gap-2 font-semibold text-emerald-700">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                    Active
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4">
                <p className="text-sm font-medium text-indigo-700 mb-2">Account Status</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 rounded-full border border-emerald-200 bg-emerald-100 text-emerald-700">
                    Super Admin
                  </span>
                  <span className="px-2 py-1 rounded-full border border-indigo-200 bg-indigo-100 text-indigo-700">
                    Schools Managed: {stats.totalSchools}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "schools" && (
            <div className="bg-white rounded-xl shadow p-5">
              <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-900">School Management</h3>
                <div className="flex flex-wrap gap-2">
                  <input
                    className="border rounded-md px-3 py-2 text-sm min-w-[220px]"
                    placeholder="Search school, email, admin..."
                    value={schoolSearch}
                    onChange={(e) => setSchoolSearch(e.target.value)}
                  />
                  <button
                    onClick={() => setShowAddSchool(true)}
                    className="px-4 py-2 rounded-md text-sm bg-indigo-600 text-white hover:bg-indigo-700 inline-flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[18px]">add_business</span>
                    Add School
                  </button>
                  <button
                    onClick={handleExportSchools}
                    className="px-4 py-2 rounded-md text-sm bg-emerald-600 text-white hover:bg-emerald-700 inline-flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    Download Excel
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <table className="min-w-[900px] w-full text-sm border-collapse">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold border-b-2 border-slate-300">#</th>
                      <th className="px-4 py-3 text-left font-semibold border-b-2 border-slate-300">School</th>
                      <th className="px-4 py-3 text-left font-semibold border-b-2 border-slate-300">Email</th>
                      <th className="px-4 py-3 text-left font-semibold border-b-2 border-slate-300">Students</th>
                      <th className="px-4 py-3 text-left font-semibold border-b-2 border-slate-300">Admins</th>
                      <th className="px-4 py-3 text-left font-semibold border-b-2 border-slate-300">Status</th>
                      <th className="px-4 py-3 text-left font-semibold w-[230px] border-b-2 border-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedSchools.map((school, idx) => (
                      <tr
                        key={school.school_id}
                        className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}
                      >
                        <td className="px-4 py-3 align-top text-slate-500 border-b-2 border-slate-300">
                          {(schoolPage - 1) * schoolsPerPage + idx + 1}
                        </td>
                        <td className="px-4 py-3 align-top font-semibold text-slate-900 border-b-2 border-slate-300">
                          {school.name}
                        </td>
                        <td className="px-4 py-3 align-top text-slate-600 border-b-2 border-slate-300">
                          {school.email}
                        </td>
                        <td className="px-4 py-3 align-top text-slate-900 border-b-2 border-slate-300">
                          {Number(school.student_count || 0)}
                        </td>
                        <td className="px-4 py-3 align-top text-slate-900 border-b-2 border-slate-300">
                          {Number(school.admin_count || 0)}
                        </td>
                        <td className="px-4 py-3 align-top border-b-2 border-slate-300">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs border ${statusClass(school.is_active)}`}
                          >
                            {school.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top border-b-2 border-slate-300">
                          <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-2">
                            <button
                              onClick={() =>
                                fetchSchoolAnalytics(school.school_id, {
                                  openModal: true,
                                })
                              }
                              className="w-full px-3 py-2 rounded-md text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 inline-flex items-center justify-center gap-1 font-medium"
                            >
                              <span className="material-symbols-outlined text-[18px]">monitoring</span>
                              Analytics
                            </button>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-slate-500 pointer-events-none">
                                arrow_drop_down
                              </span>
                              <select
                                defaultValue=""
                                onChange={(e) => {
                                  const value = e.target.value;
                                  e.target.value = "";
                                  handleSchoolActionSelect(school, value);
                                }}
                                className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-300 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                              >
                                <option value="" disabled>
                                  Select action
                                </option>
                                <option value="analytics">View Analytics</option>
                                <option value="edit">Edit School</option>
                                {school.is_active && (
                                  <option value="create_admin">Create School Admin</option>
                                )}
                                <option value="delete">Delete School</option>
                              </select>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredSchools.length === 0 && (
                  <p className="text-sm text-slate-500 px-4 py-4">
                    No schools match your search.
                  </p>
                )}
              </div>
              {filteredSchools.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <p className="text-slate-600">
                    Showing {(schoolPage - 1) * schoolsPerPage + 1}-
                    {Math.min(schoolPage * schoolsPerPage, filteredSchools.length)} of{" "}
                    {filteredSchools.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSchoolPage((prev) => Math.max(1, prev - 1))}
                      disabled={schoolPage === 1}
                      className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Prev
                    </button>
                    <span className="text-slate-700">
                      Page {schoolPage} of {totalSchoolPages}
                    </span>
                    <button
                      onClick={() =>
                        setSchoolPage((prev) => Math.min(totalSchoolPages, prev + 1))
                      }
                      disabled={schoolPage === totalSchoolPages}
                      className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "schoolAdmins" && (
            <div className="bg-white rounded-xl shadow p-5">
              <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-900">School Admin Info</h3>
                <div className="flex items-center gap-3">
                  <p className="text-sm text-slate-500">
                    Total Admins: {filteredSchoolAdminRows.length}
                  </p>
                  <button
                    onClick={handleExportSchoolAdmins}
                    className="px-4 py-2 rounded-md text-sm bg-emerald-600 text-white hover:bg-emerald-700 inline-flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    Download Excel
                  </button>
                </div>
              </div>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search school, admin, email, phone, status..."
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  className="w-full md:w-96 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <table className="min-w-[1000px] w-full text-sm border-collapse">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold border-b-2 border-slate-300">#</th>
                      <th className="px-4 py-3 text-left font-semibold border-b-2 border-slate-300">School</th>
                      <th className="px-4 py-3 text-left font-semibold border-b-2 border-slate-300">Admin Name</th>
                      <th className="px-4 py-3 text-left font-semibold border-b-2 border-slate-300">Email</th>
                      <th className="px-4 py-3 text-left font-semibold border-b-2 border-slate-300">Phone</th>
                      <th className="px-4 py-3 text-left font-semibold border-b-2 border-slate-300">Status</th>
                      <th className="px-4 py-3 text-left font-semibold border-b-2 border-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedAdminRows.map((admin, idx) => (
                      <tr
                        key={`${admin.school_id}-${admin.user_id}`}
                        className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}
                      >
                        <td className="px-4 py-3 border-b-2 border-slate-300 text-slate-500">
                          {(adminPage - 1) * adminsPerPage + idx + 1}
                        </td>
                        <td className="px-4 py-3 border-b-2 border-slate-300">
                          <p className="font-semibold text-slate-900">{admin.school_name}</p>
                        </td>
                        <td className="px-4 py-3 border-b-2 border-slate-300 font-medium text-slate-900">{admin.name}</td>
                        <td className="px-4 py-3 border-b-2 border-slate-300 text-slate-600">{admin.email}</td>
                        <td className="px-4 py-3 border-b-2 border-slate-300 text-slate-600">{admin.phone || "-"}</td>
                        <td className="px-4 py-3 border-b-2 border-slate-300">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs border ${
                              admin.is_active
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                : "bg-rose-100 text-rose-700 border-rose-200"
                            }`}
                          >
                            {admin.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3 border-b-2 border-slate-300">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() =>
                                handleToggleSchoolAdminStatus(
                                  admin.school_id,
                                  admin.user_id,
                                  admin.is_active,
                                )
                              }
                              className={`px-2 py-1 rounded-md border text-xs font-medium ${
                                admin.is_active
                                  ? "bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200"
                                  : "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200"
                              }`}
                            >
                              {admin.is_active ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              onClick={() =>
                                handleResetSchoolAdminPassword(admin.school_id, admin.user_id)
                              }
                              className="px-2 py-1 rounded-md border text-xs font-medium bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200"
                            >
                              Reset Password
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredSchoolAdminRows.length === 0 && (
                  <p className="text-sm text-slate-500 px-4 py-4">
                    No school admins match your search.
                  </p>
                )}
              </div>
              {filteredSchoolAdminRows.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <p className="text-slate-600">
                    Showing {(adminPage - 1) * adminsPerPage + 1}-
                    {Math.min(adminPage * adminsPerPage, filteredSchoolAdminRows.length)} of{" "}
                    {filteredSchoolAdminRows.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAdminPage((prev) => Math.max(1, prev - 1))}
                      disabled={adminPage === 1}
                      className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Prev
                    </button>
                    <span className="text-slate-700">
                      Page {adminPage} of {totalAdminPages}
                    </span>
                    <button
                      onClick={() => setAdminPage((prev) => Math.min(totalAdminPages, prev + 1))}
                      disabled={adminPage === totalAdminPages}
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
            <div className="bg-white rounded-xl shadow p-5">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">School Analytics</h3>
              {!systemAnalytics && (
                <p className="text-sm text-slate-500 mb-4">
                  Loading all schools performance...
                </p>
              )}
              {systemAnalytics && (
                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="text-sm text-slate-500">Total Schools</p>
                      <p className="text-xl font-bold text-slate-900">
                        {systemAnalytics.total_schools}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="text-sm text-slate-500">Active Schools</p>
                      <p className="text-xl font-bold text-slate-900">
                        {systemAnalytics.active_schools}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="text-sm text-slate-500">School Students</p>
                      <p className="text-xl font-bold text-slate-900">
                        {Number(systemAnalytics.school_students || 0)}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="text-sm text-slate-500">Public Students</p>
                      <p className="text-xl font-bold text-slate-900">
                        {Number(systemAnalytics.public_students || 0)}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="text-sm text-slate-500">Subjects</p>
                      <p className="text-xl font-bold text-slate-900">
                        {systemAnalytics.total_subjects}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="text-sm text-slate-500">Overall Average</p>
                      <p className="text-xl font-bold text-slate-900">
                        {Number(systemAnalytics.overall_average_performance || 0).toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-4">
                    <h4 className="font-semibold text-slate-900 mb-3">
                      All Schools Performance
                    </h4>
                    <div className="space-y-2">
                      {systemAnalytics.schools?.length > 0 ? (
                        systemAnalytics.schools.map((school, idx) => (
                          <div
                            key={school.school_id}
                            className={`rounded-md border px-3 py-2 text-sm ${
                              idx % 2 === 0
                                ? "bg-white border-slate-200"
                                : "bg-slate-50 border-slate-100"
                            }`}
                          >
                            <div className="flex flex-wrap justify-between gap-2">
                              <div>
                                <p className="font-medium text-slate-900">{school.name}</p>
                                <p className="text-slate-500">{school.email}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-slate-900">
                                  {Number(school.average_performance || 0).toFixed(2)}%
                                </p>
                                <span
                                  className={`inline-block mt-1 px-2 py-1 rounded-full text-xs border ${
                                    school.is_active
                                      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                      : "bg-rose-100 text-rose-700 border-rose-200"
                                  }`}
                                >
                                  {school.is_active ? "Active" : "Inactive"}
                                </span>
                              </div>
                            </div>
                            <div className="w-full h-2 mt-2 rounded bg-slate-100">
                              <div
                                className="h-2 rounded bg-cyan-500"
                                style={{
                                  width: `${Math.max(
                                    0,
                                    Math.min(100, Number(school.average_performance || 0)),
                                  )}%`,
                                }}
                              ></div>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                              <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                Students: {school.student_count}
                              </span>
                              <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                Subjects: {school.subject_count}
                              </span>
                              <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                Admins: {school.admin_count}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">
                          No school performance data available.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {!analytics && (
                <p className="text-sm text-slate-500">
                  Select a school from the Schools tab to view detailed single-school analytics.
                </p>
              )}
              {analytics && (
                <div className="space-y-4">
                  {(() => {
                    const metricItems = [
                      {
                        key: "students",
                        label: "Students",
                        value: Number(analytics.total_students || 0),
                        color: "bg-cyan-500",
                      },
                      {
                        key: "subjects",
                        label: "Subjects",
                        value: Number(analytics.total_subjects || 0),
                        color: "bg-indigo-500",
                      },
                      {
                        key: "avg",
                        label: "Avg Score",
                        value: Number(analytics.average_performance || 0),
                        color: "bg-emerald-500",
                      },
                      {
                        key: "admins",
                        label: "Admins",
                        value: Number(analytics.school_admins?.length || 0),
                        color: "bg-amber-500",
                      },
                    ];
                    const maxMetric = Math.max(...metricItems.map((m) => m.value), 1);
                    const studentToAdminPercent = (() => {
                      const students = Number(analytics.total_students || 0);
                      const admins = Number(analytics.school_admins?.length || 0);
                      const total = students + admins;
                      if (total <= 0) return { students: 0, admins: 0 };
                      return {
                        students: Math.round((students / total) * 100),
                        admins: Math.round((admins / total) * 100),
                      };
                    })();

                    return (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="rounded-lg border border-slate-200 p-4">
                          <h4 className="font-semibold text-slate-900 mb-3">Key Metrics Chart</h4>
                          <div className="h-52 flex items-end gap-3">
                            {metricItems.map((item) => (
                              <div key={item.key} className="flex-1 flex flex-col items-center gap-2">
                                <div
                                  className={`w-full rounded-t-md ${item.color}`}
                                  style={{
                                    height: `${Math.max(10, Math.round((item.value / maxMetric) * 100))}%`,
                                  }}
                                  title={`${item.label}: ${item.value}`}
                                ></div>
                                <p className="text-[11px] text-slate-500 text-center leading-tight">
                                  {item.label}
                                </p>
                                <p className="text-xs font-semibold text-slate-900">{item.value}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-lg border border-slate-200 p-4">
                          <h4 className="font-semibold text-slate-900 mb-3">Students vs Admins</h4>
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-600">Students</span>
                                <span className="font-semibold text-slate-900">
                                  {studentToAdminPercent.students}%
                                </span>
                              </div>
                              <div className="w-full h-3 rounded bg-slate-100 overflow-hidden">
                                <div
                                  className="h-3 bg-cyan-500"
                                  style={{ width: `${studentToAdminPercent.students}%` }}
                                ></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-600">School Admins</span>
                                <span className="font-semibold text-slate-900">
                                  {studentToAdminPercent.admins}%
                                </span>
                              </div>
                              <div className="w-full h-3 rounded bg-slate-100 overflow-hidden">
                                <div
                                  className="h-3 bg-amber-500"
                                  style={{ width: `${studentToAdminPercent.admins}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="text-slate-500 text-sm">School</p>
                      <p className="text-slate-900 font-semibold">{analytics.school?.name}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="text-slate-500 text-sm">Total Students</p>
                      <p className="text-slate-900 font-semibold">{analytics.total_students}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="text-slate-500 text-sm">Total Subjects</p>
                      <p className="text-slate-900 font-semibold">{analytics.total_subjects}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="text-slate-500 text-sm">Average Performance</p>
                      <p className="text-slate-900 font-semibold">{analytics.average_performance}%</p>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="text-slate-500 text-sm">School Admins</p>
                      <p className="text-slate-900 font-semibold">
                        {analytics.school_admins?.length || 0}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-4">
                    <h4 className="font-semibold text-slate-900 mb-3">School Admin Details</h4>
                    <div className="space-y-2">
                      {analytics.school_admins?.length > 0 ? (
                        analytics.school_admins.map((admin, idx) => (
                          <div
                            key={admin.user_id}
                            className={`rounded-md border px-3 py-2 text-sm flex justify-between gap-2 ${
                              idx % 2 === 0
                                ? "bg-white border-slate-200"
                                : "bg-slate-50 border-slate-100"
                            }`}
                          >
                            <div>
                              <p className="font-medium text-slate-900">{admin.name}</p>
                              <p className="text-slate-500">{admin.email}</p>
                              {admin.phone && <p className="text-slate-500">{admin.phone}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`h-fit px-2 py-1 rounded-full text-xs border ${
                                  admin.is_active
                                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                    : "bg-rose-100 text-rose-700 border-rose-200"
                                }`}
                              >
                                {admin.is_active ? "Active" : "Inactive"}
                              </span>
                              <button
                                onClick={() =>
                                  handleToggleSchoolAdminStatus(
                                    admin.school_id || analytics.school?.school_id,
                                    admin.user_id,
                                    admin.is_active,
                                  )
                                }
                                className={`px-2 py-1 rounded-md text-xs border ${
                                  admin.is_active
                                    ? "bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200"
                                    : "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200"
                                }`}
                              >
                                {admin.is_active ? "Deactivate" : "Activate"}
                              </button>
                              <button
                                onClick={() =>
                                  handleResetSchoolAdminPassword(
                                    admin.school_id || analytics.school?.school_id,
                                    admin.user_id,
                                  )
                                }
                                className="px-2 py-1 rounded-md text-xs border bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200"
                              >
                                Reset Password
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">No school admins for this school.</p>
                      )}
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {activeTab === "publicStudents" && (
            <div className="bg-white rounded-xl shadow p-5">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Public Students</h3>
              <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
                <input
                  type="text"
                  placeholder="Search name, email, phone, status..."
                  value={publicSearch}
                  onChange={(e) => setPublicSearch(e.target.value)}
                  className="w-full sm:w-80 md:w-96 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
                <button
                  onClick={handleExportPublicStudents}
                  className="px-4 py-2 rounded-md text-sm bg-emerald-600 text-white hover:bg-emerald-700 inline-flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  Download Excel
                </button>
              </div>
              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <table className="min-w-[800px] w-full text-sm border-collapse">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold border-b-2 border-slate-300">#</th>
                      <th className="px-4 py-3 text-left font-semibold border-b-2 border-slate-300">Name</th>
                      <th className="px-4 py-3 text-left font-semibold border-b-2 border-slate-300">Email</th>
                      <th className="px-4 py-3 text-left font-semibold border-b-2 border-slate-300">Phone</th>
                      <th className="px-4 py-3 text-left font-semibold border-b-2 border-slate-300">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedPublicStudents.map((student, idx) => (
                      <tr
                        key={student.user_id}
                        className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}
                      >
                        <td className="px-4 py-3 border-b-2 border-slate-300 text-slate-500">
                          {(publicPage - 1) * publicPerPage + idx + 1}
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
                        <td className="px-4 py-3 border-b-2 border-slate-300">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs border ${
                              student.is_active
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                : "bg-rose-100 text-rose-700 border-rose-200"
                            }`}
                          >
                            {student.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredPublicStudents.length === 0 && (
                  <p className="text-sm text-slate-500 px-4 py-4">
                    No public students match your search.
                  </p>
                )}
              </div>
              {filteredPublicStudents.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <p className="text-slate-600">
                    Showing {(publicPage - 1) * publicPerPage + 1}-
                    {Math.min(publicPage * publicPerPage, filteredPublicStudents.length)} of{" "}
                    {filteredPublicStudents.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPublicPage((prev) => Math.max(1, prev - 1))}
                      disabled={publicPage === 1}
                      className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Prev
                    </button>
                    <span className="text-slate-700">
                      Page {publicPage} of {totalPublicPages}
                    </span>
                    <button
                      onClick={() => setPublicPage((prev) => Math.min(totalPublicPages, prev + 1))}
                      disabled={publicPage === totalPublicPages}
                      className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {showCreateAdmin && selectedSchool && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Create School Admin</h3>
            <p className="text-sm text-slate-500 mb-4">School: {selectedSchool.name}</p>
            <form onSubmit={handleCreateSchoolAdmin} className="space-y-3">
              <input
                required
                className="w-full border rounded-md px-3 py-2"
                placeholder="Full name"
                value={adminForm.name}
                onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
              />
              <input
                required
                type="email"
                className="w-full border rounded-md px-3 py-2"
                placeholder="Email"
                value={adminForm.email}
                onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
              />
              <input
                type="tel"
                className="w-full border rounded-md px-3 py-2"
                placeholder="Phone (optional)"
                value={adminForm.phone}
                onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })}
              />
              <input
                required
                type="password"
                minLength={8}
                className="w-full border rounded-md px-3 py-2"
                placeholder="Temporary password (min 8 chars)"
                value={adminForm.password}
                onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateAdmin(false)}
                  className="px-4 py-2 rounded-md bg-slate-100 text-slate-700"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">
                  Create Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSchoolAnalyticsModal && analytics && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">
                    {analytics.school?.name || "School"} Analytics
                  </h3>
                  <p className="text-sm text-slate-500">{analytics.school?.email}</p>
                </div>
                <button
                  onClick={() => setShowSchoolAnalyticsModal(false)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  X
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-sm text-slate-500">Total Students</p>
                  <p className="text-xl font-bold text-slate-900">
                    {analytics.total_students}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-sm text-slate-500">Total Subjects</p>
                  <p className="text-xl font-bold text-slate-900">
                    {analytics.total_subjects}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-sm text-slate-500">Average Performance</p>
                  <p className="text-xl font-bold text-slate-900">
                    {analytics.average_performance}%
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-sm text-slate-500">School Admins</p>
                  <p className="text-xl font-bold text-slate-900">
                    {analytics.school_admins?.length || 0}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 p-4">
                <h4 className="font-semibold text-slate-900 mb-3">School Admin Details</h4>
                <div className="space-y-2">
                  {analytics.school_admins?.length > 0 ? (
                    analytics.school_admins.map((admin, idx) => (
                      <div
                        key={admin.user_id}
                        className={`rounded-md border px-3 py-2 text-sm flex justify-between gap-2 ${
                          idx % 2 === 0
                            ? "bg-white border-slate-200"
                            : "bg-slate-50 border-slate-100"
                        }`}
                      >
                        <div>
                          <p className="font-medium text-slate-900">{admin.name}</p>
                          <p className="text-slate-500">{admin.email}</p>
                          {admin.phone && <p className="text-slate-500">{admin.phone}</p>}
                        </div>
                        <span
                          className={`h-fit px-2 py-1 rounded-full text-xs border ${
                            admin.is_active
                              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                              : "bg-rose-100 text-rose-700 border-rose-200"
                          }`}
                        >
                          {admin.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No school admins for this school.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddSchool && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Add School</h3>
            <form onSubmit={handleAddSchool} className="space-y-3">
              <input
                required
                className="w-full border rounded-md px-3 py-2"
                placeholder="School name"
                value={newSchool.name}
                onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })}
              />
              <input
                required
                type="email"
                className="w-full border rounded-md px-3 py-2"
                placeholder="School email"
                value={newSchool.email}
                onChange={(e) => setNewSchool({ ...newSchool, email: e.target.value })}
              />
              <input
                className="w-full border rounded-md px-3 py-2"
                placeholder="Address (optional)"
                value={newSchool.address}
                onChange={(e) => setNewSchool({ ...newSchool, address: e.target.value })}
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSchool(false)}
                  className="px-4 py-2 rounded-md bg-slate-100 text-slate-700"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">
                  Save School
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditSchool && selectedSchool && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Edit School</h3>
            <p className="text-sm text-slate-500 mb-4">ID: {selectedSchool.school_id}</p>
            <form onSubmit={handleUpdateSchool} className="space-y-3">
              <input
                required
                className="w-full border rounded-md px-3 py-2"
                placeholder="School name"
                value={editSchoolForm.name}
                onChange={(e) => setEditSchoolForm({ ...editSchoolForm, name: e.target.value })}
              />
              <input
                required
                type="email"
                className="w-full border rounded-md px-3 py-2"
                placeholder="Email"
                value={editSchoolForm.email}
                onChange={(e) => setEditSchoolForm({ ...editSchoolForm, email: e.target.value })}
              />
              <input
                className="w-full border rounded-md px-3 py-2"
                placeholder="Address"
                value={editSchoolForm.address}
                onChange={(e) => setEditSchoolForm({ ...editSchoolForm, address: e.target.value })}
              />
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={editSchoolForm.is_active}
                  onChange={(e) =>
                    setEditSchoolForm({
                      ...editSchoolForm,
                      is_active: e.target.checked,
                    })
                  }
                />
                School is active
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditSchool(false)}
                  className="px-4 py-2 rounded-md bg-slate-100 text-slate-700"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
