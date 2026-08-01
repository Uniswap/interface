// Web/default implementation; native override lives in TouchableAreaFrame.native.tsx.
// Re-exported here so bare module resolution (some jest envs) and GetProps<typeof TouchableAreaFrame> resolve correctly.
export * from './TouchableAreaFrame.web'
