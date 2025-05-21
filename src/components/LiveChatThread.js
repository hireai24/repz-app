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
import { db } from "../firebase/firebaseClient"; // ✅ FIXED: Now using frontend-safe Firebase client
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
      orderBy("createdAt", "asc")
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
          <Text style={styles.message}>
            <Text style={styles.sender}>{item.sender}:</Text> {item.text}
          </Text>
        )}
      />
      <View style={styles.inputRow}>
        <TextInput
          placeholder="Type message..."
          value={text}
          onChangeText={setText}
          style={styles.input}
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    maxHeight: 200,
  },
  message: {
    ...typography.body,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  sender: {
    fontWeight: "bold",
    color: colors.primary,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: "#f4f4f4",
    padding: spacing.sm,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  sendButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 6,
  },
  sendText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default LiveChatThread;
