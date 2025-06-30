// src/screens/GymFeedScreen.js

import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { getGymFeed, getGymDetails } from "../api/gymFeedApi";
import GymFeedCard from "../components/GymFeedCard";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";

const GymFeedScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { gymId } = route.params;

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gym, setGym] = useState(null);

  useEffect(() => {
    const fetchFeedAndDetails = async () => {
      try {
        const [feedData, gymData] = await Promise.all([
          getGymFeed(gymId),
          getGymDetails(gymId),
        ]);
        setPosts(feedData.posts || []);
        setGym(gymData.gym || null);
      } catch {
        // Optionally handle errors here
      } finally {
        setLoading(false);
      }
    };
    fetchFeedAndDetails();
  }, [gymId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {gym && (
        <View>
          <View style={styles.bannerWrapper}>
            <Image
              source={
                gym.banner
                  ? { uri: gym.banner }
                  : require("../assets/gymFeed/cover1.png")
              }
              style={styles.banner}
            />
            <View style={styles.overlay} />
            <View style={styles.bannerContent}>
              <Image
                source={
                  gym.logo
                    ? { uri: gym.logo }
                    : require("../assets/gymFeed/gym-icon.png")
                }
                style={styles.avatar}
              />
              <View style={styles.gymInfo}>
                <Text style={styles.gymName}>{gym.name}</Text>
                <TouchableOpacity
                  style={styles.joinBtn}
                  onPress={() => navigation.navigate("JoinGym", { gymId })}
                  accessibilityRole="button"
                  accessibilityLabel={`Join ${gym.name}`}
                >
                  <Text style={styles.joinText}>{`Join Gym`}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}

      {posts.length === 0 ? (
        <Text style={styles.empty}>{`No posts yet.`}</Text>
      ) : (
        posts.map((post) => (
          <View key={post.id} style={styles.postWrapper}>
            <GymFeedCard post={post} />
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bannerWrapper: {
    position: "relative",
    height: 240,
    marginBottom: spacing.lg,
  },
  banner: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  bannerContent: {
    position: "absolute",
    bottom: spacing.md,
    left: spacing.md,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: colors.white,
    backgroundColor: colors.surface,
  },
  gymInfo: {
    marginLeft: spacing.md,
  },
  gymName: {
    ...typography.heading3,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  joinBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  joinText: {
    color: colors.textOnPrimary,
    fontWeight: "600",
  },
  empty: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginVertical: spacing.xl,
  },
  postWrapper: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
});

export default GymFeedScreen;
