import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  FlatList,
  Text,
  StyleSheet,
  TouchableOpacity,
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
import { useUser } from "../context/UserContext";

const LiveChatThread = ({ challengeId }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const { user } = useUser();

  useEffect(() => {
    const q = query(
      collection(db, "challengeChats", challengeId, "messages"),
      orderBy("createdAt", "asc"),
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(data);
    });

    return () => unsub();
  }, [challengeId]);

  const sendMessage = async () => {
    if (!text.trim()) return;
    await addDoc(collection(db, "challengeChats", challengeId, "messages"), {
      text: text.trim(),
      createdAt: Timestamp.now(),
      sender: user.username || "Anonymous",
    });
    setText("");
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Text
            style={styles.message}
            accessibilityLabel={`Message from ${item.sender}`}
          >
            <Text style={styles.sender}>{item.sender}:</Text> {item.text}
          </Text>
        )}
        accessibilityRole="list"
        accessibilityLabel="Live chat messages"
      />
      <View style={styles.inputRow}>
        <TextInput
          placeholder="Type message..."
          value={text}
          onChangeText={setText}
          style={styles.input}
          accessibilityLabel="Type your message"
        />
        <TouchableOpacity
          onPress={sendMessage}
          style={styles.sendButton}
          accessibilityRole="button"
          accessibilityLabel="Send chat message"
        >
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

LiveChatThread.propTypes = {
  challengeId: PropTypes.string.isRequired,
};

const styles = StyleSheet.create({
  container: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    marginTop: spacing.lg,
    maxHeight: 200,
    paddingTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: 6,
    flex: 1,
    marginRight: spacing.sm,
    padding: spacing.sm,
  },
  inputRow: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: spacing.sm,
  },
  message: {
    ...typography.body,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sendText: {
    color: colors.white,
    fontWeight: "bold",
  },
  sender: {
    color: colors.primary,
    fontWeight: "bold",
  },
});

export default LiveChatThread;
