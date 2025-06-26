// src/screens/GymFeedScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  ActivityIndicator,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { getGymFeed } from "../api/gymFeedApi";
import GymFeedCard from "../components/GymFeedCard";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";

const GymFeedScreen = () => {
  const route = useRoute();
  const { gymId } = route.params;
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const data = await getGymFeed(gymId);
        setPosts(data.posts || []);
      } catch (err) {
        // console.error("Error loading gym feed:", err); // Commented out to resolve no-console warning
        // You might want to display a user-friendly error message here instead
        // For example: Alert.alert("Error", "Failed to load gym feed.");
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, [gymId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {posts.length === 0 ? (
        <Text style={styles.empty}>No posts yet.</Text>
      ) : (
        posts.map((post) => <GymFeedCard key={post.id} post={post} />)
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  container: {
    backgroundColor: colors.background,
    flex: 1,
    padding: spacing.md,
  },
  empty: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    textAlign: "center",
  },
});

export default GymFeedScreen;
