// src/services/api.js

import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 120000, // 2 min — PDF processing can be slow
  headers: {
    'Accept': 'application/json',
  },
});

// Intercept responses for consistent error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.error ||
      error?.message ||
      'Something went wrong. Please try again.';
    return Promise.reject(new Error(message));
  }
);

/**
 * Upload a file to /highlight-text endpoint.
 * @param {Object} file - File object from expo-document-picker
 * @param {Function} onUploadProgress - Progress callback (optional)
 * @returns {Promise<{ highlighted_text: string, output_pdf_path: string }>}
 */
export const highlightText = async (file, onUploadProgress) => {
  const formData = new FormData();

  // React Native FormData needs the file in this exact shape
  formData.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.mimeType || getMimeType(file.name),
  });

  const response = await apiClient.post('/highlight-text', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: onUploadProgress
      ? (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          onUploadProgress(percent);
        }
      : undefined,
  });

  return response.data;
};

/**
 * Generate MCQs for a file.
 * @param {Object} file - File object from expo-document-picker
 * @param {number} numQuestions - Number of questions to generate
 * @returns {Promise<{ mcqs: string }>}
 */
export const generateMCQs = async (file, numQuestions = 5) => {
  const formData = new FormData();

  formData.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.mimeType || getMimeType(file.name),
  });

  formData.append('num_questions', String(numQuestions));

  const response = await apiClient.post('/generate-mcqs', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

/**
 * Build the full URL to download the highlighted PDF.
 * @param {string} outputPdfPath - Path returned by backend e.g. "uploads/highlighted_with_mcqs.pdf"
 * @returns {string}
 */
export const getPdfUrl = (outputPdfPath) => {
  // Strip leading slash if present
  const cleanPath = outputPdfPath.startsWith('/')
    ? outputPdfPath.slice(1)
    : outputPdfPath;
  return `${BASE_URL}/${cleanPath}`;
};

// Helper
function getMimeType(filename) {
  if (!filename) return 'application/octet-stream';
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return 'application/pdf';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'doc':
      return 'application/msword';
    default:
      return 'application/octet-stream';
  }
}

export default { highlightText, generateMCQs, getPdfUrl };
