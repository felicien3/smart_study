import React from "react";

const SubjectModal = ({ open, subjectForm, setSubjectForm, onSubmit, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">
          {subjectForm.id ? "Edit Subject" : "Add Subject"}
        </h3>
        <form onSubmit={onSubmit}>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            className="input-field mb-3"
            required
            value={subjectForm.name}
            onChange={(e) =>
              setSubjectForm((prev) => ({ ...prev, name: e.target.value }))
            }
          />
          <label className="block text-sm font-medium mb-1">Difficulty (1-5)</label>
          <input
            type="number"
            min="1"
            max="5"
            className="input-field mb-3"
            required
            value={subjectForm.difficulty}
            onChange={(e) =>
              setSubjectForm((prev) => ({
                ...prev,
                difficulty: Number(e.target.value),
              }))
            }
          />
          <label className="block text-sm font-medium mb-1">Exam Date</label>
          <input
            type="date"
            className="input-field mb-4"
            value={subjectForm.exam_date}
            onChange={(e) =>
              setSubjectForm((prev) => ({ ...prev, exam_date: e.target.value }))
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

export default SubjectModal;
