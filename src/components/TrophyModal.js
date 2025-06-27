// src/components/TrophyModal.js

import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native";
import PropTypes from "prop-types";

import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";
import i18n from "../locales/i18n";

import streak3 from "../assets/trophies/streak3.png";
import streak7 from "../assets/trophies/streak7.png";
import streak15 from "../assets/trophies/streak15.png";
import streak30 from "../assets/trophies/streak30.png";
import streak50 from "../assets/trophies/streak50.png";
import streak75 from "../assets/trophies/streak75.png";
import streak100 from "../assets/trophies/streak100.png";
import streak150 from "../assets/trophies/streak150.png";
import streak365 from "../assets/trophies/streak365.png";

const streakImages = {
  3: streak3,
  7: streak7,
  15: streak15,
  30: streak30,
  50: streak50,
  75: streak75,
  100: streak100,
  150: streak150,
  365: streak365,
};

const battleImages = {
  3: streak3,
  5: streak7,
  10: streak15,
};

const workoutXPBonuses = {
  3: 50,
  7: 100,
  15: 150,
  30: 200,
  50: 300,
  75: 500,
  100: 750,
  150: 1000,
  365: 2000,
};

const battleXPBonuses = {
  3: 75,
  5: 150,
  10: 300,
};

const TrophyModal = ({ visible, onClose, milestone, type = "workout" }) => {
  const isBattle = type === "battle";
  const xpReward = isBattle
    ? battleXPBonuses[milestone] || 0
    : workoutXPBonuses[milestone] || 0;

  const trophyImg = isBattle
    ? battleImages[milestone]
    : streakImages[milestone];

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
      accessible
      accessibilityViewIsModal
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.trophyWrapper}>
            {trophyImg && (
              <Image
                source={trophyImg}
                style={styles.trophy}
                resizeMode="contain"
                accessibilityLabel={`Trophy - ${milestone} ${type}`}
              />
            )}
            <View style={styles.glow} />
          </View>
          <Text style={styles.title}>{i18n.t("trophy.congrats")}</Text>
          <Text style={styles.body}>
            {isBattle
              ? `🔥 ${milestone} Battle Wins in a Row!`
              : i18n.t("trophy.milestone", { days: milestone })}
          </Text>
          <Text style={styles.body}>
            {i18n.t("trophy.bonusXP", { xp: xpReward })}
          </Text>
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>{i18n.t("trophy.ok")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

TrophyModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  milestone: PropTypes.number.isRequired,
  type: PropTypes.oneOf(["workout", "battle"]),
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlayDark,
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: "center",
    width: "85%",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  trophyWrapper: {
    position: "relative",
    marginBottom: spacing.md,
  },
  trophy: {
    width: 140,
    height: 140,
    zIndex: 2,
  },
  glow: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    borderRadius: 70,
    backgroundColor: colors.primary,
    opacity: 0.1,
    zIndex: 1,
  },
  title: {
    ...typography.heading2,
    color: colors.primary,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  body: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  buttonText: {
    color: colors.textOnPrimary,
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default TrophyModal;
