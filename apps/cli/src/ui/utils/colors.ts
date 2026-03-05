/**
 * Theme color constants for Ink UI
 * Using Uniswap pink color palette
 */
export const colors = {
  primary: '#FC74FE', // Uniswap pink for interactive elements
  success: '#00FF00', // Green for completions
  warning: '#FFFF00', // Yellow for important info
  error: '#FF0000', // Red for errors
  muted: '#888888', // Gray for secondary text
} as const

export type ColorName = keyof typeof colors
