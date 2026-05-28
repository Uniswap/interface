import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { FadeInDown, FadeOutUp } from 'react-native-reanimated'
import { getFullAppVersion } from 'src/utils/version'
import { Flex, Image, Text, useIsDarkMode } from 'ui/src'
import { AVATARS_DARK, AVATARS_LIGHT } from 'ui/src/assets'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useTimeout } from 'utilities/src/time/timing'

const SIGNATURE_VISIBLE_DURATION = ONE_SECOND_MS * 10

export function FooterSettings(): JSX.Element {
  const { t } = useTranslation()
  const [showSignature, setShowSignature] = useState(false)
  const isDarkMode = useIsDarkMode()

  // Fade out signature after duration
  useTimeout(
    showSignature
      ? (): void => {
          setShowSignature(false)
        }
      : (): void => undefined,
    SIGNATURE_VISIBLE_DURATION,
  )

  return (
    <Flex gap="$spacing12">
      {showSignature ? (
        <AnimatedFlex alignItems="center" entering={FadeInDown} exiting={FadeOutUp} gap="$none" mt="$spacing16">
          <Flex gap="$spacing4">
            <Text color="$neutral3" textAlign="center" variant="body2">
              {t('settings.footer')}
            </Text>
          </Flex>
          {isDarkMode ? (
            <Image source={AVATARS_DARK} style={styles.responsiveImage} />
          ) : (
            <Image source={AVATARS_LIGHT} style={styles.responsiveImage} />
          )}
        </AnimatedFlex>
      ) : null}
      <Text
        color="$neutral3"
        mt="$spacing8"
        pb="$spacing24"
        variant="body2"
        onLongPress={(): void => {
          setShowSignature(true)
        }}
      >
        {t('settings.version', { appVersion: getFullAppVersion({ includeBuildNumber: true }) })}
      </Text>
    </Flex>
  )
}

const styles = StyleSheet.create({
  responsiveImage: {
    aspectRatio: 135 / 76,
    height: undefined,
    width: '100%',
  },
})
