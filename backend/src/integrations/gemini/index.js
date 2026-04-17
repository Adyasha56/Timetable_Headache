const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GEMINI_API_KEY } = require('../../config/env');
const { logger } = require('../../common/logger');

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

const parseConstraintText = async (rawText, context = {}) => {
  const prompt = `
You are a university timetable constraint parser. Convert the following natural language constraint into a structured JSON object.

Context:
- Department: ${context.dept || 'unknown'}
- Semester: ${context.semester || 'unknown'}

Constraint text: "${rawText}"

Return ONLY valid JSON with this structure (no markdown, no explanation):
{
  "type": "hard" or "soft",
  "category": one of ["faculty_availability", "room_preference", "subject_timing", "workload", "consecutive_slots", "other"],
  "weight": number 1-5 (1=low priority, 5=critical, always 5 for hard constraints),
  "entities": {
    "faculty_name": string or null,
    "subject_code": string or null,
    "room": string or null
  },
  "rule": {
    "unavailable_days": array of day numbers (0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat) or null,
    "unavailable_slots": array of slot numbers (0-7) or null,
    "preferred_days": array or null,
    "preferred_slots": array or null,
    "max_consecutive": number or null,
    "min_gap_between_sessions": number or null
  },
  "summary": one-line human readable summary of the constraint
}
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const clean = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(clean);
  } catch (err) {
    logger.error('Gemini constraint parse failed:', err.message);
    throw new Error('Failed to parse constraint with LLM');
  }
};

const explainConflict = async (conflictDetails) => {
  const prompt = `
You are a university timetable advisor. Explain the following timetable conflict in simple terms and suggest how to resolve it.

Conflict details:
${JSON.stringify(conflictDetails, null, 2)}

Respond in plain English, 2-3 sentences max. Be specific about what is conflicting and give one actionable suggestion.
`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    logger.error('Gemini conflict explain failed:', err.message);
    throw new Error('Failed to explain conflict with LLM');
  }
};

/**
 * AI Touchpoint 1 (Pre-Solve): Suggest which faculty should teach which subjects.
 * HOD reviews and tweaks before the CP-SAT solver runs.
 */
const suggestAllocation = async ({ faculty_list, subject_list, dept_name, semester_name }) => {
  const facultySummary = faculty_list.map((f) => ({
    id: f._id,
    name: f.name,
    expertise: f.expertise || [],
    max_hours: f.max_hours_per_week || 20,
    type: f.type || 'faculty',
  }));

  const subjectSummary = subject_list.map((s) => ({
    id: s._id,
    code: s.code,
    name: s.name,
    type: s.type,
    credits: s.credits,
    sessions_per_week: s.sessions_per_week,
  }));

  const prompt = `
You are a university department scheduler. Given the faculty and subjects listed below, suggest an optimal faculty-subject allocation for the ${semester_name} semester of the ${dept_name} department.

Rules:
1. Assign each subject to exactly ONE faculty member.
2. Match faculty expertise to subject (use subject code and name as hints).
3. Balance workload — no faculty should be overloaded (respect max_hours_per_week: 1 session = 1 hour).
4. Lab/practical subjects must go to faculty with relevant expertise or lab_assistant type.
5. A faculty member can teach multiple subjects.
6. If no good match exists, assign to the least-loaded faculty.

Faculty list:
${JSON.stringify(facultySummary, null, 2)}

Subject list:
${JSON.stringify(subjectSummary, null, 2)}

Return ONLY a valid JSON array (no markdown, no explanation):
[
  {
    "subject_id": "<id>",
    "subject_code": "<code>",
    "subject_name": "<name>",
    "faculty_id": "<id>",
    "faculty_name": "<name>",
    "reason": "<one sentence why this match>",
    "confidence": "high" | "medium" | "low"
  }
]
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const clean = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(clean);
  } catch (err) {
    logger.error('Gemini suggest allocation failed:', err.message);
    throw new Error('Failed to generate faculty-subject allocation with LLM');
  }
};

module.exports = { parseConstraintText, explainConflict, suggestAllocation };
