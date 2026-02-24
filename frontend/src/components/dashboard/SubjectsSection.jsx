import React, { useEffect, useMemo, useState } from "react";
import { difficultyText, scoreBadge } from "./utils";

const SubjectsSection = ({
  subjects,
  onViewDetails,
  onEdit,
  onDelete,
  onAddSubject,
  onLogPerformance,
}) => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 8;

  const filteredSubjects = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return subjects;

    return subjects.filter((subject) => {
      const scoreText = String(Number(subject.latest_score) || 0);
      return (
        subject.name?.toLowerCase().includes(keyword) ||
        String(subject.difficulty ?? "").includes(keyword) ||
        scoreText.includes(keyword)
      );
    });
  }, [subjects, search]);

  const totalPages = Math.max(1, Math.ceil(filteredSubjects.length / perPage));
  const pagedSubjects = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredSubjects.slice(start, start + perPage);
  }, [filteredSubjects, page]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <section className="card mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold">Subjects</h3>
        <div className="flex items-center gap-2">
          <button className="btn-primary" onClick={onAddSubject}>
            Add Subject
          </button>
          <button className="btn-secondary" onClick={onLogPerformance}>
            Log Performance
          </button>
        </div>
      </div>
      {subjects.length === 0 ? (
        <p className="text-sm text-gray-500">No subjects added.</p>
      ) : (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Search subject, difficulty, or score"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-80 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-[900px] w-full text-sm border-collapse">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold border-b-2 border-slate-300">#</th>
                  <th className="px-4 py-3 text-left font-semibold border-b-2 border-slate-300">Subject</th>
                  <th className="px-4 py-3 text-left font-semibold border-b-2 border-slate-300">Difficulty</th>
                  <th className="px-4 py-3 text-left font-semibold border-b-2 border-slate-300">Latest Score</th>
                  <th className="px-4 py-3 text-left font-semibold border-b-2 border-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagedSubjects.map((subject, idx) => (
                  <tr
                    key={subject.subject_id}
                    className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}
                  >
                    <td className="px-4 py-3 border-b-2 border-slate-300 text-slate-500">
                      {(page - 1) * perPage + idx + 1}
                    </td>
                    <td className="px-4 py-3 border-b-2 border-slate-300 font-semibold text-slate-900">
                      {subject.name}
                    </td>
                    <td className="px-4 py-3 border-b-2 border-slate-300 text-slate-700">
                      <span className={difficultyText(Number(subject.difficulty))}>
                        {subject.difficulty}/5
                      </span>
                    </td>
                    <td className="px-4 py-3 border-b-2 border-slate-300">
                      <span
                        className={`px-2 py-1 rounded-md text-xs ${scoreBadge(
                          Number(subject.latest_score) || 0,
                        )}`}
                      >
                        {Number(subject.latest_score) || 0}%
                      </span>
                    </td>
                    <td className="px-4 py-3 border-b-2 border-slate-300">
                      <div className="flex gap-2">
                        <button
                          className="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50 text-sm"
                          onClick={() => onViewDetails(subject)}
                        >
                          Details
                        </button>
                        <button
                          className="px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm"
                          onClick={() => onEdit(subject)}
                        >
                          Edit
                        </button>
                        <button
                          className="px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 text-sm"
                          onClick={() => onDelete(subject.subject_id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredSubjects.length === 0 && (
            <p className="text-sm text-slate-500">No subjects match your search.</p>
          )}
          {filteredSubjects.length > 0 && (
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>
                Showing {(page - 1) * perPage + 1}-
                {Math.min(page * perPage, filteredSubjects.length)} of {filteredSubjects.length}
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

export default SubjectsSection;
