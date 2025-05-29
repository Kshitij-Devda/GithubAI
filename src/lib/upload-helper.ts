import axios from 'axios';

// Simple upload service that doesn't use Firebase
type ProgressCallback = (progress: number) => void;

/**
 * Create a data URL for a file that can be used as a local reference
 * This is a workaround for the CORS issues with external file hosting services
 * 
 * @param file The file to convert to a data URL
 * @param onProgress Progress callback
 * @returns A data URL representing the file
 */
export async function createDataUrl(file: File, onProgress?: ProgressCallback): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      
      // Set up progress tracking
      if (onProgress) {
        reader.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            onProgress(percentComplete);
          }
        };
      }
      
      // Set up completion handler
      reader.onload = () => {
        if (onProgress) {
          onProgress(100);
        }
        const result = reader.result as string;
        resolve(result);
      };
      
      // Set up error handler
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      // Start reading the file as a data URL
      reader.readAsDataURL(file);
      
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Uploads a file to a direct file hosting service
 * 
 * @param file The file to upload
 * @param onProgress Progress callback
 * @returns URL to the uploaded file
 */
export async function uploadFileDirectly(file: File, onProgress?: ProgressCallback): Promise<string> {
  try {
    console.log(`Creating local data URL for file: ${file.name}`);
    
    // Use data URL approach instead of external hosting
    const dataUrl = await createDataUrl(file, onProgress);
    
    console.log('File successfully converted to data URL');
    return dataUrl;
  } catch (error) {
    console.error('Error creating data URL:', error);
    throw new Error(error instanceof Error ? error.message : 'Upload failed');
  }
}

/**
 * Fallback method - creates a fake download URL for testing
 * Use this if no other upload method works
 */
export async function createFakeUploadUrl(file: File, onProgress?: ProgressCallback): Promise<string> {
  console.warn('WARNING: Using fake upload URL - this will not work with AssemblyAI!');
  
  // Simulate upload progress
  let progress = 0;
  const intervalId = setInterval(() => {
    progress += 10;
    if (progress > 100) {
      progress = 100;
      clearInterval(intervalId);
    }
    if (onProgress) onProgress(progress);
  }, 500);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 5000));
  clearInterval(intervalId);
  
  // Return a fake URL that includes the file name
  const timestamp = Date.now();
  const fakeUrl = `https://example.com/uploads/${timestamp}_${file.name}`;
  
  console.log('Created fake download URL:', fakeUrl);
  return fakeUrl;
} 