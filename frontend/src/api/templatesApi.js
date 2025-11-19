import apiClient from './apiClient.js';

// Document Template API functions
export const fetchTemplates = async (params = {}) => {
  try {
    const response = await apiClient.get('/templates/', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching templates:', error);
    throw error;
  }
};

export const createTemplate = async (templateData) => {
  try {
    const response = await apiClient.post('/templates/', templateData);
    return response.data;
  } catch (error) {
    console.error('Error creating template:', error);
    throw error;
  }
};

export const updateTemplate = async (templateId, templateData) => {
  try {
    const response = await apiClient.put(`/templates/${templateId}/`, templateData);
    return response.data;
  } catch (error) {
    console.error('Error updating template:', error);
    throw error;
  }
};

export const deleteTemplate = async (templateId) => {
  try {
    const response = await apiClient.delete(`/templates/${templateId}/`);
    return response.data;
  } catch (error) {
    console.error('Error deleting template:', error);
    throw error;
  }
};

export const fetchTemplateById = async (templateId) => {
  try {
    const response = await apiClient.get(`/templates/${templateId}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching template:', error);
    throw error;
  }
};

export const fetchTemplateCategories = async () => {
  try {
    const response = await apiClient.get('/template-categories/');
    return response.data;
  } catch (error) {
    console.error('Error fetching template categories:', error);
    throw error;
  }
};

export const generateDocument = async (payload) => {
  try {
    const response = await apiClient.post('/generate-document/', payload);
    return response.data;
  } catch (error) {
    console.error('Error generating document:', error);
    throw error;
  }
};

// Helper function to extract placeholders from template body
export const extractPlaceholders = (templateBody) => {
  const placeholderRegex = /\{\{(\w+)\}\}/g;
  const placeholders = [];
  let match;

  while ((match = placeholderRegex.exec(templateBody)) !== null) {
    if (!placeholders.includes(match[1])) {
      placeholders.push(match[1]);
    }
  }

  return placeholders;
};

// Helper function to validate template data
export const validateTemplateData = (templateData, requiredPlaceholders) => {
  const missingPlaceholders = requiredPlaceholders.filter(placeholder =>
    !templateData[placeholder] || templateData[placeholder].trim() === ''
  );

  return {
    isValid: missingPlaceholders.length === 0,
    missingPlaceholders
  };
};
