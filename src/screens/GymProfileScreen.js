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
import { getMyGym } from "../api/gymApi"; // FIX: Correct function name
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
        // Use the correct gymApi function to fetch the user's own gym
        const myGymRes = await getMyGym();

        if (myGymRes && myGymRes.gym) {
          setEditableGym(myGymRes.gym);
          if (myGymRes.gym.id) {
            const feed = await getGymFeed(myGymRes.gym.id);
            setFeedItems(feed.posts || []);
          }
        } else if (passedGym) {
          setEditableGym(null); // Not the owner, so editableGym is null
        }
      } catch (err) {
        // Optionally: Display user-friendly error
      } finally {
        setLoading(false);
      }
    };

    // If a gym is passed via route params, fetch feed for it.
    // Always also try fetchData to see if this gym is owned by the user.
    if (passedGym) {
      const fetchFeedForPassedGym = async () => {
        setLoading(true);
        try {
          const feed = await getGymFeed(passedGym.id);
          setFeedItems(feed.posts || []);
        } catch (err) {
          // Optionally: Handle error
        } finally {
          setLoading(false);
        }
      };
      fetchData(); // Always check if the passed gym is the user's (for edit access)
      fetchFeedForPassedGym();
    } else {
      fetchData();
    }
  }, [passedGym]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading gym profile...</Text>
      </View>
    );
  }

  // Determine which gym to display: the one passed in params or the editable one fetched.
  const gym = passedGym || editableGym;
  // Is the currently displayed gym the user's own (editable)?
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
        <Text style={styles.meta}>👥 Members: {gym.memberCount}</Text>
      )}
      {gym.pricing && (
        <Text style={styles.meta}>💸 Pricing: {gym.pricing}</Text>
      )}
      {gym.offers && <Text style={styles.meta}>🎁 Offers: {gym.offers}</Text>}

      {isEditable && (
        <>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate("GymSubmissionScreen", { gym })}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.feedButton}
            onPress={() =>
              navigation.navigate("GymFeedEditorScreen", { gymId: gym.id })
            }
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
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: "center",
  },
  container: {
    alignItems: "center",
    backgroundColor: colors.background,
    flexGrow: 1,
    padding: spacing.lg,
  },
  description: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  editButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  editButtonText: {
    color: colors.white,
    ...typography.buttonText,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
  },
  feedButton: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  feedButtonText: {
    color: colors.white,
    ...typography.buttonText,
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
  image: {
    borderRadius: 12,
    height: 180,
    marginBottom: spacing.md,
    width: "100%",
  },
  imagePlaceholder: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    height: 180,
    justifyContent: "center",
    marginBottom: spacing.md,
    width: "100%",
  },
  imagePlaceholderText: {
    color: colors.textSecondary,
    ...typography.body,
  },
  loadingText: {
    marginTop: spacing.md,
    ...typography.body,
    color: colors.textSecondary,
  },
  location: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  meta: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  name: {
    ...typography.heading2,
    color: colors.textPrimary,
    textAlign: "center",
  },
});

export default GymProfileScreen;
