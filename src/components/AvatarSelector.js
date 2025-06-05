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
          style={[styles.avatarWrap, isSelected && styles.avatarSelected]}
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
          result.assets?.[0]?.uri || result.uri,
        );
        if (uploadedUrl) {
          onSelect({ profilePicture: uploadedUrl });
        }
      }
    } catch (err) {
      Alert.alert(
        "Upload Failed",
        "There was a problem selecting or uploading your image. Please try again.",
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
  avatar: {
    borderRadius: 999,
    height: "100%",
    width: "100%",
  },
  avatarRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  avatarSelected: {
    borderColor: colors.primaryRed,
  },
  avatarWrap: {
    alignItems: "center",
    backgroundColor: colors.darkGray,
    borderColor: colors.transparent,
    borderRadius: 999,
    borderWidth: 2,
    height: 64,
    justifyContent: "center",
    overflow: "hidden",
    width: 64,
  },
  container: {
    marginTop: 20,
  },
  title: {
    color: colors.gray,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  uploadSlot: {
    alignItems: "center",
    justifyContent: "center",
  },
  uploadText: {
    color: colors.white,
    fontSize: 10,
    marginTop: 4,
  },
});

export default AvatarSelector;
