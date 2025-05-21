import React, { createContext, useEffect, useState, useContext, useMemo } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseClient"; // ✅ FIXED IMPORT
import { UserContext } from "./UserContext";

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { userId } = useContext(UserContext);
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const setupNotifications = async () => {
      if (!Device.isDevice) return;

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      const finalStatus = existingStatus === "granted"
        ? existingStatus
        : (await Notifications.requestPermissionsAsync()).status;

      if (finalStatus !== "granted") {
        console.warn("Permission for push notifications not granted.");
        return;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync();
      const token = tokenData?.data;
      if (!token) return;

      setExpoPushToken(token);

      // Save token to Firestore
      if (userId) {
        try {
          await updateDoc(doc(db, "users", userId), {
            expoPushToken: token,
          });
        } catch (err) {
          console.error("Failed to save Expo push token to Firestore", err);
        }
      }
    };

    setupNotifications();
  }, [userId]);

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((notif) => {
      setNotification(notif);
    });

    return () => subscription.remove();
  }, []);

  const sendLocalNotification = async ({ title, body, data = {} }) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: "default",
        },
        trigger: null,
      });
    } catch (err) {
      console.error("Failed to trigger local notification", err);
    }
  };

  const value = useMemo(
    () => ({
      expoPushToken,
      latestNotification: notification,
      sendLocalNotification,
    }),
    [expoPushToken, notification]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
