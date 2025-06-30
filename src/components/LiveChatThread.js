// src/components/LiveChatThread.js

import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  FlatList,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import PropTypes from "prop-types";

import { db } from "../firebase/firebaseClient";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";
import shadows from "../theme/shadows";
import { useUser } from "../context/UserContext";

import avatarFallback from "../assets/avatars/avatar1.png";
import LinearGradient from "react-native-linear-gradient";

const LiveChatThread = ({ challengeId }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const { user } = useUser();

  useEffect(() => {
    const q = query(
      collection(db, "challengeChats", challengeId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(data);
    });

    return () => unsubscribe();
  }, [challengeId]);

  const sendMessage = async () => {
    if (!text.trim()) return;

    const message = text.trim();

    await addDoc(collection(db, "challengeChats", challengeId, "messages"), {
      text: message,
      createdAt: Timestamp.now(),
      sender: user?.username || "Anonymous",
    });

    try {
      await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId,
          sender: user?.username || "Anonymous",
          message,
        }),
      });
    } catch (err) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error("Notification push failed:", err);
      }
    }

    setText("");
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.messageRow}>
            <Image
              source={avatarFallback}
              style={styles.avatar}
              accessibilityLabel="Sender avatar"
            />
            <View style={styles.bubble}>
              <Text style={styles.sender}>{item.sender}</Text>
              <Text style={styles.message}>{item.text}</Text>
            </View>
          </View>
        )}
        accessibilityRole="list"
        accessibilityLabel="Live chat messages"
        contentContainerStyle={styles.listContent}
      />
      <View style={styles.inputRow}>
        <TextInput
          placeholder="Type message..."
          value={text}
          onChangeText={setText}
          style={styles.input}
          placeholderTextColor={colors.textSecondary}
          accessibilityLabel="Type your message"
        />
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.sendButton}
        >
          <TouchableOpacity
            onPress={sendMessage}
            accessibilityRole="button"
            accessibilityLabel="Send chat message"
          >
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </View>
  );
};

LiveChatThread.propTypes = {
  challengeId: PropTypes.string.isRequired,
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.glassBackground,
    borderRadius: spacing.radiusXl,
    padding: spacing.spacing3,
    marginTop: spacing.spacing5,
    ...shadows.shadow3,
    maxHeight: 300,
  },
  listContent: {
    paddingBottom: spacing.spacing3,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.spacing3,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: spacing.radiusFull,
    marginRight: spacing.spacing3,
  },
  bubble: {
    backgroundColor: colors.cardBackground,
    borderRadius: spacing.radiusLg,
    paddingVertical: spacing.spacing2,
    paddingHorizontal: spacing.spacing3,
    maxWidth: "80%",
    ...shadows.shadow1,
  },
  sender: {
    ...typography.smallBold,
    color: colors.accentBlue,
    marginBottom: 2,
  },
  message: {
    ...typography.body,
    color: colors.textPrimary,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.spacing3,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: spacing.radiusFull,
    flex: 1,
    paddingVertical: spacing.spacing3,
    paddingHorizontal: spacing.spacing4,
    ...typography.body,
    color: colors.textPrimary,
  },
  sendButton: {
    borderRadius: spacing.radiusFull,
    marginLeft: spacing.spacing2,
  },
  sendText: {
    ...typography.smallBold,
    color: colors.textOnPrimary,
    paddingVertical: spacing.spacing3,
    paddingHorizontal: spacing.spacing5,
  },
});

export default LiveChatThread;
