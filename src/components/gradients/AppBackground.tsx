import React, { memo } from 'react'
import { Image, StyleSheet } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import {
  MAIN_BLUR_BG_CYAN,
  MAIN_BLUR_BG_LIME,
  MAIN_BLUR_BG_MAGENTA,
  MAIN_BLUR_BG_ORANGE,
  MAIN_BLUR_BG_SLATE,
  MAIN_BLUR_BG_VIOLET,
} from 'src/assets'
import { GradientBackground } from 'src/components/gradients/GradientBackground'
import { logMessage } from 'src/features/telemetry'
import { LogContext } from 'src/features/telemetry/constants'
import { Theme } from 'src/styles/theme'

export const AppBackground = memo(() => {
  const theme = useAppTheme()
  return (
    <GradientBackground>
      <Image
        resizeMode="stretch"
        source={getThemeColorBackgroundAsset(theme.colors.userThemeColor, theme)}
        style={style.imageBackground}
      />
    </GradientBackground>
  )
})

function getThemeColorBackgroundAsset(color: string, theme: Theme) {
  switch (color) {
    case theme.colors.userThemeMagenta:
      return MAIN_BLUR_BG_MAGENTA
    case theme.colors.userThemeViolet:
      return MAIN_BLUR_BG_VIOLET
    case theme.colors.userThemeOrange:
      return MAIN_BLUR_BG_ORANGE
    case theme.colors.userThemeLime:
      return MAIN_BLUR_BG_LIME
    case theme.colors.userThemeCyan:
      return MAIN_BLUR_BG_CYAN
    case theme.colors.userThemeSlate:
      return MAIN_BLUR_BG_SLATE
    default:
      logMessage(
        LogContext.AppBackground,
        `Failed to find matching background asset AppBackground for color ${color}`
      )
      return MAIN_BLUR_BG_MAGENTA
  }
}

const style = StyleSheet.create({
  imageBackground: { width: '100%' },
})
