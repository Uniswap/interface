import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import 'react-native-reanimated'
import { Button, Flex, Image, Text, useIsDarkMode } from 'ui/src'
import { EXTENSION_PROMO_MODAL_DARK, EXTENSION_PROMO_MODAL_LIGHT } from 'ui/src/assets'
import { BottomSheetModal } from 'wallet/src/components/modals/BottomSheetModal'
import { ModalName } from 'wallet/src/telemetry/constants'

export function ExtensionPromoModal({ onClose }: { onClose: () => void }): JSX.Element {
  const { t } = useTranslation()
  const isDarkMode = useIsDarkMode()

  return (
    <BottomSheetModal name={ModalName.ExtensionPromoModal} onClose={onClose}>
      <Flex gap="$spacing12" pb="$spacing24" pt="$spacing4" px="$spacing16">
        <Image
          position="absolute"
          resizeMode="contain"
          source={{
            uri: isDarkMode ? EXTENSION_PROMO_MODAL_DARK : EXTENSION_PROMO_MODAL_LIGHT,
          }}
          style={ImageStyles.responsiveImage}
        />
        <Flex alignItems="center" gap="$spacing8" px="$spacing8" py="$spacing12">
          <Text variant="subheading1">{t('home.modal.getExtension.title')}</Text>
          <Flex gap="$spacing12" pt="$spacing8">
            <Text color="$neutral2" variant="body3">
              <Trans
                components={{
                  highlight: <Text color="$accent1" variant="body3" />,
                }}
                i18nKey="home.modal.getExtension.step1"
              />
            </Text>
            <Text color="$neutral2" variant="body3">
              {t('home.modal.getExtension.step2')}
            </Text>
            <Text color="$neutral2" variant="body3">
              {t('home.modal.getExtension.step3')}
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
