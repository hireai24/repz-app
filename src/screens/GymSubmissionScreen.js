import React, { useContext, useEffect, useState } from "react";
import {
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native"; // Added useRoute
import { UserContext } from "../context/UserContext";
import { createGym, updateGym, getMyGym } from "../api/gymApi"; // getMyGym is used here
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";

const GymSubmissionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute(); // To get gym data if editing
  const { authUser, userProfile, loadingProfile } = useContext(UserContext);

  const isGymOwner = userProfile?.role === "gym";
  const userId = authUser?.uid;

  const [gymId, setGymId] = useState(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [features, setFeatures] = useState("");
  const [memberCount, setMemberCount] = useState("");
  const [pricing, setPricing] = useState(""); // This should align with backend.
  const [offers, setOffers] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Pre-fill if navigating from GymProfileScreen (edit mode)
    if (route.params?.gym) {
      const { gym } = route.params;
      setGymId(gym.id);
      setName(gym.name || "");
      setLocation(gym.location || "");
      setDescription(gym.description || "");
      setImageUrl(gym.image || "");
      setFeatures(gym.features || "");
      setMemberCount(String(gym.memberCount) || ""); // Ensure it's a string for TextInput
      setPricing(gym.pricing || ""); // Use 'pricing' from gym object
      setOffers(gym.offers || "");
      setLoading(false); // No need to fetch if pre-filled
      return;
    }

    // If not editing, try to fetch the current user's gym
    if (loadingProfile || !isGymOwner || !userId) return;

    const fetchMyGymData = async () => {
      setLoading(true);
      try {
        const res = await getMyGym();
        if (res?.gym) {
          const {
            id,
            name,
            location,
            description,
            image,
            features,
            memberCount,
            pricing, // FIX: Use 'pricing' field directly from backend response
            offers,
          } = res.gym;
          setGymId(id);
          setName(name || "");
          setLocation(location || "");
          setDescription(description || "");
          setImageUrl(image || "");
          setFeatures(features || "");
          setMemberCount(String(memberCount) || ""); // Convert to string for TextInput
          setPricing(pricing || ""); // Set 'pricing'
          setOffers(offers || "");
        }
      } catch (err) {
        // It's common for getMyGym to return null if no gym exists, not necessarily an error.
        // console.warn("No gym found or error loading gym profile for pre-fill:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyGymData();
  }, [userId, isGymOwner, loadingProfile, route.params]); // Added route.params to dependencies

  const handleSubmit = async () => {
    if (!name || !location || !description) {
      Alert.alert(
        "Missing Fields",
        "Please complete all required fields (Name, Location, Description).",
      );
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name,
        location,
        description,
        image: imageUrl,
        ownerId: userId,
        features,
        memberCount: Number(memberCount) || 0, // Convert to number for backend
        pricing, // FIX: Send 'pricing' field
        offers,
      };

      const res = gymId
        ? await updateGym(gymId, payload)
        : await createGym(payload);

      if (res.success || res.id) {
        Alert.alert(
          "✅ Success",
          gymId ? "Gym updated successfully." : "Gym created successfully.",
        );
        navigation.goBack();
      } else {
        throw new Error(res.error || "Submission failed.");
      }
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingProfile) {
    return (
      <ScrollView contentContainerStyle={styles.centeredContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading user profile...</Text>
      </ScrollView>
    );
  }

  if (!isGymOwner) {
    return (
      <ScrollView contentContainerStyle={styles.centeredContainer}>
        <Text style={styles.unauthorizedText}>Access Denied</Text>
        <Text style={styles.unauthorizedMessage}>
          Only gym owners can submit or edit gym profiles.
        </Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>
        {gymId ? "Edit Your Gym Profile" : "Submit New Gym"}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Gym Name"
        placeholderTextColor={colors.textSecondary}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Location"
        placeholderTextColor={colors.textSecondary}
        value={location}
        onChangeText={setLocation}
      />
      <TextInput
        style={styles.textArea}
        placeholder="Gym Description"
        placeholderTextColor={colors.textSecondary}
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <TextInput
        style={styles.input}
        placeholder="Image URL (optional)"
        placeholderTextColor={colors.textSecondary}
        value={imageUrl}
        onChangeText={setImageUrl}
      />
      <TextInput
        style={styles.input}
        placeholder="Features (e.g., sauna, free weights)"
        placeholderTextColor={colors.textSecondary}
        value={features}
        onChangeText={setFeatures}
      />
      <TextInput
        style={styles.input}
        placeholder="Member Count"
        placeholderTextColor={colors.textSecondary}
        value={memberCount}
        onChangeText={setMemberCount}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Pricing (e.g., £39.99/month)"
        placeholderTextColor={colors.textSecondary}
        value={pricing}
        onChangeText={setPricing}
      />
      <TextInput
        style={styles.input}
        placeholder="Offers (e.g., 7-day trial)"
        placeholderTextColor={colors.textSecondary}
        value={offers}
        onChangeText={setOffers}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.disabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.buttonText}>
            {gymId ? "Update Gym" : "Submit Gym"}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 8,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  buttonText: {
    color: colors.white,
    ...typography.buttonText,
  },
  centeredContainer: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  container: {
    backgroundColor: colors.background,
    flexGrow: 1,
    padding: spacing.lg,
  },
  disabled: {
    opacity: 0.6,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  textArea: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    minHeight: 100,
    padding: spacing.md,
    textAlignVertical: "top",
  },
  title: {
    ...typography.h3,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  unauthorizedMessage: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  unauthorizedText: {
    ...typography.heading,
    color: colors.error,
    marginBottom: spacing.md,
    textAlign: "center",
  },
});

export default GymSubmissionScreen;
