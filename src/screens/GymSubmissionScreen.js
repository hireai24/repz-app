// src/screens/GymSubmissionScreen.js

import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { UserContext } from "../context/UserContext";
import { createGym, updateGym, getMyGym } from "../api/gymApi";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";

const GymSubmissionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
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
  const [pricing, setPricing] = useState("");
  const [offers, setOffers] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (route.params?.gym) {
      const { gym } = route.params;
      setGymId(gym.id);
      setName(gym.name || "");
      setLocation(gym.location || "");
      setDescription(gym.description || "");
      setImageUrl(gym.image || "");
      setFeatures(gym.features || "");
      setMemberCount(String(gym.memberCount || ""));
      setPricing(gym.pricing || "");
      setOffers(gym.offers || "");
      return;
    }

    if (loadingProfile || !isGymOwner || !userId) return;

    const fetchMyGymData = async () => {
      setLoading(true);
      try {
        const res = await getMyGym();
        if (res?.gym) {
          const g = res.gym;
          setGymId(g.id);
          setName(g.name || "");
          setLocation(g.location || "");
          setDescription(g.description || "");
          setImageUrl(g.image || "");
          setFeatures(g.features || "");
          setMemberCount(String(g.memberCount || ""));
          setPricing(g.pricing || "");
          setOffers(g.offers || "");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMyGymData();
  }, [userId, isGymOwner, loadingProfile, route.params]);

  const handleSubmit = async () => {
    if (!name || !location || !description) {
      Alert.alert(
        "Missing Fields",
        "Please complete all required fields (Name, Location, Description)."
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
        memberCount: Number(memberCount) || 0,
        pricing,
        offers,
      };

      const res = gymId
        ? await updateGym(gymId, payload)
        : await createGym(payload);

      if (res.success || res.id) {
        Alert.alert(
          "✅ Success",
          gymId ? "Gym updated successfully." : "Gym created successfully."
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
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  if (!isGymOwner) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.unauthorizedTitle}>Access Denied</Text>
        <Text style={styles.unauthorizedMessage}>
          Only verified gym owners can submit or edit gym profiles.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>
        {gymId ? "Edit Your Gym Profile" : "Submit New Gym"}
      </Text>

      <Text style={styles.sectionHeader}>Basic Information</Text>
      <TextInput
        style={styles.input}
        placeholder="Gym Name *"
        placeholderTextColor={colors.textSecondary}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Location *"
        placeholderTextColor={colors.textSecondary}
        value={location}
        onChangeText={setLocation}
      />
      <TextInput
        style={styles.textArea}
        placeholder="Description *"
        placeholderTextColor={colors.textSecondary}
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Text style={styles.sectionHeader}>Visuals</Text>
      <TextInput
        style={styles.input}
        placeholder="Banner Image URL"
        placeholderTextColor={colors.textSecondary}
        value={imageUrl}
        onChangeText={setImageUrl}
      />
      {imageUrl !== "" && (
        <Image
          source={{ uri: imageUrl }}
          style={styles.previewImage}
          resizeMode="cover"
        />
      )}

      <Text style={styles.sectionHeader}>Details</Text>
      <TextInput
        style={styles.input}
        placeholder="Features (e.g., Sauna, Free Weights)"
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
        placeholder="Special Offers"
        placeholderTextColor={colors.textSecondary}
        value={offers}
        onChangeText={setOffers}
      />

      <TouchableOpacity
        style={[styles.submitBtn, loading && styles.disabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.textOnPrimary} />
        ) : (
          <Text style={styles.submitText}>
            {gymId ? "Update Gym" : "Submit Gym"}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flexGrow: 1,
    padding: spacing.lg,
  },
  centeredContainer: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.heading2,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  sectionHeader: {
    ...typography.label,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    color: colors.textPrimary,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  textArea: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    color: colors.textPrimary,
    minHeight: 100,
    padding: spacing.md,
    marginBottom: spacing.md,
    textAlignVertical: "top",
  },
  previewImage: {
    width: "100%",
    height: 180,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  submitBtn: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 8,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  submitText: {
    color: colors.textOnPrimary,
    fontWeight: "bold",
    fontSize: 16,
  },
  disabled: {
    opacity: 0.6,
  },
  loadingText: {
    ...typography.body,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  unauthorizedTitle: {
    ...typography.heading2,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  unauthorizedMessage: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
});

export default GymSubmissionScreen;
