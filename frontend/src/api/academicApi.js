import apiClient from './apiClient.js';

// ==================== ACADEMIC YEAR API FUNCTIONS ====================

export const fetchAcademicYears = async (params = {}) => {
  try {
    const response = await apiClient.get('/academic-years/', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching academic years:', error);
    throw error;
  }
};

export const createAcademicYear = async (academicYearData) => {
  try {
    const response = await apiClient.post('/academic-years/', academicYearData);
    return response.data;
  } catch (error) {
    console.error('Error creating academic year:', error);
    throw error;
  }
};

export const updateAcademicYear = async (academicYearId, academicYearData) => {
  try {
    const response = await apiClient.put(`/academic-years/${academicYearId}/`, academicYearData);
    return response.data;
  } catch (error) {
    console.error('Error updating academic year:', error);
    throw error;
  }
};

export const deleteAcademicYear = async (academicYearId) => {
  try {
    const response = await apiClient.delete(`/academic-years/${academicYearId}/`);
    return response.data;
  } catch (error) {
    console.error('Error deleting academic year:', error);
    throw error;
  }
};

export const fetchAcademicYearById = async (academicYearId) => {
  try {
    const response = await apiClient.get(`/academic-years/${academicYearId}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching academic year:', error);
    throw error;
  }
};

// ==================== TERM API FUNCTIONS ====================

export const fetchTerms = async (params = {}) => {
  try {
    const response = await apiClient.get('/terms/', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching terms:', error);
    throw error;
  }
};

export const createTerm = async (termData) => {
  try {
    const response = await apiClient.post('/terms/', termData);
    return response.data;
  } catch (error) {
    console.error('Error creating term:', error);
    throw error;
  }
};

export const updateTerm = async (termId, termData) => {
  try {
    const response = await apiClient.put(`/terms/${termId}/`, termData);
    return response.data;
  } catch (error) {
    console.error('Error updating term:', error);
    throw error;
  }
};

export const deleteTerm = async (termId) => {
  try {
    const response = await apiClient.delete(`/terms/${termId}/`);
    return response.data;
  } catch (error) {
    console.error('Error deleting term:', error);
    throw error;
  }
};

export const fetchTermById = async (termId) => {
  try {
    const response = await apiClient.get(`/terms/${termId}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching term:', error);
    throw error;
  }
};

// ==================== CLASS-SUBJECT ASSIGNMENT API FUNCTIONS ====================

export const fetchClassSubjectAssignments = async (params = {}) => {
  try {
    const response = await apiClient.get('/class-subject-assignments/', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching class-subject assignments:', error);
    throw error;
  }
};

export const createClassSubjectAssignment = async (assignmentData) => {
  try {
    const response = await apiClient.post('/class-subject-assignments/', assignmentData);
    return response.data;
  } catch (error) {
    console.error('Error creating class-subject assignment:', error);
    throw error;
  }
};

export const updateClassSubjectAssignment = async (assignmentId, assignmentData) => {
  try {
    const response = await apiClient.put(`/class-subject-assignments/${assignmentId}/`, assignmentData);
    return response.data;
  } catch (error) {
    console.error('Error updating class-subject assignment:', error);
    throw error;
  }
};

export const deleteClassSubjectAssignment = async (assignmentId) => {
  try {
    const response = await apiClient.delete(`/class-subject-assignments/${assignmentId}/`);
    return response.data;
  } catch (error) {
    console.error('Error deleting class-subject assignment:', error);
    throw error;
  }
};

export const fetchClassSubjectAssignmentById = async (assignmentId) => {
  try {
    const response = await apiClient.get(`/class-subject-assignments/${assignmentId}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching class-subject assignment:', error);
    throw error;
  }
};

// ==================== HELPER FUNCTIONS ====================

// Get active academic year
export const getActiveAcademicYear = async () => {
  try {
    const response = await apiClient.get('/academic-years/', {
      params: { is_active: 'true' }
    });
    return response.data.data?.[0] || null;
  } catch (error) {
    console.error('Error fetching active academic year:', error);
    throw error;
  }
};

// Get current term
export const getCurrentTerm = async () => {
  try {
    const response = await apiClient.get('/terms/', {
      params: { is_current: 'true' }
    });
    return response.data.data?.[0] || null;
  } catch (error) {
    console.error('Error fetching current term:', error);
    throw error;
  }
};

// Validate academic year data
export const validateAcademicYearData = (data) => {
  const errors = [];

  if (!data.name?.trim()) {
    errors.push('Academic year name is required');
  }

  if (!data.start_date) {
    errors.push('Start date is required');
  }

  if (!data.end_date) {
    errors.push('End date is required');
  }

  if (data.start_date && data.end_date && new Date(data.start_date) >= new Date(data.end_date)) {
    errors.push('End date must be after start date');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate term data
export const validateTermData = (data) => {
  const errors = [];

  if (!data.academic_year) {
    errors.push('Academic year is required');
  }

  if (!data.name?.trim()) {
    errors.push('Term name is required');
  }

  if (!data.start_date) {
    errors.push('Start date is required');
  }

  if (!data.end_date) {
    errors.push('End date is required');
  }

  if (data.start_date && data.end_date && new Date(data.start_date) >= new Date(data.end_date)) {
    errors.push('Term end date must be after start date');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate class-subject assignment data
export const validateClassSubjectAssignmentData = (data) => {
  const errors = [];

  if (!data.student_class) {
    errors.push('Class is required');
  }

  if (!data.subject) {
    errors.push('Subject is required');
  }

  if (!data.academic_year) {
    errors.push('Academic year is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Get assignments for a specific class and academic year
export const getClassAssignments = async (classId, academicYearId) => {
  try {
    const response = await apiClient.get('/class-subject-assignments/', {
      params: {
        class: classId,
        academic_year: academicYearId
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching class assignments:', error);
    throw error;
  }
};

// Bulk create assignments
export const bulkCreateAssignments = async (assignments) => {
  const results = [];
  const errors = [];

  for (const assignment of assignments) {
    try {
      const result = await createClassSubjectAssignment(assignment);
      results.push(result);
    } catch (error) {
      errors.push({
        assignment,
        error: error.response?.data || error.message
      });
    }
  }

  return { results, errors };
};