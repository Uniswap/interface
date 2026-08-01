// Web/default implementation; native override lives in CustomButtonFrame.native.tsx.
// Re-exported here so bare module resolution (some jest envs) and GetProps<typeof CustomButtonFrame> resolve correctly.
export * from './CustomButtonFrame.web'
