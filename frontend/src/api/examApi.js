import apiClient from './apiClient.js';

// ==================== GRADING SYSTEM API FUNCTIONS ====================

export const fetchGradingSystems = async (params = {}) => {
  try {
    const response = await apiClient.get('/grading-systems/', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching grading systems:', error);
    throw error;
  }
};

export const createGradingSystem = async (gradingSystemData) => {
  try {
    const response = await apiClient.post('/grading-systems/', gradingSystemData);
    return response.data;
  } catch (error) {
    console.error('Error creating grading system:', error);
    throw error;
  }
};

export const updateGradingSystem = async (gradingSystemId, gradingSystemData) => {
  try {
    const response = await apiClient.put(`/grading-systems/${gradingSystemId}/`, gradingSystemData);
    return response.data;
  } catch (error) {
    console.error('Error updating grading system:', error);
    throw error;
  }
};

export const deleteGradingSystem = async (gradingSystemId) => {
  try {
    const response = await apiClient.delete(`/grading-systems/${gradingSystemId}/`);
    return response.data;
  } catch (error) {
    console.error('Error deleting grading system:', error);
    throw error;
  }
};

export const fetchGradingSystemById = async (gradingSystemId) => {
  try {
    const response = await apiClient.get(`/grading-systems/${gradingSystemId}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching grading system:', error);
    throw error;
  }
};

// ==================== EXAM API FUNCTIONS ====================

export const fetchExams = async (params = {}) => {
  try {
    const response = await apiClient.get('/exams/', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching exams:', error);
    throw error;
  }
};

export const createExam = async (examData) => {
  try {
    const response = await apiClient.post('/exams/', examData);
    return response.data;
  } catch (error) {
    console.error('Error creating exam:', error);
    throw error;
  }
};

export const updateExam = async (examId, examData) => {
  try {
    const response = await apiClient.put(`/exams/${examId}/`, examData);
    return response.data;
  } catch (error) {
    console.error('Error updating exam:', error);
    throw error;
  }
};

export const deleteExam = async (examId) => {
  try {
    const response = await apiClient.delete(`/exams/${examId}/`);
    return response.data;
  } catch (error) {
    console.error('Error deleting exam:', error);
    throw error;
  }
};

export const fetchExamById = async (examId) => {
  try {
    const response = await apiClient.get(`/exams/${examId}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching exam:', error);
    throw error;
  }
};

export const lockExam = async (examId, action) => {
  try {
    const response = await apiClient.post(`/exams/${examId}/lock/`, { action });
    return response.data;
  } catch (error) {
    console.error('Error locking/unlocking exam:', error);
    throw error;
  }
};

// ==================== EXAM MARKS API FUNCTIONS ====================

export const fetchExamMarks = async (params = {}) => {
  try {
    const response = await apiClient.get('/exam-marks/', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching exam marks:', error);
    throw error;
  }
};

export const createExamMark = async (examMarkData) => {
  try {
    const response = await apiClient.post('/exam-marks/', examMarkData);
    return response.data;
  } catch (error) {
    console.error('Error creating exam mark:', error);
    throw error;
  }
};

export const updateExamMark = async (examMarkId, examMarkData) => {
  try {
    const response = await apiClient.put(`/exam-marks/${examMarkId}/`, examMarkData);
    return response.data;
  } catch (error) {
    console.error('Error updating exam mark:', error);
    throw error;
  }
};

export const deleteExamMark = async (examMarkId) => {
  try {
    const response = await apiClient.delete(`/exam-marks/${examMarkId}/`);
    return response.data;
  } catch (error) {
    console.error('Error deleting exam mark:', error);
    throw error;
  }
};

export const fetchExamMarkById = async (examMarkId) => {
  try {
    const response = await apiClient.get(`/exam-marks/${examMarkId}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching exam mark:', error);
    throw error;
  }
};

export const bulkCreateExamMarks = async (bulkData) => {
  console.log('bulkCreateExamMarks called with:', bulkData);
  try {
    const response = await apiClient.post('/exam-marks/bulk/', bulkData);
    console.log('bulkCreateExamMarks response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error bulk creating exam marks:', error);
    throw error;
  }
};

// ==================== REPORTS AND ANALYTICS API FUNCTIONS ====================

export const fetchStudentReportCard = async (params) => {
  try {
    const response = await apiClient.get('/reports/student-report-card/', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching student report card:', error);
    throw error;
  }
};

export const fetchClassPerformance = async (params) => {
  try {
    const response = await apiClient.get('/reports/class-performance/', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching class performance:', error);
    throw error;
  }
};

export const fetchExamStatistics = async (params) => {
  try {
    const response = await apiClient.get('/reports/exam-statistics/', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching exam statistics:', error);
    throw error;
  }
};

// ==================== HELPER FUNCTIONS ====================

// Get default grading system
export const getDefaultGradingSystem = async () => {
  try {
    const response = await apiClient.get('/grading-systems/', {
      params: { is_default: 'true' }
    });
    return response.data.data?.[0] || null;
  } catch (error) {
    console.error('Error fetching default grading system:', error);
    throw error;
  }
};

// Get exams for a specific term and academic year
export const getExamsByTerm = async (academicYearId, termId, classId = null) => {
  try {
    const params = {
      academic_year: academicYearId,
      term: termId
    };
    if (classId) {
      params.class = classId;
    }
    const response = await apiClient.get('/exams/', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching exams by term:', error);
    throw error;
  }
};

// Get exam marks for a specific exam
export const getExamMarksByExam = async (examId) => {
  try {
    const response = await apiClient.get('/exam-marks/', {
      params: { exam: examId }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching exam marks by exam:', error);
    throw error;
  }
};

// Get student marks for a specific term
export const getStudentMarksByTerm = async (studentId, academicYearId, termId) => {
  try {
    const response = await apiClient.get('/exam-marks/', {
      params: {
        student: studentId,
        academic_year: academicYearId,
        term: termId
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching student marks by term:', error);
    throw error;
  }
};

// Validate exam data
export const validateExamData = (data) => {
  const errors = [];

  if (!data.name?.trim()) {
    errors.push('Exam name is required');
  }

  if (!data.academic_year) {
    errors.push('Academic year is required');
  }

  if (!data.term) {
    errors.push('Term is required');
  }

  if (!data.exam_type) {
    errors.push('Exam type is required');
  }

  if (data.total_marks && (data.total_marks < 0 || data.total_marks > 1000)) {
    errors.push('Total marks must be between 0 and 1000');
  }

  if (data.weight_percentage && (data.weight_percentage < 0 || data.weight_percentage > 100)) {
    errors.push('Weight percentage must be between 0 and 100');
  }

  if (data.exam_date && data.results_publish_date &&
      new Date(data.exam_date) > new Date(data.results_publish_date)) {
    errors.push('Results publish date must be after exam date');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate exam mark data
export const validateExamMarkData = (data, exam = null) => {
  const errors = [];

  if (!data.exam) {
    errors.push('Exam is required');
  }

  if (!data.student) {
    errors.push('Student is required');
  }

  if (!data.subject) {
    errors.push('Subject is required');
  }

  if (data.marks_obtained !== undefined && data.marks_obtained !== null && data.marks_obtained !== '') {
    const marks = parseFloat(data.marks_obtained);
    if (isNaN(marks) || marks < 0) {
      errors.push('Marks obtained must be a valid positive number');
    }
    if (exam && marks > exam.total_marks) {
      errors.push(`Marks obtained cannot exceed total marks (${exam.total_marks})`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate grading system data
export const validateGradingSystemData = (data) => {
  const errors = [];

  if (!data.name?.trim()) {
    errors.push('Grading system name is required');
  }

  if (!data.grading_type) {
    errors.push('Grading type is required');
  }

  if (!data.grading_scale || !Array.isArray(data.grading_scale) || data.grading_scale.length === 0) {
    errors.push('Grading scale is required and must contain at least one grade');
  }

  // Validate grading scale format based on type
  if (data.grading_type === '8-4-4') {
    data.grading_scale.forEach((grade, index) => {
      if (!grade.min_mark && grade.min_mark !== 0) {
        errors.push(`Grade ${index + 1}: Minimum mark is required`);
      }
      if (!grade.max_mark && grade.max_mark !== 0) {
        errors.push(`Grade ${index + 1}: Maximum mark is required`);
      }
      if (!grade.grade?.trim()) {
        errors.push(`Grade ${index + 1}: Grade letter is required`);
      }
      if (!grade.points && grade.points !== 0) {
        errors.push(`Grade ${index + 1}: Points are required`);
      }
      if (grade.min_mark > grade.max_mark) {
        errors.push(`Grade ${index + 1}: Minimum mark cannot be greater than maximum mark`);
      }
    });
  } else if (data.grading_type === 'cbc') {
    data.grading_scale.forEach((level, index) => {
      if (!level.level?.trim()) {
        errors.push(`Level ${index + 1}: Level name is required`);
      }
      if (!level.description?.trim()) {
        errors.push(`Level ${index + 1}: Description is required`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Get grading scale display text
export const getGradingScaleDisplay = (gradingSystem) => {
  if (!gradingSystem?.grading_scale) return '';

  if (gradingSystem.grading_type === '8-4-4') {
    return gradingSystem.grading_scale
      .sort((a, b) => b.min_mark - a.min_mark)
      .map(grade => `${grade.min_mark}-${grade.max_mark}: ${grade.grade} (${grade.points} pts)`)
      .join(', ');
  } else if (gradingSystem.grading_type === 'cbc') {
    return gradingSystem.grading_scale
      .map(level => level.level)
      .join(', ');
  }

  return '';
};

// Calculate grade from marks and grading system
export const calculateGrade = (marks, gradingSystem) => {
  if (!gradingSystem || !marks || gradingSystem.grading_type !== '8-4-4') {
    return null;
  }

  const numericMarks = parseFloat(marks);
  if (isNaN(numericMarks)) return null;

  for (const grade of gradingSystem.grading_scale) {
    if (numericMarks >= grade.min_mark && numericMarks <= grade.max_mark) {
      return {
        grade: grade.grade,
        points: grade.points
      };
    }
  }

  return null;
};
