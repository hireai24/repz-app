// src/components/AvatarSelector.js
import React, { useMemo } from "react";
import PropTypes from "prop-types";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";

import avatars from "../assets/avatars";
import { uploadImageAsync } from "../utils/fileUploader";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";
import shadows from "../theme/shadow";

const AvatarSelector = ({ selectedAvatar, onSelect }) => {
  const isCustomSelected = selectedAvatar?.profilePicture;

  const avatarItems = useMemo(() => {
    if (!Array.isArray(avatars)) return [];

    return avatars.map((avatar, index) => {
      const isSelected = selectedAvatar?.avatar === index;

      const handleAvatarSelect = () => {
        onSelect({ avatar: index });
      };

      return (
        <TouchableOpacity
          key={index}
          accessible
          accessibilityRole="imagebutton"
          accessibilityLabel={`Avatar ${index + 1}`}
          accessibilityState={{ selected: isSelected }}
          style={[
            styles.avatarWrap,
            isSelected && styles.avatarSelected,
          ]}
          onPress={handleAvatarSelect}
        >
          <Image source={avatar} style={styles.avatar} />
        </TouchableOpacity>
      );
    });
  }, [selectedAvatar, onSelect]);

  const handleImageUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && (result.assets?.[0]?.uri || result.uri)) {
        const uploadedUrl = await uploadImageAsync(
          result.assets?.[0]?.uri || result.uri
        );
        if (uploadedUrl) {
          onSelect({ profilePicture: uploadedUrl });
        }
      }
    } catch (err) {
      Alert.alert(
        "Upload Failed",
        "There was a problem selecting or uploading your image. Please try again."
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Your Avatar</Text>
      <View style={styles.avatarRow}>
        <TouchableOpacity
          accessible
          accessibilityRole="imagebutton"
          accessibilityLabel="Upload custom avatar"
          style={[
            styles.avatarWrap,
            styles.uploadSlot,
            isCustomSelected && styles.avatarSelected,
          ]}
          onPress={handleImageUpload}
        >
          <Ionicons name="camera" size={22} color={colors.textOnPrimary} />
          <Text style={styles.uploadText}>Upload</Text>
        </TouchableOpacity>
        {avatarItems}
      </View>
    </View>
  );
};

AvatarSelector.propTypes = {
  selectedAvatar: PropTypes.oneOfType([
    PropTypes.shape({ avatar: PropTypes.number }),
    PropTypes.shape({ profilePicture: PropTypes.string }),
  ]),
  onSelect: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
  },
  title: {
    ...typography.heading4,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  avatarRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  avatarWrap: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.cardBackground,
    borderColor: "transparent",
    borderRadius: spacing.radiusPill,
    borderWidth: 2,
    width: 70,
    height: 70,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    ...shadows.elevationCard,
  },
  avatarSelected: {
    borderColor: colors.accentBlue,
    borderWidth: 2,
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: spacing.radiusPill,
  },
  uploadSlot: {
    backgroundColor: colors.primary,
  },
  uploadText: {
    ...typography.smallBold,
    color: colors.textOnPrimary,
    marginTop: 2,
  },
});

export default AvatarSelector;
