import { StyleSheet } from "react-native";

import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";

export default StyleSheet.create({
  centered: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  container: {
    backgroundColor: colors.background,
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  separator: {
    backgroundColor: colors.border,
    height: 1,
    marginVertical: spacing.lg,
  },
  subtitle: {
    ...typography.body,
    allowFontScaling: true,
    color: colors.textSecondary,
    fontSize: 18,
    includeFontPadding: false,
    marginBottom: spacing.sm,
  },
  text: {
    ...typography.body,
    allowFontScaling: true,
    color: colors.textPrimary,
    fontSize: 15,
    includeFontPadding: false,
    lineHeight: 22,
  },
  title: {
    ...typography.heading2,
    allowFontScaling: true,
    color: colors.textPrimary,
    includeFontPadding: false,
    marginBottom: spacing.md,
  },
});
