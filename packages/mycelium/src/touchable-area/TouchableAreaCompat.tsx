// Web/default implementation; native override lives in TouchableAreaCompat.native.tsx.
// Re-exported here so bare module resolution (bundlers without .web extension
// priority) and the package barrel resolve correctly.
export * from './TouchableAreaCompat.web'
