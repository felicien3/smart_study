import React, { useEffect, useMemo, useState } from "react";

const StudyPlanSection = ({
  studyPlan,
  subjects = [],
  onGenerateStudyPlan,
  needsNewPlan = false,
  currentWeek = null,
  lastStudyPlan = [],
  lastStudyPlanWeek = null,
}) => {
  const [showLastSchedule, setShowLastSchedule] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 8;

  useEffect(() => {
    if (!lastStudyPlan.length) {
      setShowLastSchedule(false);
    }
  }, [lastStudyPlan.length]);

  const displayedPlan = showLastSchedule ? lastStudyPlan : studyPlan;

  const subjectScoreById = useMemo(() => {
    return (subjects || []).reduce((acc, subject) => {
      acc[subject.subject_id] = Number(subject.latest_score ?? 50);
      return acc;
    }, {});
  }, [subjects]);

  const scoredPlan = useMemo(() => {
    const withScores = [...(displayedPlan || [])]
      .map((row) => ({
        ...row,
        latest_score: Number(subjectScoreById[row.subject_id] ?? row.latest_score ?? 50),
      }))
      .sort((a, b) => {
        if (a.latest_score !== b.latest_score) {
          return a.latest_score - b.latest_score;
        }
        return Number(b.hours || 0) - Number(a.hours || 0);
      });

    // Keep one row per subject to avoid duplicate sessions in the same week view.
    const seen = new Set();
    return withScores.filter((row) => {
      if (seen.has(row.subject_id)) return false;
      seen.add(row.subject_id);
      return true;
    });
  }, [displayedPlan, subjectScoreById]);

  const weeklySchedule = useMemo(() => {
    if (!scoredPlan || scoredPlan.length === 0) return [];

    const today = new Date();
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);

    const mondayStart = new Date(todayStart);
    const day = mondayStart.getDay(); // 0 (Sun) .. 6 (Sat)
    const diffToMonday = day === 0 ? -6 : 1 - day;
    mondayStart.setDate(mondayStart.getDate() + diffToMonday);

    // Current plan: start today and end on Sunday.
    // Last-week view: keep full Monday..Sunday.
    const scheduleStart = showLastSchedule ? mondayStart : todayStart;
    const daysUntilSunday = (7 - todayStart.getDay()) % 7;
    const dayCount = showLastSchedule ? 7 : daysUntilSunday + 1;
    const scheduleByDay = Array.from({ length: dayCount }, (_, index) => {
      const date = new Date(scheduleStart);
      date.setDate(scheduleStart.getDate() + index);
      const isEnded = showLastSchedule ? true : date < todayStart;

      return {
        name: date.toLocaleDateString(undefined, { weekday: "long" }),
        date,
        isEnded,
        sessions: [],
      };
    });

    scoredPlan.forEach((row, index) => {
      // Round-robin assignment so every subject stays within this week.
      // If the subject is already in a day, pick the next day to avoid duplicate
      // planning for the same subject on the same date.
      const preferredDayIndex = index % dayCount;
      let targetDay = null;
      for (let offset = 0; offset < dayCount; offset += 1) {
        const candidate = scheduleByDay[(preferredDayIndex + offset) % dayCount];
        const existsSameSubject = candidate.sessions.some(
          (session) => session.subjectId === row.subject_id,
        );
        if (!existsSameSubject) {
          targetDay = candidate;
          break;
        }
      }
      if (!targetDay) {
        return;
      }
      const score = Number(row.latest_score ?? 50);
      const sessionHours = score >= 80 ? 1 : score < 60 ? 3 : 2;
      const durationMinutes = sessionHours * 60;

      // Stack sessions through the day without overlap.
      const usedMinutes = targetDay.sessions.reduce(
        (sum, session) => sum + session.durationMinutes + 15,
        0,
      );
      const startMin = 14 * 60 + usedMinutes;
      const endMin = startMin + durationMinutes;
      const scoreLabel =
        score >= 80
          ? `high marks (${score}%)`
          : score < 60
            ? `low marks (${score}%)`
            : `average marks (${score}%)`;

      const formatTime = (minutes) => {
        const dayOffset = Math.floor(minutes / (24 * 60));
        const normalizedMinutes = minutes % (24 * 60);
        const h24 = Math.floor(normalizedMinutes / 60);
        const mins = normalizedMinutes % 60;
        const period = h24 >= 12 ? "PM" : "AM";
        const h12 = h24 % 12 || 12;
        const mm = String(mins).padStart(2, "0");
        const daySuffix = dayOffset > 0 ? ` (+${dayOffset} day)` : "";
        return `${h12}:${mm} ${period}${daySuffix}`;
      };

      targetDay.sessions.push({
        id: row.plan_id,
        subjectId: row.subject_id,
        subject: row.subject_name,
        detail: `${sessionHours} hour${sessionHours > 1 ? "s" : ""} focus session - ${scoreLabel}`,
        timeRange: `${formatTime(startMin)} - ${formatTime(endMin)}`,
        durationMinutes,
      });
    });

    return scheduleByDay.filter((d) => d.sessions.length > 0);
  }, [scoredPlan, showLastSchedule]);

  const tableRows = useMemo(() => {
    return weeklySchedule.flatMap((dayBlock) =>
      dayBlock.sessions.map((session, idx) => ({
        key: `${dayBlock.name}-${session.id}-${idx}`,
        day: dayBlock.name,
        date: dayBlock.date.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        status: dayBlock.isEnded ? "Ended" : "Active",
        subject: session.subject,
        detail: session.detail,
        timeRange: session.timeRange,
      })),
    );
  }, [weeklySchedule]);

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return tableRows;

    return tableRows.filter((row) =>
      [row.day, row.date, row.subject, row.detail, row.timeRange, row.status]
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [tableRows, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / perPage));
  const pagedRows = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredRows.slice(start, start + perPage);
  }, [filteredRows, page]);

  useEffect(() => {
    setPage(1);
  }, [search, showLastSchedule]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <section className="card">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h3 className="text-xl font-semibold text-slate-900">
          {showLastSchedule
            ? `Last Week Schedule${lastStudyPlanWeek ? ` (Week ${lastStudyPlanWeek})` : ""}`
            : "This Week's Schedule"}
        </h3>
        <button
          className="px-5 py-2 rounded-xl text-white font-medium bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 transition"
          onClick={onGenerateStudyPlan}
        >
          {needsNewPlan ? "Generate New Week Plan" : "Regenerate Schedule"}
        </button>
        {lastStudyPlan.length > 0 && (
          <button
            className="px-5 py-2 rounded-xl font-medium border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
            onClick={() => setShowLastSchedule((prev) => !prev)}
          >
            {showLastSchedule ? "Hide Last Schedule" : "View Last Week Schedule"}
          </button>
        )}
      </div>
      {needsNewPlan && (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Last week has ended. Generate a new study plan for week{" "}
          {currentWeek ?? "current"}.
        </p>
      )}
      <p className="mb-4 text-sm text-slate-600">
        Hours are mark-driven: high marks get less time, low marks get more time.
      </p>
      {showLastSchedule && (
        <p className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          Showing last saved schedule (week {lastStudyPlanWeek ?? "previous"}).
        </p>
      )}
      {weeklySchedule.length === 0 ? (
        <p className="text-sm text-gray-500">
          {showLastSchedule
            ? "No last schedule found."
            : needsNewPlan
              ? "No plan exists for this week yet. Click Generate New Week Plan."
              : "Generate a schedule to view weekly study sessions."}
        </p>
      ) : (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Search day, subject, session, or status"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-96 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-[980px] w-full text-sm border-collapse">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold border-b-2 border-slate-300">#</th>
                  <th className="px-4 py-3 text-left font-semibold border-b-2 border-slate-300">Day</th>
                  <th className="px-4 py-3 text-left font-semibold border-b-2 border-slate-300">Date</th>
                  <th className="px-4 py-3 text-left font-semibold border-b-2 border-slate-300">Subject</th>
                  <th className="px-4 py-3 text-left font-semibold border-b-2 border-slate-300">Session Detail</th>
                  <th className="px-4 py-3 text-left font-semibold border-b-2 border-slate-300">Time</th>
                  <th className="px-4 py-3 text-left font-semibold border-b-2 border-slate-300">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagedRows.map((row, idx) => (
                  <tr
                    key={row.key}
                    className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}
                  >
                    <td className="px-4 py-3 border-b-2 border-slate-300 text-slate-500">
                      {(page - 1) * perPage + idx + 1}
                    </td>
                    <td className="px-4 py-3 border-b-2 border-slate-300 font-medium text-slate-900">
                      {row.day}
                    </td>
                    <td className="px-4 py-3 border-b-2 border-slate-300 text-slate-600">
                      {row.date}
                    </td>
                    <td className="px-4 py-3 border-b-2 border-slate-300 font-semibold text-slate-900">
                      {row.subject}
                    </td>
                    <td className="px-4 py-3 border-b-2 border-slate-300 text-slate-600">
                      {row.detail}
                    </td>
                    <td className="px-4 py-3 border-b-2 border-slate-300 text-slate-700">
                      {row.timeRange}
                    </td>
                    <td className="px-4 py-3 border-b-2 border-slate-300">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          row.status === "Ended"
                            ? "bg-slate-100 text-slate-600"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredRows.length === 0 && (
            <p className="text-sm text-slate-500">No schedule rows match your search.</p>
          )}
          {filteredRows.length > 0 && (
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>
                Showing {(page - 1) * perPage + 1}-{Math.min(page * perPage, filteredRows.length)}{" "}
                of {filteredRows.length}
              </span>
              <div className="flex gap-2">
                <button
                  className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-50"
                  disabled={page === 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  Prev
                </button>
                <button
                  className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-50"
                  disabled={page === totalPages}
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default StudyPlanSection;




