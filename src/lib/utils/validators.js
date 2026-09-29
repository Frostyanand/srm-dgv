import { ValidationError } from './errors';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'application/vnd.ms-excel',
  'text/csv',
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const validateFileUpload = (file) => {
  if (!file || typeof file.type !== 'string') {
    throw new ValidationError('Invalid file object.');
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new ValidationError(`Unsupported file type: ${file.type}. Allowed types: PDF, Excel, CSV.`);
  }

  // File size check is typically done during streaming if it exceeds limits,
  // but if the File object has size, we can fail early.
  if (file.size && file.size > MAX_FILE_SIZE_BYTES) {
    throw new ValidationError(`File size exceeds the 10MB limit.`);
  }

  return true;
};
