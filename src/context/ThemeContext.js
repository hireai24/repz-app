import React, { createContext, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Appearance } from "react-native";
import lightColors from "../theme/lightColors";
import darkColors from "../theme/colors"; // your current colors.js is dark mode

const ThemeContext = createContext({
  theme: "dark",
  toggleTheme: () => {},
  colors: darkColors,
});

export const ThemeProvider = ({ children }) => {
  const colorScheme = Appearance.getColorScheme();
  const [theme, setTheme] = useState(colorScheme || "dark");

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const colors = theme === "dark" ? darkColors : lightColors;

  useEffect(() => {
    const listener = Appearance.addChangeListener(({ colorScheme }) => {
      setTheme(colorScheme || "dark");
    });
    return () => {
      if (listener && typeof listener.remove === "function") listener.remove();
    };
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useTheme = () => useContext(ThemeContext);
