import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { openModal } from 'src/features/modals/modalSlice'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { Button, Flex, Image, Text, useDeviceDimensions } from 'ui/src'
import { UNITAGS_BANNER_VERTICAL } from 'ui/src/assets'

const IMAGE_ASPECT_RATIO = 0.35
const IMAGE_SCREEN_WIDTH_PROPORTION = 0.2
const COMPACT_IMAGE_SCREEN_WIDTH_PROPORTION = 0.16
const COMPACT_IMAGE_TOP_SHIFT = -0.17
const REGULAR_IMAGE_TOP_SHIFT = -0.12
const SHORT_IMAGE_TOP_SHIFT = -0.07

export function UnitagBanner({ compact }: { compact?: boolean }): JSX.Element {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const { fullWidth } = useDeviceDimensions()
  const imageWidth = compact
    ? COMPACT_IMAGE_SCREEN_WIDTH_PROPORTION * fullWidth
    : IMAGE_SCREEN_WIDTH_PROPORTION * fullWidth
  const imageHeight = imageWidth / IMAGE_ASPECT_RATIO

  const onPressClaimNow = (): void => {
    dispatch(openModal({ name: ModalName.UnitagsIntro }))
  }

  const onPressMaybeLater = (): void => {
    // TODO (MOB-1554): set a flag in redux to not show this again
  }

  return (
    <Flex
      grow
      row
      backgroundColor={compact ? '$surface2' : '$background'}
      borderColor="$surface3"
      borderRadius="$rounded16"
      borderWidth={compact ? undefined : '$spacing1'}
      mt="$spacing12"
      overflow="hidden"
      shadowColor="$neutral3"
      shadowOpacity={0.4}
      shadowRadius="$spacing4">
      {compact ? (
        <Flex
          fill
          $short={{ mr: '$spacing32' }}
          gap="$spacing16"
          justifyContent="space-between"
          p="$spacing16"
          onPress={onPressClaimNow}>
          <Flex row gap="$none">
            <Text color="$neutral2" variant="subheading2">
              <Text color="$accent1" variant="buttonLabel3">
                {t('Claim a username ')}
              </Text>
              {t('to create a public username and customizable profile.')}
            </Text>
          </Flex>
        </Flex>
      ) : (
        <Flex fill gap="$spacing16" justifyContent="space-between" p="$spacing16">
          <Flex gap="$spacing8">
            <Text variant="subheading2">{t('Claim your Uniswap username')}</Text>
            <Text color="$neutral2" variant="body3">
              {t(
                'Get a free username and personalized profile so people can find your across web3'
              )}
            </Text>
          </Flex>
          <Flex row gap="$spacing8" pb="$spacing16">
            <Button
              borderRadius="$rounded24"
              fontSize="$small"
              testID={ElementName.Confirm}
              theme="primary"
              onPress={onPressClaimNow}>
              {t('Claim now')}
            </Button>
            <Button
              borderRadius="$rounded24"
              color="$neutral2"
              fontSize="$small"
              testID={ElementName.Cancel}
              theme="secondary"
              onPress={onPressMaybeLater}>
              {t('Maybe later')}
            </Button>
          </Flex>
        </Flex>
      )}
      <Flex aspectRatio={IMAGE_ASPECT_RATIO} maxWidth={imageWidth}>
        <Image
          $short={{
            top: SHORT_IMAGE_TOP_SHIFT * imageHeight,
          }}
          height={imageHeight}
          position="absolute"
          resizeMode="center"
          right={0}
          source={UNITAGS_BANNER_VERTICAL}
          top={
            compact ? COMPACT_IMAGE_TOP_SHIFT * imageHeight : REGULAR_IMAGE_TOP_SHIFT * imageHeight
          } // Shift image up otherwise it's not fully visible
          width={imageWidth}
        />
      </Flex>
    </Flex>
  )
}
