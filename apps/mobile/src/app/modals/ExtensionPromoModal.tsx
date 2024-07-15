import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import 'react-native-reanimated'
import { Button, Flex, Image, Text, useIsDarkMode } from 'ui/src'
import {
  EXTENSION_PROMO_BANNER_DARK,
  EXTENSION_PROMO_BANNER_DARK_GA,
  EXTENSION_PROMO_BANNER_LIGHT,
  EXTENSION_PROMO_BANNER_LIGHT_GA,
} from 'ui/src/assets'
import { BottomSheetModal } from 'uniswap/src/components/modals/BottomSheetModal'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export function ExtensionPromoModal({ onClose }: { onClose: () => void }): JSX.Element {
  const { t } = useTranslation()
  const isDarkMode = useIsDarkMode()
  const isExtensionGAPromotionEnabled = useFeatureFlag(FeatureFlags.ExtensionPromotionGA)

  const bannerImageGA = isDarkMode ? EXTENSION_PROMO_BANNER_DARK_GA : EXTENSION_PROMO_BANNER_LIGHT_GA

  const bannerImageBeta = isDarkMode ? EXTENSION_PROMO_BANNER_DARK : EXTENSION_PROMO_BANNER_LIGHT

  const imageUri = isExtensionGAPromotionEnabled ? bannerImageGA : bannerImageBeta

  return (
    <BottomSheetModal name={ModalName.ExtensionPromoModal} onClose={onClose}>
      <Flex gap="$spacing12" pb="$spacing24" pt="$spacing4" px="$spacing16">
        <Image
          position="absolute"
          resizeMode="contain"
          source={{
            uri: imageUri,
          }}
          style={ImageStyles.responsiveImage}
        />
        <Flex alignItems="center" gap="$spacing8" px="$spacing8" py="$spacing12">
          <Text variant="subheading1">
            {isExtensionGAPromotionEnabled
              ? t('home.modal.getExtension.ga.title')
              : t('home.modal.getExtension.beta.title')}
          </Text>
          <Flex gap="$spacing12" pt="$spacing8">
            <Text color="$neutral2" variant="body3">
              <Trans
                components={{
                  highlight: <Text color="$accent1" variant="body3" />,
                }}
                i18nKey="home.modal.getExtension.ga.step1"
              />
            </Text>
            <Text color="$neutral2" variant="body3">
              {t('home.modal.getExtension.ga.step2')}
            </Text>
            <Text color="$neutral2" variant="body3">
              {isExtensionGAPromotionEnabled
                ? t('home.modal.getExtension.ga.step3')
                : t('home.modal.getExtension.beta.step3')}
            </Text>
          </Flex>
        </Flex>
        <Button theme="secondary" onPress={onClose}>
          {t('common.button.close')}
        </Button>
      </Flex>
    </BottomSheetModal>
  )
}

const ImageStyles = StyleSheet.create({
  responsiveImage: {
    aspectRatio: 686 / 430,
    height: undefined,
    width: '100%',
  },
})
