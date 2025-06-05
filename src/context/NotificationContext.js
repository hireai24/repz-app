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
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseClient";
import { UserContext } from "./UserContext";

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { userId } = useContext(UserContext);
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const registerForPushNotificationsAsync = async () => {
      if (!Device.isDevice) {
        return null;
      }

      let token;
      try {
        const { status: existingStatus } =
          await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== "granted") {
          return null;
        }

        token = (await Notifications.getExpoPushTokenAsync()).data;
        setExpoPushToken(token);

        return token;
      } catch (error) {
        // Log error in dev only if needed
        // (no-console for lint)
        return null;
      }
    };

    const setupAndSaveToken = async () => {
      const token = await registerForPushNotificationsAsync();
      if (token && userId) {
        try {
          await setDoc(
            doc(db, "users", userId),
            {
              expoPushToken: token,
            },
            { merge: true },
          );
        } catch (error) {
          // Log error in dev only if needed
        }
      }
    };

    setupAndSaveToken();

    const notificationReceivedListener =
      Notifications.addNotificationReceivedListener((notif) => {
        setNotification(notif);
      });

    const notificationResponseListener =
      Notifications.addNotificationResponseReceivedListener(() => {
        // Optional: handle notification tap if needed
      });

    return () => {
      Notifications.removeNotificationSubscription(
        notificationReceivedListener,
      );
      Notifications.removeNotificationSubscription(
        notificationResponseListener,
      );
    };
  }, [userId]);

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
    } catch (error) {
      // Log error in dev only if needed
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
