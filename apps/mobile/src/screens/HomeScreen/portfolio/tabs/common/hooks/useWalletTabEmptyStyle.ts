import { useMemo } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { useMedia } from 'ui/src'
import { spacing } from 'ui/src/theme'

/** Padding around empty-state cards in wallet home Tokens / NFTs tabs. */
export function useWalletTabEmptyStyle(): StyleProp<ViewStyle> {
  const media = useMedia()

  return useMemo(
    () => ({
      paddingTop: media.short ? spacing.spacing12 : spacing.spacing32,
      paddingBottom: media.short ? spacing.spacing12 : spacing.spacing32,
      paddingLeft: media.short ? spacing.none : spacing.spacing12,
      paddingRight: media.short ? spacing.none : spacing.spacing12,
    }),
    [media.short],
  )
}
