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

// 🏆 Trophy images for workout streaks and battle wins
const streakImages = {
  3: require("../assets/trophies/streak3.png"),
  7: require("../assets/trophies/streak7.png"),
  15: require("../assets/trophies/streak15.png"),
  30: require("../assets/trophies/streak30.png"),
  50: require("../assets/trophies/streak50.png"),
  75: require("../assets/trophies/streak75.png"),
  100: require("../assets/trophies/streak100.png"),
  150: require("../assets/trophies/streak150.png"),
  365: require("../assets/trophies/streak365.png"),
};

// 🎯 Battle win streaks (e.g., 3, 5, 10 wins in a row)
const battleImages = {
  3: require("../assets/trophies/streak3.png"),
  5: require("../assets/trophies/streak7.png"),
  10: require("../assets/trophies/streak15.png"),
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
          {trophyImg && (
            <Image
              source={trophyImg}
              style={styles.trophy}
              resizeMode="contain"
              accessibilityLabel={`Trophy - ${milestone} ${type}`}
            />
          )}
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
  type: PropTypes.oneOf(["workout", "battle"]), // 🆕 Support both types
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#00000088",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: "center",
    width: "85%",
    elevation: 5,
  },
  trophy: {
    width: 120,
    height: 120,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.heading3,
    color: colors.primary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.body,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default TrophyModal;
