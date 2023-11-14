import React, { ComponentProps, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useAppDispatch } from 'src/app/hooks'
import { useBottomSheetContext } from 'src/components/modals/BottomSheetContext'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { HandleBar } from 'src/components/modals/HandleBar'
import { closeModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { AnimatedFlex, Flex, Text, useDeviceInsets, useSporeColors } from 'ui/src'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { FiatOnRampCountryListModal } from './FiatOnRampCountryListModal'
import { FiatOnRampCountryPicker } from './FiatOnRampCountryPicker'

export function FiatOnRampAggregatorModal(): JSX.Element {
  const colors = useSporeColors()

  const dispatch = useAppDispatch()
  const onClose = useCallback((): void => {
    dispatch(closeModal({ name: ModalName.FiatOnRampAggregator }))
  }, [dispatch])

  return (
    <BottomSheetModal
      fullScreen
      hideHandlebar
      hideKeyboardOnDismiss
      renderBehindTopInset
      backgroundColor={colors.surface1.get()}
      name={ModalName.FiatOnRampAggregator}
      onClose={onClose}>
      <FiatOnRampAggregatorContent />
    </BottomSheetModal>
  )
}

// TODO: Implement it
// https://linear.app/uniswap/issue/MOB-1942/identify-region-by-the-ip-address-of-the-device
function useFiatOnRampAggregatorDeviceCountryCodeQuery(): { data: string } {
  return { data: 'DE' }
}

function FiatOnRampAggregatorContent(): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const [selectingCountry, setSelectingCountry] = useState(false)

  const { data: deviceCountryCode } = useFiatOnRampAggregatorDeviceCountryCodeQuery()

  const [currentCountryCode, setCurrentCountryCode] = useState<undefined | string>()

  useEffect(() => {
    if (!currentCountryCode && deviceCountryCode) {
      setCurrentCountryCode(deviceCountryCode)
    }
  }, [currentCountryCode, deviceCountryCode])

  const { isSheetReady } = useBottomSheetContext()

  const insets = useDeviceInsets()

  const onSelectCountry: ComponentProps<typeof FiatOnRampCountryListModal>['onSelectCountry'] = (
    country
  ): void => {
    dispatch(
      pushNotification({
        type: AppNotificationType.ChooseCountry,
        countryName: country.displayName,
        countryCode: country.countryCode,
      })
    )
    setSelectingCountry(false)
    setCurrentCountryCode(country.countryCode)
  }

  return (
    <>
      <Flex style={{ marginTop: insets.top }}>
        <HandleBar backgroundColor="none" />
        <AnimatedFlex row height="100%" pt="$spacing12">
          {isSheetReady && (
            <AnimatedFlex
              entering={FadeIn}
              exiting={FadeOut}
              gap="$spacing16"
              pb="$spacing16"
              px="$spacing24"
              style={{ marginBottom: insets.bottom }}
              width="100%">
              <Flex row alignItems="center" justifyContent="space-between">
                <Text variant="subheading1">{t('Buy')}</Text>
                <FiatOnRampCountryPicker
                  currentCountryCode={currentCountryCode}
                  onPress={(): void => {
                    setSelectingCountry(true)
                  }}
                />
              </Flex>
            </AnimatedFlex>
          )}
        </AnimatedFlex>
      </Flex>
      {Boolean(selectingCountry) && currentCountryCode && (
        <FiatOnRampCountryListModal
          currentCountryCode={currentCountryCode}
          onClose={(): void => {
            setSelectingCountry(false)
          }}
          onSelectCountry={onSelectCountry}
        />
      )}
    </>
  )
}
