import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../../backend/firebase/init';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Allowed MIME types
const allowedTypes = ['image/jpeg', 'image/png', 'video/mp4', 'video/quicktime'];
const maxSizeMB = 10; // Maximum allowed file size (10MB)

/**
 * Uploads a file to Firebase Storage after validating type and size.
 *
 * @param {Object} options
 * @param {string} options.uri - Local file URI (e.g., from ImagePicker)
 * @param {string} options.type - 'image' | 'video' | 'other'
 * @param {string} options.userId - Firebase Auth or app user ID
 * @param {string} [options.pathPrefix] - Optional folder path (default 'uploads')
 * @returns {Promise<Object>} - { url, path }
 */
export const uploadFile = async ({ uri, type = 'image', userId, pathPrefix = 'uploads' }) => {
  if (!uri || !userId) {
    throw new Error('Missing required parameters: uri or userId');
  }

  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error('File does not exist.');
    }

    const fileSizeMB = fileInfo.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      throw new Error(`File size exceeds ${maxSizeMB}MB limit.`);
    }

    const fileName = uri.split('/').pop();
    const fileExt = fileName.split('.').pop()?.toLowerCase() || '';
    const mimeMap = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      heic: 'image/heic',
      heif: 'image/heif',
      mp4: 'video/mp4',
      mov: 'video/quicktime',
    };
    const mimeType = mimeMap[fileExt] || `${type}/*`;

    if (!allowedTypes.includes(mimeType)) {
      throw new Error('Unsupported file type. Only JPEG, PNG, MP4, and MOV are allowed.');
    }

    const filePath = `${pathPrefix}/${userId}/${Date.now()}_${fileName}`;

    // Uploading as blob directly
    const fileUri = FileSystem.cacheDirectory + fileName;
    await FileSystem.copyAsync({ from: uri, to: fileUri });

    const response = await fetch(fileUri);
    const blob = await response.blob();

    const storageRef = ref(storage, filePath);
    await uploadBytes(storageRef, blob);

    const url = await getDownloadURL(storageRef);

    return { url, path: filePath };
  } catch (err) {
    console.error('File upload failed:', err.message);
    throw new Error('Upload failed: ' + err.message);
  }
};

/**
 * Simple helper for AvatarSelector.js to upload images easily
 * Assumes userId is stored in AsyncStorage as 'repz_user_profile'
 */
export const uploadImageAsync = async (uri) => {
  try {
    const raw = await AsyncStorage.getItem('repz_user_profile');
    const parsed = raw ? JSON.parse(raw) : null;
    const userId = parsed?.id || parsed?.userId;
    if (!userId) throw new Error('No user ID found in local storage.');

    const { url } = await uploadFile({
      uri,
      type: 'image',
      userId,
      pathPrefix: 'profile-pictures',
    });

    return url;
  } catch (err) {
    console.error('uploadImageAsync failed:', err.message);
    return null;
  }
};
