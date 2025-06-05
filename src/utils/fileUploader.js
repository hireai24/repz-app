import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { storage } from "../firebase/firebaseClient";

const allowedTypes = [
  "image/jpeg",
  "image/png",
  "video/mp4",
  "video/quicktime",
];
const maxSizeMB = 100; // Increased limit for videos, adjust as needed
const maxRetries = 3;

/**
 * Upload a file (image or video) to Firebase Storage.
 * @param {Object} params
 * @param {string} params.uri - Local file URI
 * @param {string} params.type - 'image' or 'video'
 * @param {string} params.userId - User ID for file path
 * @param {string} params.pathPrefix - Path prefix in storage bucket
 * @param {function} [params.onProgress] - Progress callback (0–1)
 * // REMOVED: endpoint parameter as it was unused and misleading
 */
export const uploadFile = async ({
  uri,
  type = "image",
  userId,
  pathPrefix = "uploads",
  onProgress,
}) => {
  if (!uri || !userId) {
    throw new Error("Missing required parameters: uri or userId");
  }

  const fileInfo = await FileSystem.getInfoAsync(uri);
  if (!fileInfo.exists) throw new Error("File does not exist at URI: " + uri);

  const fileSizeMB = fileInfo.size / (1024 * 1024);
  if (fileSizeMB > maxSizeMB) {
    throw new Error(
      `File exceeds ${maxSizeMB}MB limit. Current: ${fileSizeMB.toFixed(2)}MB`,
    );
  }

  const fileName = uri.split("/").pop();
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const mimeMap = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    heic: "image/heic",
    heif: "image/heif",
    mp4: "video/mp4",
    mov: "video/quicktime",
  };
  const mimeType = mimeMap[ext] || `${type}/*`;

  if (!allowedTypes.includes(mimeType)) {
    throw new Error(
      `Unsupported file type: ${mimeType}. Only JPEG, PNG, MP4, MOV allowed.`,
    );
  }

  const filePath = `${pathPrefix}/${userId}/${Date.now()}_${fileName}`;
  const tempPath = FileSystem.cacheDirectory + fileName;

  // ✅ Expo-safe file copy and blob conversion
  await FileSystem.copyAsync({ from: uri, to: tempPath });
  const blob = await fetch(tempPath).then((res) => res.blob());

  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const storageRef = ref(storage, filePath);
      const uploadTask = uploadBytesResumable(storageRef, blob);

      return await new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            if (onProgress && typeof onProgress === "function") {
              const progress = snapshot.bytesTransferred / snapshot.totalBytes;
              onProgress(progress);
            }
          },
          (error) => {
            // eslint-disable-next-line no-console
            console.warn(`Upload attempt ${attempt + 1} failed:`, error);
            attempt++;
            if (attempt >= maxRetries) {
              reject(new Error("Upload failed after multiple attempts"));
            }
          },
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({ url, path: filePath });
          },
        );
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Upload retry failed:", err.message);
      attempt++;
    }
  }

  throw new Error("Upload failed after all retries.");
};

/**
 * Quick upload utility for user profile images.
 * Reads userId from AsyncStorage.
 */
export const uploadImageAsync = async (uri) => {
  try {
    const raw = await AsyncStorage.getItem("repz_user_profile");
    const parsed = raw ? JSON.parse(raw) : null;
    const userId = parsed?.id || parsed?.userId;

    if (!userId) throw new Error("No user ID found in local storage.");

    const { url } = await uploadFile({
      uri,
      type: "image",
      userId,
      pathPrefix: "profile-pictures",
    });

    return url;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("uploadImageAsync failed:", err.message || err);
    return null;
  }
};
