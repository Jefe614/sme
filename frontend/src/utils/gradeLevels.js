// src/utils/gradeLevels.js
export const gradeLevels = [
  { value: "pre-school", label: "Pre-School" },
  { value: "grade-1", label: "Grade 1" },
  { value: "grade-2", label: "Grade 2" },
  { value: "grade-3", label: "Grade 3" },
  { value: "grade-4", label: "Grade 4" },
  { value: "grade-5", label: "Grade 5" },
  { value: "grade-6", label: "Grade 6" },
  { value: "grade-7", label: "Grade 7" },
  { value: "grade-8", label: "Grade 8" },
  { value: "form-1", label: "Form 1" },
  { value: "form-2", label: "Form 2" },
  { value: "form-3", label: "Form 3" },
  { value: "form-4", label: "Form 4" },
];

export const getGradeLabel = (value) => {
  const grade = gradeLevels.find((g) => g.value === value);
  return grade ? grade.label : value;
};