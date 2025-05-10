
import config from '../config';

/**
 * Utility function to make API calls to the backend
 */
export const fetchAPI = async (
  endpoint: string, 
  options: RequestInit = {}
): Promise<any> => {
  const url = `${config.apiUrl}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      // Add any common headers here
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error);
    throw error;
  }
};

/**
 * Upload files to the backend
 */
export const uploadFiles = async (
  endpoint: string,
  files: File | File[],
  fieldName: string = 'files[]'
): Promise<any> => {
  const formData = new FormData();
  
  if (Array.isArray(files)) {
    files.forEach(file => {
      formData.append(fieldName, file);
    });
  } else {
    formData.append(fieldName, files);
  }
  
  return fetchAPI(endpoint, {
    method: 'POST',
    body: formData,
  });
};

/**
 * Get full URL for images
 */
export const getImageUrl = (path: string): string => {
  if (path.startsWith('http')) return path;
  return `${config.apiUrl}/static/${path.startsWith('uploads/') || path.startsWith('results/') ? '' : 'uploads/'}${path}`;
};
