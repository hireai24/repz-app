import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

import { getMyGym } from "../api/gymApi";
import { getGymFeed } from "../api/gymFeedApi";
import GymFeedCard from "../components/GymFeedCard";

import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";

const GymProfileScreen = ({ route }) => {
  const { gym: passedGym } = route.params || {};
  const navigation = useNavigation();

  const [editableGym, setEditableGym] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedItems, setFeedItems] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const myGymRes = await getMyGym();
        if (myGymRes?.gym) {
          setEditableGym(myGymRes.gym);
          if (myGymRes.gym.id) {
            const feed = await getGymFeed(myGymRes.gym.id);
            setFeedItems(feed.posts || []);
          }
        } else if (passedGym?.id) {
          const feed = await getGymFeed(passedGym.id);
          setFeedItems(feed.posts || []);
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [passedGym]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading gym profile...</Text>
      </View>
    );
  }

  const gym = passedGym || editableGym;
  const isEditable = editableGym && gym && editableGym.id === gym.id;

  if (!gym) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Gym profile not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {gym.image ? (
        <Image source={{ uri: gym.image }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderText}>No Image</Text>
        </View>
      )}

      <Text style={styles.name}>{gym.name || "Unnamed Gym"}</Text>
      <Text style={styles.location}>
        {gym.location || "No location listed"}
      </Text>
      <Text style={styles.description}>
        {gym.description || "No description provided."}
      </Text>

      {gym.features && (
        <Text style={styles.meta}>🏋️ Features: {gym.features}</Text>
      )}
      {gym.memberCount && (
        <Text style={styles.meta}>
          👥 Members: {gym.memberCount}
        </Text>
      )}
      {gym.pricing && (
        <Text style={styles.meta}>💸 Pricing: {gym.pricing}</Text>
      )}
      {gym.offers && (
        <Text style={styles.meta}>🎁 Offers: {gym.offers}</Text>
      )}

      {isEditable && (
        <>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate("GymSubmissionScreen", { gym })}
            accessibilityRole="button"
            accessibilityLabel="Edit Gym Profile"
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.feedButton}
            onPress={() =>
              navigation.navigate("GymFeedEditorScreen", { gymId: gym.id })
            }
            accessibilityRole="button"
            accessibilityLabel="Add Gym Feed Post"
          >
            <Text style={styles.feedButtonText}>Add Feed Post</Text>
          </TouchableOpacity>
        </>
      )}

      {feedItems.length > 0 && (
        <View style={styles.feedContainer}>
          <Text style={styles.feedHeading}>📣 Latest Gym Posts</Text>
          {feedItems.map((item) => (
            <GymFeedCard key={item.id} post={item} />
          ))}
        </View>
      )}
    </ScrollView>
  );
};

GymProfileScreen.propTypes = {
  route: PropTypes.shape({
    params: PropTypes.shape({
      gym: PropTypes.shape({
        id: PropTypes.string,
        image: PropTypes.string,
        name: PropTypes.string,
        location: PropTypes.string,
        description: PropTypes.string,
        features: PropTypes.string,
        memberCount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        pricing: PropTypes.string,
        offers: PropTypes.string,
      }),
    }),
  }),
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  container: {
    backgroundColor: colors.background,
    flexGrow: 1,
    padding: spacing.lg,
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  imagePlaceholder: {
    width: "100%",
    height: 180,
    backgroundColor: colors.surface,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  imagePlaceholderText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  name: {
    ...typography.heading2,
    color: colors.textPrimary,
    textAlign: "center",
  },
  location: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  description: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  meta: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  editButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  editButtonText: {
    color: colors.textOnPrimary,
    fontWeight: "bold",
  },
  feedButton: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  feedButtonText: {
    color: colors.textOnPrimary,
    fontWeight: "bold",
  },
  feedContainer: {
    marginTop: spacing.lg,
    width: "100%",
  },
  feedHeading: {
    ...typography.heading3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});

export default GymProfileScreen;
