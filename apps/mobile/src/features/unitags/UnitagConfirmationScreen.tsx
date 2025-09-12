import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { navigate } from 'src/app/navigation/rootNavigation'
import { UnitagStackScreenProp } from 'src/app/navigation/types'
import { Screen } from 'src/components/layout/Screen'
import { AnimatePresence, Button, Flex, Text } from 'ui/src'
import { AnimateInOrder } from 'ui/src/animations'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { spacing } from 'ui/src/theme'
import { UNITAG_SUFFIX } from 'uniswap/src/features/unitags/constants'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { MobileScreens, UnitagScreens } from 'uniswap/src/types/screens/mobile'
import {
  EmojiElement,
  ENSElement,
  FroggyElement,
  HeartElement,
  OpenseaElement,
  ReceiveUSDCElement,
  SendElement,
  SwapElement,
  TextElement,
} from 'wallet/src/components/landing/elements'
import { UnitagWithProfilePicture } from 'wallet/src/features/unitags/UnitagWithProfilePicture'

export function UnitagConfirmationScreen({
  route,
}: UnitagStackScreenProp<UnitagScreens.UnitagConfirmation>): JSX.Element {
  const { unitag, address, profilePictureUri } = route.params
  const dimensions = useDeviceDimensions()
  const insets = useAppInsets()
  const { t } = useTranslation()

  const boxWidth = dimensions.fullWidth - insets.left - insets.right - spacing.spacing32

  const onPressCustomize = (): void => {
    navigate(MobileScreens.UnitagStack, {
      screen: UnitagScreens.EditProfile,
      params: {
        address,
        unitag,
        entryPoint: UnitagScreens.UnitagConfirmation,
      },
    })
  }

  const onPressDone = (): void => {
    navigate(MobileScreens.Home)
  }

  const elementsToAnimate = useMemo(
    () => [
      { element: <FroggyElement />, coordinates: { x: 5, y: 0 } },
      { element: <ReceiveUSDCElement />, coordinates: { x: 10, y: 2 } },
      { element: <OpenseaElement />, coordinates: { x: 8.2, y: 4 } },
      { element: <HeartElement />, coordinates: { x: 9, y: 7 } },
      { element: <SwapElement />, coordinates: { x: 10, y: 10 } },
      { element: <ENSElement />, coordinates: { x: 1, y: 8.5 } },
      {
        element: <TextElement text={t('unitags.claim.confirmation.success.short')} />,
        coordinates: { x: 0, y: 5 },
      },
      { element: <SendElement />, coordinates: { x: 1, y: 2 } },
      { element: <EmojiElement emoji="👍" />, coordinates: { x: 3.5, y: 2.5 } },
    ],
    [t],
  )

  return (
    <Screen edges={['right', 'left', 'bottom']} pt="$spacing60">
      <Flex grow gap="$spacing16" justifyContent="space-between" pb="$spacing16" px="$spacing16">
        <Flex centered grow>
          <AnimatePresence exitBeforeEnter>
            <AnimateInOrder
              key="outerCircle"
              enterStyle={{ opacity: 0, scale: 0.5 }}
              exitStyle={{ opacity: 0, scale: 0.5 }}
              index={1}
              position="absolute"
            >
              <Flex
                aspectRatio={1}
                borderColor="$surface3"
                borderRadius="$roundedFull"
                borderWidth="$spacing1"
                height={boxWidth}
              />
            </AnimateInOrder>
            <AnimateInOrder
              key="innerCircle"
              enterStyle={{ opacity: 0, scale: 0.5 }}
              exitStyle={{ opacity: 0, scale: 0.5 }}
              index={2}
              position="absolute"
            >
              <Flex
                aspectRatio={1}
                borderColor="$surface3"
                borderRadius="$roundedFull"
                borderWidth="$spacing1"
                height={boxWidth * 0.6}
              />
            </AnimateInOrder>
            {elementsToAnimate.map(({ element, coordinates }, index) => (
              <AnimateInOrder
                key={index}
                index={index + 3}
                position="absolute"
                {...getInsetPropsForCoordinates({ boxWidth, x: coordinates.x, y: coordinates.y })}
              >
                {element}
              </AnimateInOrder>
            ))}
            <AnimateInOrder key="unitag" index={12}>
              <UnitagWithProfilePicture address={address} profilePictureUri={profilePictureUri} unitag={unitag} />
            </AnimateInOrder>
          </AnimatePresence>
        </Flex>
        <Flex centered gap="$spacing16" pb="$spacing16" px="$spacing24">
          <Text color="$neutral1" textAlign="center" variant="heading3">
            {t('unitags.claim.confirmation.success.long')}
          </Text>
          <Text color="$neutral2" textAlign="center" variant="subheading2">
            {t('unitags.claim.confirmation.description', {
              unitagAddress: `${unitag}${UNITAG_SUFFIX}`,
            })}
          </Text>
        </Flex>
        <Flex gap="$spacing12">
          <Flex centered row>
            <Button variant="branded" size="large" onPress={onPressDone}>
              {t('common.button.done')}
            </Button>
          </Flex>
          <Flex centered row>
            <Button emphasis="secondary" size="large" onPress={onPressCustomize}>
              {t('unitags.claim.confirmation.customize')}
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </Screen>
  )
}

// Calculates top and left insets for absolute positioned element based
// on a 10x10 coordinate system where top left is 0,0.
function getInsetPropsForCoordinates({ boxWidth, x, y }: { boxWidth: number; x: number; y: number }): {
  top?: number
  right?: number
  bottom?: number
  left?: number
} {
  const unitSize = 10
  const unit = boxWidth / unitSize

  let top
  let bottom
  let left
  let right

  if (x < unitSize / 2) {
    left = x * unit
  } else if (x > unitSize / 2) {
    right = (unitSize - x) * unit
  }

  if (y < unitSize / 2) {
    top = y * unit
  } else if (y > unitSize / 2) {
    bottom = (unitSize - y) * unit
  }

  return { top, right, bottom, left }
}
