import React, {
  createContext,
  useEffect,
  useState,
  useContext,
  useMemo,
} from "react";
import PropTypes from "prop-types";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseClient";
import { UserContext } from "./UserContext";

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { userId } = useContext(UserContext);
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const setupNotifications = async () => {
      if (!Device.isDevice) return;

      try {
        const { status: existingStatus } =
          await Notifications.getPermissionsAsync();
        const finalStatus =
          existingStatus === "granted"
            ? existingStatus
            : (await Notifications.requestPermissionsAsync()).status;

        if (finalStatus !== "granted") {
          // Silently ignore denied permission in production
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
          } catch {
            // Silently ignore Firestore update errors in production
          }
        }
      } catch {
        // Silently ignore notification setup errors in production
      }
    };

    setupNotifications();
  }, [userId]);

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      (notif) => {
        setNotification(notif);
      },
    );

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
    } catch {
      // Silently ignore errors when sending local notifications
    }
  };

  const value = useMemo(
    () => ({
      expoPushToken,
      latestNotification: notification,
      sendLocalNotification,
    }),
    [expoPushToken, notification],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
