import { Flex, Text, AnimatedFlex } from '@universe/mycelium'
import { useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { TokenFiatOnRampList } from 'src/components/TokenSelector/TokenFiatOnRampList'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { FOR_MODAL_SNAP_POINTS } from 'uniswap/src/features/fiatOnRamp/constants'
import { FiatOnRampCurrency } from 'uniswap/src/features/fiatOnRamp/types'
import { ElementName, ModalName, SectionName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'

interface Props {
  onSelectCurrency: (currency: FiatOnRampCurrency) => void
  onRetry: () => void
  onClose: () => void
  error: boolean
  loading: boolean
  list: FiatOnRampCurrency[] | undefined
  balancesById: Record<string, PortfolioBalance> | undefined
  selectedCurrency?: FiatOnRampCurrency
  isOffRamp: boolean
}

export function FiatOnRampTokenSelectorModal({
  error,
  list,
  loading,
  onClose,
  onRetry,
  onSelectCurrency,
  balancesById,
  selectedCurrency,
  isOffRamp,
}: { onClose: () => void } & Props): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()

  return (
    <Modal
      extendOnKeyboardVisible
      fullScreen
      overrideInnerContainer
      hideKeyboardOnDismiss
      hideKeyboardOnSwipeDown
      renderBehindBottomInset
      backgroundColor={colors.surface1.val}
      name={ModalName.FiatOnRampTokenSelector}
      snapPoints={FOR_MODAL_SNAP_POINTS}
      onClose={onClose}
    >
      <Trace logImpression element={ElementName.FiatOnRampTokenSelector} section={SectionName.TokenSelector}>
        <Flex grow gap="$spacing16" px="$spacing16">
          <Text color="$neutral1" mt="$spacing2" textAlign="center" variant="subheading1">
            {t('fiatOnRamp.button.chooseToken')}
          </Text>
          <AnimatedFlex grow entering={FadeIn} exiting={FadeOut}>
            {/* `fill` (flex:1) not `grow`: Legend List needs a parent with a definite height, else it sizes to
                its content and pushes the title out of place (same trap as FiatOnRampCountryListModal). */}
            <Flex fill>
              <TokenFiatOnRampList
                balancesById={balancesById}
                error={error}
                isOffRamp={isOffRamp}
                list={list}
                loading={loading}
                selectedCurrency={selectedCurrency}
                onRetry={onRetry}
                onSelectCurrency={onSelectCurrency}
              />
            </Flex>
          </AnimatedFlex>
        </Flex>
      </Trace>
    </Modal>
  )
}
