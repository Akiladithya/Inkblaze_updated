// src/utils/fileUtils.js

import { Platform } from 'react-native';

/**
 * Returns a human-readable file size string.
 * @param {number} bytes
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Returns uppercase extension from a filename.
 * @param {string} filename
 */
export function getFileExtension(filename) {
  if (!filename) return '';
  return (filename.split('.').pop() || '').toUpperCase();
}

/**
 * Returns the MIME type for a given filename.
 * @param {string} filename
 */
export function getMimeType(filename) {
  const ext = (filename?.split('.').pop() || '').toLowerCase();
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

/**
 * Returns true if the file is an accepted type.
 * @param {string} filename
 */
export function isAcceptedFileType(filename) {
  const ext = (filename?.split('.').pop() || '').toLowerCase();
  return ['pdf', 'docx', 'doc'].includes(ext);
}

/**
 * Truncates a long filename for display.
 * @param {string} filename
 * @param {number} maxLength
 */
export function truncateFilename(filename, maxLength = 30) {
  if (!filename || filename.length <= maxLength) return filename;
  const ext = filename.includes('.') ? '.' + filename.split('.').pop() : '';
  const base = filename.slice(0, maxLength - ext.length - 3);
  return `${base}…${ext}`;
}

/**
 * Returns the PDF viewer URL strategy for each platform.
 * @param {string} pdfUrl - Full URL to the PDF
 */
export function getPdfViewerUrl(pdfUrl) {
  if (Platform.OS === 'ios') {
    // iOS Safari renders PDFs natively in WebView
    return pdfUrl;
  }
  if (Platform.OS === 'android') {
    // Android: use Google Docs viewer as proxy
    return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUrl)}`;
  }
  // Web: direct URL (iframe renders PDF)
  return pdfUrl;
}
