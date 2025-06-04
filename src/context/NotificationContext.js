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
import { doc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseClient"; // Assuming db is a named export from firebaseClient
import { UserContext } from "./UserContext";

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { userId } = useContext(UserContext);
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [notification, setNotification] = useState(null); // latest received notification

  useEffect(() => {
    const registerForPushNotificationsAsync = async () => {
      if (!Device.isDevice) {
        // console.log("Not on a physical device. Skipping push notification setup."); // For dev debugging
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
          // console.log("Failed to get push token for push notification!"); // For dev debugging
          return null; // Silently ignore in production as per original intent
        }

        token = (await Notifications.getExpoPushTokenAsync()).data;
        // console.log("Expo Push Token:", token); // For dev debugging
        setExpoPushToken(token);

        return token;
      } catch (error) {
        console.error("Error getting Expo push token:", error); // Log actual error in dev
        return null;
      }
    };

    const setupAndSaveToken = async () => {
      const token = await registerForPushNotificationsAsync();
      if (token && userId) {
        try {
          // Use setDoc with merge: true to create the user document if it doesn't exist
          // or update it if it does, without overwriting existing fields.
          await setDoc(doc(db, "users", userId), {
            expoPushToken: token,
          }, { merge: true });
          // console.log("Expo Push Token saved to Firestore for user:", userId); // For dev debugging
        } catch (error) {
          console.error("Error saving Expo push token to Firestore:", error); // Log actual error in dev
        }
      }
    };

    // Trigger setup and token saving when userId changes or component mounts
    setupAndSaveToken();

    // Listener for notifications received while the app is in foreground
    const notificationReceivedListener =
      Notifications.addNotificationReceivedListener((notif) => {
        setNotification(notif);
        // console.log("Notification received (foreground):", notif); // For dev debugging
      });

    // Listener for user interacting with a notification (e.g., tapping it)
    const notificationResponseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        // console.log("Notification tapped/interacted with:", response); // For dev debugging
        // You can add navigation logic here based on response.notification.request.content.data
      });

    return () => {
      // Clean up listeners on component unmount
      Notifications.removeNotificationSubscription(notificationReceivedListener);
      Notifications.removeNotificationSubscription(notificationResponseListener);
    };
  }, [userId]); // Dependency array: Re-run when userId changes

  const sendLocalNotification = async ({ title, body, data = {} }) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: "default", // You might want a custom sound
        },
        trigger: null, // Send immediately
      });
      // console.log("Local notification sent:", title); // For dev debugging
    } catch (error) {
      console.error("Error sending local notification:", error); // Log actual error in dev
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