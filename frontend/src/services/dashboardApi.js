const API_BASE = "http://localhost:5000/api";

const request = async (path, options = {}, token) => {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
};

export const fetchDashboard = (token) => request("/dashboard", {}, token);

export const saveSubject = (subject, token) => {
  const isEdit = Boolean(subject.id);
  return request(
    isEdit ? `/subjects/${subject.id}` : "/subjects",
    {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: subject.name,
        difficulty: Number(subject.difficulty),
        exam_date: subject.exam_date || null,
      }),
    },
    token,
  );
};

export const deleteSubject = (subjectId, token) =>
  request(
    `/subjects/${subjectId}`,
    {
      method: "DELETE",
    },
    token,
  );

export const logPerformance = (payload, token) =>
  request(
    "/performance",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject_id: Number(payload.subject_id),
        score: Number(payload.score),
        week_number: Number(payload.week_number),
      }),
    },
    token,
  );

export const generateStudyPlanApi = (weekNumber, token) =>
  request(
    "/study-plan/generate",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ week_number: weekNumber }),
    },
    token,
  );

export const fetchStudyPlanByWeek = (weekNumber, token) =>
  request(`/study-plan/${weekNumber}`, {}, token);

export const fetchRecommendation = (token) =>
  request("/academic-recommendation", {}, token);

export const fetchAcademicPathFromMarks = (marks, educationLevel, token) =>
  request(
    "/academic-recommendation/from-marks",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marks, education_level: educationLevel }),
    },
    token,
  );

export const fetchSubjectPerformance = (subjectId, token) =>
  request(`/performance/subject/${subjectId}`, {}, token);
