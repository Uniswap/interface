import React from 'react'
import { useTranslation } from 'react-i18next'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { TokenFiatOnRampList } from 'src/components/TokenSelector/TokenFiatOnRampList'
import { Flex, Text, useSporeColors } from 'ui/src'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { BottomSheetModal } from 'uniswap/src/components/modals/BottomSheetModal'
import { FOR_MODAL_SNAP_POINTS } from 'uniswap/src/features/fiatOnRamp/constants'
import { FiatOnRampCurrency } from 'uniswap/src/features/fiatOnRamp/types'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName, ModalName, SectionName } from 'uniswap/src/features/telemetry/constants'

interface Props {
  onSelectCurrency: (currency: FiatOnRampCurrency) => void
  onRetry: () => void
  onClose: () => void
  error: boolean
  loading: boolean
  list: FiatOnRampCurrency[] | undefined
}

export function FiatOnRampTokenSelectorModal({
  error,
  list,
  loading,
  onClose,
  onRetry,
  onSelectCurrency,
}: { onClose: () => void } & Props): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()

  return (
    <BottomSheetModal
      extendOnKeyboardVisible
      fullScreen
      hideKeyboardOnDismiss
      hideKeyboardOnSwipeDown
      renderBehindBottomInset
      backgroundColor={colors.surface1.get()}
      name={ModalName.FiatOnRampCountryList}
      snapPoints={FOR_MODAL_SNAP_POINTS}
      onClose={onClose}
    >
      <Trace logImpression element={ElementName.FiatOnRampTokenSelector} section={SectionName.TokenSelector}>
        <Flex grow gap="$spacing16" px="$spacing16">
          <Text color="$neutral1" mt="$spacing2" textAlign="center" variant="subheading1">
            {t('fiatOnRamp.button.chooseToken')}
          </Text>
          <AnimatedFlex grow entering={FadeIn} exiting={FadeOut}>
            <TokenFiatOnRampList
              error={error}
              list={list}
              loading={loading}
              onRetry={onRetry}
              onSelectCurrency={onSelectCurrency}
            />
          </AnimatedFlex>
        </Flex>
      </Trace>
    </BottomSheetModal>
  )
}
