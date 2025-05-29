import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

// Your web app's Firebase configuration - double check this matches your Firebase project settings
const firebaseConfig = {
  apiKey: "AIzaSyArI9MIplEpEYvN2rQisf_aYqM_XHOzevs",
  authDomain: "sample-githubai.firebaseapp.com",
  projectId: "sample-githubai",
  storageBucket: "sample-githubai.appspot.com", // Make sure this is correct
  messagingSenderId: "327000827775",
  appId: "1:327000827775:web:91125a5320f4b582c8dc4a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Storage and get a reference to the service
const storage = getStorage(app);

// Simple test to verify storage is working
console.log("Firebase initialized with storage", firebaseConfig.storageBucket);

/**
 * Simplified function to upload files to Firebase Storage
 */
export async function uploadFile(file: File, setProgress?: (progress: number) => void): Promise<string> {
  console.log("Starting upload for file:", file.name);
  
  return new Promise((resolve, reject) => {
    try {
      // Create a storage reference
      const fileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, fileName);
      
      console.log("Created storage reference for:", fileName);
      
      // Create the file metadata
      const metadata = {
        contentType: file.type
      };
      
      // Upload the file and metadata
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);
      
      // Register three observers:
      // 1. 'state_changed' observer, called any time the state changes
      // 2. Error observer, called on failure
      // 3. Completion observer, called on successful completion
      uploadTask.on('state_changed',
        (snapshot) => {
          // Observe state change events such as progress, pause, and resume
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          console.log('Upload is ' + progress + '% done');
          
          if (setProgress) {
            setProgress(progress);
          }
          
          switch (snapshot.state) {
            case 'paused':
              console.log('Upload is paused');
              break;
            case 'running':
              console.log('Upload is running');
              break;
          }
        }, 
        (error) => {
          // Handle unsuccessful uploads
          console.error("Upload failed:", error.code, error.message);
          
          switch (error.code) {
            case 'storage/unauthorized':
              reject(new Error("User doesn't have permission to access the storage bucket"));
              break;
            case 'storage/canceled':
              reject(new Error("User canceled the upload"));
              break;
            case 'storage/unknown':
              reject(new Error("Unknown error occurred, inspect error.serverResponse"));
              break;
            default:
              reject(error);
              break;
          }
        }, 
        () => {
          // Handle successful uploads on complete
          console.log("Upload completed successfully, getting download URL");
          
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            console.log('File available at', downloadURL);
            resolve(downloadURL);
          }).catch(error => {
            console.error("Failed to get download URL:", error);
            reject(error);
          });
        }
      );
    } catch (error) {
      console.error("Setup error during upload:", error);
      reject(error);
    }
  });
}

// Export the initialized storage
export { storage };