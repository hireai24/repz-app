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
const maxSizeMB = 100;
const maxRetries = 3;

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
      `File exceeds ${maxSizeMB}MB limit. Current: ${fileSizeMB.toFixed(2)}MB`
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
      `Unsupported file type: ${mimeType}. Only JPEG, PNG, MP4, MOV allowed.`
    );
  }

  const filePath = `${pathPrefix}/${userId}/${Date.now()}_${fileName}`;
  const tempPath = FileSystem.cacheDirectory + fileName;

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
            console.warn(`Upload attempt ${attempt + 1} failed:`, error);
            attempt++;
            if (attempt >= maxRetries) {
              reject(new Error("Upload failed after multiple attempts"));
            }
          },
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({ url, path: filePath });
          }
        );
      });
    } catch (err) {
      console.error("Upload retry failed:", err.message);
      attempt++;
    }
  }

  throw new Error("Upload failed after all retries.");
};

export const uploadImageAsync = async (uri) => {
  try {
    const raw = await AsyncStorage.getItem("repz_user_profile");
    const parsed = raw ? JSON.parse(raw) : null;
    const userId = parsed?.id || parsed?.userId;

    if (!userId || typeof userId !== "string") {
      throw new Error("No valid user ID found in local storage.");
    }

    const { url } = await uploadFile({
      uri,
      type: "image",
      userId,
      pathPrefix: "profile-pictures",
    });

    return url;
  } catch (err) {
    console.error("uploadImageAsync failed:", err.message || err);
    return null;
  }
};
