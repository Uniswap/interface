module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['./jest.setup-after-env.js'],
  setupFiles: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|@sentry/.*|native-base|react-native-svg|@walletconnect/.*|@motify/.*|solito|moti|@biconomy/.*|@react-three/.*|@babel/.*)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
}
