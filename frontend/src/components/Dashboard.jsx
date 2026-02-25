import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import DashboardHeader from "./dashboard/DashboardHeader.jsx";
import DashboardSidebar from "./dashboard/DashboardSidebar.jsx";
import DashboardCards from "./dashboard/DashboardCards.jsx";
import SubjectsSection from "./dashboard/SubjectsSection.jsx";
import StudyPlanSection from "./dashboard/StudyPlanSection.jsx";
import AnalyticsSection from "./dashboard/AnalyticsSection.jsx";
import ProfileSection from "./dashboard/ProfileSection.jsx";
import SubjectModal from "./dashboard/SubjectModal.jsx";
import PerformanceModal from "./dashboard/PerformanceModal.jsx";
import SubjectDetailModal from "./dashboard/SubjectDetailModal.jsx";
import RecommendationModal from "./dashboard/RecommendationModal.jsx";
import ActionToast from "./common/ActionToast.jsx";
import { getWeekNumber } from "./dashboard/utils.js";
import {
  deleteSubject,
  fetchDashboard,
  fetchRecommendation,
  fetchStudyPlanByWeek,
  fetchSubjectPerformance,
  generateStudyPlanApi,
  logPerformance,
  saveSubject,
} from "../services/dashboardApi.js";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const isFreeStudent = user?.role === "student" && !user?.school_id;
  const FREE_PLAN_SUBJECT_LIMIT_WARNING =
    "Basic Free plan allows up to 5 subjects. Upgrade to add more.";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [subjectLimitWarning, setSubjectLimitWarning] = useState("");
  const [showSubjectLimitWarning, setShowSubjectLimitWarning] = useState(true);
  const [showProfilePlanWarning, setShowProfilePlanWarning] = useState(true);
  const [activeView, setActiveView] = useState("overview");
  const [dashboardData, setDashboardData] = useState({
    school_name: null,
    subjects: [],
    current_study_plan: [],
    current_week: getWeekNumber(),
    latest_study_plan_week: null,
    previous_study_plan_week: null,
    needs_new_plan: false,
    performance_comments: [],
  });

  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [performanceModalOpen, setPerformanceModalOpen] = useState(false);
  const [recommendationOpen, setRecommendationOpen] = useState(false);
  const [subjectDetailOpen, setSubjectDetailOpen] = useState(false);

  const [recommendation, setRecommendation] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [performanceHistory, setPerformanceHistory] = useState([]);
  const [lastStudyPlan, setLastStudyPlan] = useState([]);

  const [subjectForm, setSubjectForm] = useState({
    id: null,
    name: "",
    difficulty: 3,
    exam_date: "",
  });

  const [performanceForm, setPerformanceForm] = useState({
    subject_id: "",
    score: "",
    week_number: getWeekNumber(),
  });

  const token = localStorage.getItem("token");

  const fetchDashboardData = async () => {
    try {
      const data = await fetchDashboard(token);
      const nextCurrentWeek = data.current_week ?? getWeekNumber();
      const nextLatestWeek = data.latest_study_plan_week ?? null;
      const nextPreviousWeek = data.previous_study_plan_week ?? null;
      const nextNeedsNewPlan = Boolean(data.needs_new_plan);

      let latestPlanRows = [];
      if (nextPreviousWeek !== null) {
        latestPlanRows = await fetchStudyPlanByWeek(nextPreviousWeek, token);
      }

      setDashboardData({
        school_name: data.school_name || null,
        subjects: data.subjects || [],
        current_study_plan: data.current_study_plan || [],
        current_week: nextCurrentWeek,
        latest_study_plan_week: nextLatestWeek,
        previous_study_plan_week: nextPreviousWeek,
        needs_new_plan: nextNeedsNewPlan,
        performance_comments: data.performance_comments || [],
      });
      setLastStudyPlan(latestPlanRows);
      setError("");
    } catch {
      setError("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isFreeStudent && activeView === "analytics") {
      setActiveView("overview");
    }
  }, [isFreeStudent, activeView]);

  const handleChangeView = (nextView) => {
    if (isFreeStudent && nextView === "analytics") {
      setError(
        "Upgrade required: Analytics is available on upgraded plans. Please reach out to your school provider to upgrade.",
      );
      return;
    }
    setActiveView(nextView);
  };

  const stats = useMemo(() => {
    const subjects = dashboardData.subjects || [];
    const scores = subjects.map((s) => Number(s.latest_score) || 0);
    const totalHours = (dashboardData.current_study_plan || []).reduce(
      (sum, p) => sum + (Number(p.hours) || 0),
      0,
    );
    const avgScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;
    const max = scores.length > 0 ? Math.max(...scores) : 0;
    const min = scores.length > 0 ? Math.min(...scores) : 0;

    return {
      totalSubjects: subjects.length,
      sessions: dashboardData.current_study_plan.length,
      totalHours,
      avgScore,
      max,
      min,
      range: max - min,
    };
  }, [dashboardData]);

  const topPerformers = useMemo(() => {
    return [...dashboardData.subjects]
      .sort(
        (a, b) => (Number(b.latest_score) || 0) - (Number(a.latest_score) || 0),
      )
      .slice(0, 3);
  }, [dashboardData.subjects]);

  const resetSubjectForm = () => {
    setSubjectForm({ id: null, name: "", difficulty: 3, exam_date: "" });
  };

  const handleSubjectSubmit = async (event) => {
    event.preventDefault();
    const isEdit = Boolean(subjectForm.id);

    try {
      await saveSubject(subjectForm, token);

      setSubjectLimitWarning("");
      setSubjectModalOpen(false);
      resetSubjectForm();
      await fetchDashboardData();
      setSuccess(isEdit ? "Subject updated successfully." : "Subject added successfully.");
    } catch (err) {
      const message = err?.message || "";
      const isFreePlanLimitError =
        isFreeStudent &&
        (message.includes("up to 5 subjects") ||
          message.toLowerCase().includes("basic free plan"));

      if (isFreePlanLimitError) {
        setError("");
        setSubjectLimitWarning(FREE_PLAN_SUBJECT_LIMIT_WARNING);
        setShowSubjectLimitWarning(true);
        setSubjectModalOpen(false);
        resetSubjectForm();
        return;
      }

      setSubjectLimitWarning("");
      setError(message);
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    if (!window.confirm("Delete this subject?")) return;

    try {
      await deleteSubject(subjectId, token);
      await fetchDashboardData();
      setSuccess("Subject deleted successfully.");
    } catch (err) {
      setError(err.message);
    }
  };

  const openEditModal = (subject) => {
    setSubjectForm({
      id: subject.subject_id,
      name: subject.name,
      difficulty: subject.difficulty,
      exam_date: subject.exam_date
        ? String(subject.exam_date).slice(0, 10)
        : "",
    });
    setSubjectModalOpen(true);
  };

  const handlePerformanceSubmit = async (event) => {
    event.preventDefault();
    try {
      await logPerformance(performanceForm, token);

      setPerformanceModalOpen(false);
      setPerformanceForm({
        subject_id: "",
        score: "",
        week_number: getWeekNumber(),
      });
      await fetchDashboardData();
      setSuccess("Performance logged successfully.");
    } catch (err) {
      setError(err.message);
    }
  };

  const generateStudyPlan = async () => {
    try {
      await generateStudyPlanApi(getWeekNumber(), token);
      await fetchDashboardData();
      setSuccess("Study plan generated successfully.");
    } catch (err) {
      setError(err.message);
    }
  };

  const getRecommendation = async () => {
    try {
      const data = await fetchRecommendation(token);
      setRecommendation(data);
      setRecommendationOpen(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const viewSubjectDetail = async (subject) => {
    try {
      const data = await fetchSubjectPerformance(subject.subject_id, token);
      setSelectedSubject(subject);
      setPerformanceHistory(data);
      setSubjectDetailOpen(true);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

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
      <DashboardSidebar
        onLogout={logout}
        activeView={activeView}
        onChangeView={handleChangeView}
        analyticsLocked={isFreeStudent}
      />

      <div className="dashboard-workspace">
        <DashboardHeader user={user} activeView={activeView} stats={stats} />

        <main className="dashboard-main">
          {activeView === "overview" && (
            <section className="dashboard-anchor">
              <DashboardCards stats={stats} topPerformers={topPerformers} />
              <div className="card mt-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">
                  School Admin Comments
                </h3>
                {dashboardData.performance_comments.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No performance comments yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {dashboardData.performance_comments
                      .slice(0, 6)
                      .map((comment) => (
                        <div
                          key={comment.comment_id}
                          className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                        >
                          <p className="text-sm font-medium text-slate-900">
                            {comment.subject_name || "Subject"}{" "}
                            <span className="text-slate-500">
                              ({comment.score ?? "-"}%)
                            </span>
                          </p>
                          <p className="text-sm text-slate-700 mt-1">
                            {comment.comment}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            From {comment.admin_name || "School Admin"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {comment.created_at
                              ? new Date(comment.created_at).toLocaleString()
                              : ""}
                          </p>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {activeView === "subjects" && (
            <section className="dashboard-anchor">
              {subjectLimitWarning && (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">Warning</span>
                    <button
                      type="button"
                      className="rounded border border-amber-300 px-2 py-0.5 text-xs font-medium hover:bg-amber-100"
                      onClick={() => setShowSubjectLimitWarning((prev) => !prev)}
                    >
                      {showSubjectLimitWarning ? "Hide" : "Show"}
                    </button>
                  </div>
                  {showSubjectLimitWarning && <p className="mt-2">{subjectLimitWarning}</p>}
                </div>
              )}
              <SubjectsSection
                subjects={dashboardData.subjects}
                onViewDetails={viewSubjectDetail}
                onEdit={openEditModal}
                onDelete={handleDeleteSubject}
                onAddSubject={() => {
                  setSubjectLimitWarning("");
                  setShowSubjectLimitWarning(true);
                  resetSubjectForm();
                  setSubjectModalOpen(true);
                }}
                onLogPerformance={() => setPerformanceModalOpen(true)}
              />
            </section>
          )}

          {activeView === "study-plan" && (
            <section className="dashboard-anchor">
              <StudyPlanSection
                studyPlan={dashboardData.current_study_plan}
                subjects={dashboardData.subjects}
                onGenerateStudyPlan={generateStudyPlan}
                needsNewPlan={dashboardData.needs_new_plan}
                currentWeek={dashboardData.current_week}
                lastStudyPlan={lastStudyPlan}
                lastStudyPlanWeek={dashboardData.previous_study_plan_week}
              />
            </section>
          )}

          {activeView === "analytics" && !isFreeStudent && (
            <section className="dashboard-anchor">
              <AnalyticsSection
                stats={stats}
                topPerformers={topPerformers}
                onGetRecommendation={getRecommendation}
              />
            </section>
          )}

          {activeView === "profile" && (
            <section className="dashboard-anchor">
              <ProfileSection
                user={user}
                stats={stats}
                schoolName={dashboardData.school_name}
              />
              {isFreeStudent && (
                <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">Plan Warning</span>
                    <button
                      type="button"
                      className="rounded border border-blue-300 px-2 py-0.5 text-xs font-medium hover:bg-blue-100"
                      onClick={() => setShowProfilePlanWarning((prev) => !prev)}
                    >
                      {showProfilePlanWarning ? "Hide" : "Show"}
                    </button>
                  </div>
                  {showProfilePlanWarning && (
                    <p className="mt-2">
                      Basic Free plan: up to 5 subjects. Analytics and academic
                      recommendations are available on upgraded plans. Please
                      reach out to your school provider to upgrade.
                    </p>
                  )}
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      <SubjectModal
        open={subjectModalOpen}
        subjectForm={subjectForm}
        setSubjectForm={setSubjectForm}
        onSubmit={handleSubjectSubmit}
        onClose={() => {
          setSubjectModalOpen(false);
          resetSubjectForm();
        }}
      />

      <PerformanceModal
        open={performanceModalOpen}
        subjects={dashboardData.subjects}
        performanceForm={performanceForm}
        setPerformanceForm={setPerformanceForm}
        onSubmit={handlePerformanceSubmit}
        onClose={() => setPerformanceModalOpen(false)}
      />

      <SubjectDetailModal
        open={subjectDetailOpen}
        subject={selectedSubject}
        performanceHistory={performanceHistory}
        onClose={() => setSubjectDetailOpen(false)}
      />

      <RecommendationModal
        open={recommendationOpen}
        recommendation={recommendation}
        onClose={() => setRecommendationOpen(false)}
      />
    </div>
  );
};

export default Dashboard;
