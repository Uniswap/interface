/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  roots: ["<rootDir>"],
  preset: "ts-jest",
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  modulePathIgnorePatterns: [
    "<rootDir>/src/test//__fixtures__",
    "<rootDir>/node_modules",
    "<rootDir>/dist",
  ],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|@sentry/.*|native-base|react-native-svg|@walletconnect/.*|@motify/.*|solito|moti|@biconomy/.*|@react-three/.*|@babel/.*)",
  ],
  setupFilesAfterEnv: ["<rootDir>src/test/jest.setup-after-env.ts"],
  setupFiles: ["<rootDir>/src/test/jest.setup.ts"],
};
