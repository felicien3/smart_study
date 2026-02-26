import React, { useEffect, useMemo, useState } from "react";
import { fetchAcademicPathFromMarks } from "../../services/dashboardApi.js";

let rowIdCounter = 0;

const createDefaultMarkRow = () => ({
  id: `row-${++rowIdCounter}`,
  subject: "",
  score: "",
});

const AcademicPathSection = ({ token, onError }) => {
  const [educationLevel, setEducationLevel] = useState("o_level");
  const [marks, setMarks] = useState([
    createDefaultMarkRow(),
    createDefaultMarkRow(),
    createDefaultMarkRow(),
  ]);
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [selectedAlevel, setSelectedAlevel] = useState("");
  const [selectedUniversity, setSelectedUniversity] = useState("");

  const normalizedMarks = useMemo(
    () =>
      marks
        .map((row) => ({
          id: row.id,
          subject: String(row.subject || "").trim(),
          score: Number(row.score),
        })),
    [marks],
  );

  const duplicateSubjects = useMemo(() => {
    const counts = new Map();
    normalizedMarks.forEach((row) => {
      const key = row.subject.toLowerCase();
      if (!key) return;
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    return new Set(
      normalizedMarks
        .filter((row) => row.subject && (counts.get(row.subject.toLowerCase()) || 0) > 1)
        .map((row) => row.id),
    );
  }, [normalizedMarks]);

  const validMarks = useMemo(
    () =>
      normalizedMarks.filter(
        (row) =>
          row.subject.length > 0 &&
          Number.isFinite(row.score) &&
          row.score >= 0 &&
          row.score <= 100 &&
          !duplicateSubjects.has(row.id),
      ),
    [normalizedMarks, duplicateSubjects],
  );

  const updateRow = (index, field, value) => {
    setMarks((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
      ),
    );
  };

  const addRow = () => {
    setMarks((current) => [...current, createDefaultMarkRow()]);
  };

  const removeRow = (index) => {
    setMarks((current) => current.filter((_, rowIndex) => rowIndex !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setHasSubmitted(true);

    if (duplicateSubjects.size > 0) {
      onError("Remove duplicate subject names before submitting.");
      return;
    }

    if (validMarks.length < 3) {
      onError("Enter at least 3 valid subjects and marks (0-100).");
      return;
    }

    setLoading(true);
    try {
      const data = await fetchAcademicPathFromMarks(
        validMarks,
        educationLevel,
        token,
      );
      setRecommendation(data);
    } catch (err) {
      onError(err?.message || "Failed to generate academic path.");
    } finally {
      setLoading(false);
    }
  };

  const insights = recommendation?.ai_insights || {};
  const faculties = insights.university_faculties || [];
  const combinations = insights.alevel_combinations || [];
  const careers = insights.career_directions || [];

  useEffect(() => {
    setSelectedAlevel(combinations[0] || "");
    setSelectedUniversity(faculties[0] || "");
  }, [recommendation, combinations, faculties]);

  return (
    <section className="card">
      <h3 className="text-lg font-semibold text-slate-900">Academic Path</h3>
      <p className="mt-1 text-sm text-slate-600">
        Select student level, enter marks, and get the next academic direction.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label className="text-sm text-slate-700 font-medium">
            Student Level
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              value={educationLevel}
              onChange={(event) => setEducationLevel(event.target.value)}
            >
              <option value="o_level">O&apos;Level</option>
              <option value="a_level">A&apos;Level</option>
            </select>
          </label>
        </div>

        {marks.map((row, index) => (
          <div key={row.id} className="grid grid-cols-12 gap-2">
            <input
              type="text"
              className="col-span-7 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Subject (e.g. Mathematics)"
              value={row.subject}
              onChange={(event) => updateRow(index, "subject", event.target.value)}
            />
            <input
              type="number"
              min="0"
              max="100"
              className="col-span-3 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Mark %"
              value={row.score}
              onChange={(event) => updateRow(index, "score", event.target.value)}
            />
            <button
              type="button"
              className="col-span-2 rounded-lg border border-slate-300 px-2 py-2 text-xs text-slate-700 hover:bg-slate-50"
              onClick={() => removeRow(index)}
              disabled={marks.length <= 1}
            >
              Remove
            </button>
          </div>
        ))}

        {hasSubmitted && validMarks.length < 3 && (
          <p className="text-sm text-rose-700">
            At least 3 valid unique subjects with marks between 0 and 100 are required.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            onClick={addRow}
          >
            Add Subject
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-70"
          >
            {loading
              ? "Generating..."
              : educationLevel === "o_level"
                ? "Get A'Level Direction"
                : "Get University Direction"}
          </button>
        </div>
      </form>

      {recommendation && (
        <div className="mt-6 space-y-3">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-sm text-blue-700">Recommended Path</p>
            <p className="text-lg font-semibold text-blue-900">
              {recommendation.recommended_path}
            </p>
            <p className="mt-1 text-sm text-blue-800">{recommendation.reasoning}</p>
          </div>

          {educationLevel === "o_level" && combinations.length > 0 && (
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3">
              <p className="text-sm font-semibold text-indigo-800">A&apos;Level Selection</p>
              <p className="mt-1 text-xs text-indigo-700">
                Choose your preferred A&apos;Level combination.
              </p>
              <select
                className="mt-2 w-full rounded-lg border border-indigo-300 bg-white px-3 py-2 text-sm text-indigo-900"
                value={selectedAlevel}
                onChange={(event) => setSelectedAlevel(event.target.value)}
              >
                {combinations.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              {selectedAlevel && (
                <p className="mt-2 text-sm text-indigo-900">
                  Selected A&apos;Level: <span className="font-medium">{selectedAlevel}</span>
                </p>
              )}
            </div>
          )}

          {educationLevel === "a_level" && faculties.length > 0 && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-sm font-semibold text-emerald-800">
                University Selection
              </p>
              <p className="mt-1 text-xs text-emerald-700">
                Choose the university faculty/program you want to continue.
              </p>
              <select
                className="mt-2 w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm text-emerald-900"
                value={selectedUniversity}
                onChange={(event) => setSelectedUniversity(event.target.value)}
              >
                {faculties.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              {selectedUniversity && (
                <p className="mt-2 text-sm text-emerald-900">
                  Selected University Path:{" "}
                  <span className="font-medium">{selectedUniversity}</span>
                </p>
              )}
            </div>
          )}

          {careers.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-semibold text-amber-800">
                Career Directions
              </p>
              <ul className="mt-1 space-y-1 text-sm text-amber-900">
                {careers.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default AcademicPathSection;
