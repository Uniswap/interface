import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { Button, Flex, Image, Text, useSporeColors } from 'ui/src'
import { UNISWAP_LOGO } from 'ui/src/assets'
import { imageSizes } from 'ui/src/theme'
import { NewTag } from 'uniswap/src/components/pill/NewTag'
import { isWebPlatform } from 'utilities/src/platform'

interface ForceUpgradeModalContentProps {
  title: string
  description: string
  isRequired: boolean
  hasMnemonic: boolean
  onPressUpdate: () => void
  onPressBackup?: () => void
  onPressNotNow?: () => void
  /** Custom label for the update button. Defaults to translation key 'forceUpgrade.action.confirm' */
  updateButtonLabel?: string
}

/**
 * Shared UI content for the force upgrade modal.
 * Used by both the legacy ForceUpgrade component and the notification-driven version.
 */
export function ForceUpgradeModalContent({
  title,
  description,
  isRequired,
  hasMnemonic,
  onPressUpdate,
  onPressBackup,
  onPressNotNow,
  updateButtonLabel,
}: ForceUpgradeModalContentProps): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const buttonLabel = updateButtonLabel ?? t('forceUpgrade.action.confirm')

  return (
    <Flex
      centered
      gap="$spacing24"
      pb={isWebPlatform ? '$none' : '$spacing12'}
      pt={isRequired ? '$spacing24' : '$spacing12'}
      px={isWebPlatform ? '$none' : '$spacing24'}
    >
      <Flex
        centered
        width="100%"
        height={160}
        borderRadius="$rounded16"
        borderWidth="$spacing1"
        borderColor="$surface3"
        overflow="hidden"
      >
        <Flex
          centered
          borderRadius="$rounded16"
          style={{
            shadowColor: colors.accent1.val,
            elevation: 8,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
          }}
          borderWidth="$spacing1"
          borderColor="$surface3"
          elevationAndroid={8}
        >
          <Flex position="relative">
            <Image height={imageSizes.image64} resizeMode="contain" source={UNISWAP_LOGO} width={imageSizes.image64} />
            <Flex position="absolute" top={-15} right={-8} transform={[{ rotate: '10deg' }]}>
              <NewTag exclamation backgroundColor="$accent1" textColor="$white" />
            </Flex>
          </Flex>
        </Flex>
        <BackgroundDotPattern />
      </Flex>
      <Flex gap="$spacing8">
        <Text textAlign="center" variant="subheading1">
          {title}
        </Text>
        <Text color="$neutral2" textAlign="center" variant="body3">
          {description}
        </Text>
      </Flex>
      <Flex centered gap="$spacing8" pb={isWebPlatform ? '$none' : '$spacing12'} width="100%">
        <Flex row width="100%">
          <Button size="medium" variant="branded" onPress={onPressUpdate}>
            {buttonLabel}
          </Button>
        </Flex>

        {isRequired
          ? hasMnemonic &&
            onPressBackup && (
              <Flex row width="100%">
                <Button size="medium" emphasis="secondary" onPress={onPressBackup}>
                  {t('forceUpgrade.action.backup')}
                </Button>
              </Flex>
            )
          : onPressNotNow && (
              <Flex row width="100%">
                <Button size="medium" emphasis="secondary" onPress={onPressNotNow}>
                  {t('common.button.notNow')}
                </Button>
              </Flex>
            )}
      </Flex>
    </Flex>
  )
}

function BackgroundDotPattern(): JSX.Element {
  const colors = useSporeColors()
  const dotGrid = useMemo(() => {
    return Array.from({ length: 100 }).map((_, row) => {
      return Array.from({ length: 100 }).map((__, col) => {
        const x = col * 2 + 1
        const y = row * 2 + 1

        const distX = Math.abs(x - 50)
        const distY = Math.abs(y - 50)
        const dist = Math.sqrt(distX * distX + distY * distY)

        if (dist < 45) {
          const size = 0.1 + (45 - dist) / 20

          return <Circle key={`${row}-${col}`} cx={`${x}%`} cy={`${y}%`} r={size} fill={colors.pinkThemed.val} />
        }
        return null
      })
    })
  }, [colors])

  return (
    <Svg width={400} height={400} style={[styles.backgroundPattern, styles.centered]}>
      {dotGrid}
    </Svg>
  )
}

const styles = StyleSheet.create({
  backgroundPattern: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: -1,
  },
  centered: {
    left: '50%',
    top: '50%',
    transform: [{ translateX: -200 }, { translateY: -200 }],
  },
})
