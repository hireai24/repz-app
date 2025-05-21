import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";

import avatars from "../assets/avatars";
import { uploadImageAsync } from "../utils/fileUploader";
import colors from "../theme/colors";

const AvatarSelector = ({ selectedAvatar, onSelect }) => {
  const isCustomSelected = selectedAvatar?.profilePicture;
  const validAvatars = Array.isArray(avatars) ? avatars : [];

  const handleAvatarSelect = (index) => {
    onSelect({ avatar: index });
  };

  const handleImageUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && (result.assets?.[0]?.uri || result.uri)) {
        const uploadedUrl = await uploadImageAsync(
          result.assets?.[0]?.uri || result.uri,
        );
        if (uploadedUrl) {
          onSelect({ profilePicture: uploadedUrl });
        }
      }
    } catch {
      // Silent fail: image upload failed
    }
  };

  const avatarItems = useMemo(() => {
    return validAvatars.map((avatar, index) => {
      const isSelected = selectedAvatar?.avatar === index;

      return (
        <TouchableOpacity
          key={index}
          accessible
          accessibilityRole="imagebutton"
          accessibilityLabel={`Avatar ${index + 1}`}
          accessibilityState={{ selected: isSelected }}
          style={[styles.avatarWrap, isSelected && styles.avatarSelected]}
          onPress={() => handleAvatarSelect(index)}
        >
          <Image source={avatar} style={styles.avatar} />
        </TouchableOpacity>
      );
    });
  }, [validAvatars, selectedAvatar, handleAvatarSelect]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Your Avatar</Text>
      <View style={styles.avatarRow}>
        <TouchableOpacity
          accessible
          accessibilityRole="imagebutton"
          accessibilityLabel="Upload custom avatar"
          style={[styles.avatarWrap, isCustomSelected && styles.avatarSelected]}
          onPress={handleImageUpload}
        >
          <View style={styles.uploadSlot}>
            <Ionicons name="camera" size={24} color={colors.white} />
            <Text style={styles.uploadText}>Upload</Text>
          </View>
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
    marginTop: 20,
  },
  title: {
    color: colors.gray,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  avatarRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.darkGray,
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
  },
  avatarSelected: {
    borderColor: colors.primaryRed,
  },
  uploadSlot: {
    alignItems: "center",
    justifyContent: "center",
  },
  uploadText: {
    fontSize: 10,
    color: colors.white,
    marginTop: 4,
  },
});

export default AvatarSelector;
