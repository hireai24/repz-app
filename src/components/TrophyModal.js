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
import LinearGradient from "react-native-linear-gradient";

import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";
import shadows from "../theme/shadows";
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
            <LinearGradient
              colors={[colors.primary, "transparent"]}
              style={styles.glow}
            />
            {trophyImg && (
              <Image
                source={trophyImg}
                style={styles.trophy}
                resizeMode="contain"
                accessibilityLabel={`Trophy - ${milestone} ${type}`}
              />
            )}
          </View>
          <Text style={styles.title}>{i18n.t("trophy.congrats")}</Text>
          <Text style={styles.body}>
            {isBattle
              ? `🔥 ${milestone} Battle Wins in a Row!`
              : i18n.t("trophy.milestone", { days: milestone })}
          </Text>
          <Text style={styles.xpText}>
            {i18n.t("trophy.bonusXP", { xp: xpReward })}
          </Text>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.button}
          >
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close trophy modal"
            >
              <Text style={styles.buttonText}>{i18n.t("trophy.ok")}</Text>
            </TouchableOpacity>
          </LinearGradient>
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
    backgroundColor: colors.glassBackground,
    borderRadius: spacing.radiusXl,
    padding: spacing.spacing4,
    alignItems: "center",
    width: "85%",
    ...shadows.shadow4,
  },
  trophyWrapper: {
    position: "relative",
    marginBottom: spacing.spacing3,
    justifyContent: "center",
    alignItems: "center",
  },
  glow: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    opacity: 0.15,
  },
  trophy: {
    width: 140,
    height: 140,
    zIndex: 2,
  },
  title: {
    ...typography.heading2,
    color: colors.primary,
    marginBottom: spacing.spacing1,
    textAlign: "center",
  },
  body: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.spacing1,
    textAlign: "center",
  },
  xpText: {
    ...typography.bodyBold,
    color: colors.accentBlue,
    marginBottom: spacing.spacing2,
    textAlign: "center",
  },
  button: {
    borderRadius: spacing.radiusFull,
    marginTop: spacing.spacing2,
  },
  buttonText: {
    ...typography.button,
    color: colors.textOnPrimary,
    paddingVertical: spacing.spacing3,
    paddingHorizontal: spacing.spacing5,
  },
});

export default TrophyModal;
