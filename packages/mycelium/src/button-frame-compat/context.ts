/**
 * The React-context replacement for the legacy ui `buttonStyledContext`
 * (`createStyledContext<ButtonVariantProps>`): the frame broadcasts its
 * variant selection so `CustomButtonText` / `ThemedIcon` render the right
 * cell without re-receiving every prop — the ButtonCompat pattern
 * (`ButtonContextValue`), extended with the native legs' live interaction
 * state (web scopes states in CSS instead).
 *
 * Legacy context defaults are the legacy `defaultVariants` — a Text rendered
 * OUTSIDE a frame paints the default/primary/medium cell, exactly as under
 * Tamagui's provider-less styled-context read.
 */
import { createContext, useContext } from 'react'
import type { ButtonFrameContextValue } from './compile'

const ButtonFrameContext = createContext<ButtonFrameContextValue>({
  size: 'medium',
  variant: 'default',
  emphasis: 'primary',
  isDisabled: false,
})

export const ButtonFrameContextProvider = ButtonFrameContext.Provider

export function useButtonFrameContext(): ButtonFrameContextValue {
  return useContext(ButtonFrameContext)
}
