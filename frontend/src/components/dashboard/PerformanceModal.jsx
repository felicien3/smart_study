import React from "react";

const PerformanceModal = ({
  open,
  subjects,
  performanceForm,
  setPerformanceForm,
  onSubmit,
  onClose,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Log Performance</h3>
        <form onSubmit={onSubmit}>
          <label className="block text-sm font-medium mb-1">Subject</label>
          <select
            className="input-field mb-3"
            required
            value={performanceForm.subject_id}
            onChange={(e) =>
              setPerformanceForm((prev) => ({
                ...prev,
                subject_id: e.target.value,
              }))
            }
          >
            <option value="">Select a subject</option>
            {subjects.map((subject) => (
              <option key={subject.subject_id} value={subject.subject_id}>
                {subject.name}
              </option>
            ))}
          </select>
          <label className="block text-sm font-medium mb-1">Score (0-100)</label>
          <input
            type="number"
            min="0"
            max="100"
            className="input-field mb-3"
            required
            value={performanceForm.score}
            onChange={(e) =>
              setPerformanceForm((prev) => ({ ...prev, score: e.target.value }))
            }
          />
          <label className="block text-sm font-medium mb-1">Week Number</label>
          <input
            type="number"
            min="1"
            max="52"
            className="input-field mb-4"
            required
            value={performanceForm.week_number}
            onChange={(e) =>
              setPerformanceForm((prev) => ({
                ...prev,
                week_number: e.target.value,
              }))
            }
          />
          <div className="flex gap-2">
            <button className="btn-primary flex-1" type="submit">
              Save
            </button>
            <button
              type="button"
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PerformanceModal;
