import _extends from "@babel/runtime/helpers/extends";
import React from 'react';
export const defaultTheme = {
  background: '#0b1521',
  backgroundAlt: '#132337',
  foreground: 'white',
  gray: '#3f4e60',
  grayAlt: '#222e3e',
  inputBackgroundColor: '#fff',
  inputTextColor: '#000',
  success: '#00ab52',
  danger: '#ff0085',
  active: '#006bff',
  paused: '#8c49eb',
  warning: '#ffb200'
};
const ThemeContext = /*#__PURE__*/React.createContext(defaultTheme);
export function ThemeProvider({
  theme,
  ...rest
}) {
  return /*#__PURE__*/React.createElement(ThemeContext.Provider, _extends({
    value: theme
  }, rest));
}
export function useTheme() {
  return React.useContext(ThemeContext);
}