import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Popover, Text, TouchableArea, isWeb, useSporeColors } from 'ui/src'
import { Eye } from 'ui/src/components/icons/Eye'
import { Settings } from 'ui/src/components/icons/Settings'
import { iconSizes } from 'ui/src/theme'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ViewOnlyModal } from 'uniswap/src/features/transactions/modals/ViewOnlyModal'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { SwapSettingsModal } from 'uniswap/src/features/transactions/swap/settings/SwapSettingsModal'
import { SwapSettingConfig } from 'uniswap/src/features/transactions/swap/settings/configs/types'
import { BridgeTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard'
import { isInterface, isMobileApp } from 'utilities/src/platform'

export function SwapFormSettings({ customSettings }: { customSettings: SwapSettingConfig[] }): JSX.Element {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const colors = useSporeColors()

  const account = useAccountMeta()
  const { customSlippageTolerance, derivedSwapInfo } = useSwapFormContext()
  const isBridgeTrade = derivedSwapInfo.trade.trade instanceof BridgeTrade

  const [showSwapSettingsModal, setShowSettingsModal] = useState(false)
  const [showViewOnlyModal, setShowViewOnlyModal] = useState(false)

  const onPressSwapSettings = useCallback((): void => {
    setShowSettingsModal(true)
    dismissNativeKeyboard()
  }, [])

  const onPressViewOnlyModal = useCallback((): void => {
    setShowViewOnlyModal(true)
  }, [])

  const onCloseSettingsModal = useCallback(() => setShowSettingsModal(false), [])

  const isViewOnlyWallet = account?.type === AccountType.Readonly

  const topAlignment = isInterface ? -34 : 6
  const rightAlignment = isMobileApp ? 24 : 4

  const showCustomSlippage = customSlippageTolerance && !isBridgeTrade

  return (
    <Flex row gap="$spacing4" position="absolute" top={topAlignment} right={rightAlignment} zIndex="$default">
      <ViewOnlyModal isOpen={showViewOnlyModal} onDismiss={(): void => setShowViewOnlyModal(false)} />
      {isViewOnlyWallet && (
        <TouchableArea
          backgroundColor="$surface2"
          borderRadius="$rounded12"
          justifyContent="center"
          px="$spacing8"
          py="$spacing4"
          onPress={onPressViewOnlyModal}
        >
          <Flex row alignItems="center" gap="$spacing4">
            <Eye color={colors.neutral2.get()} size={iconSizes.icon16} />
            <Text color="$neutral2" variant="buttonLabel2">
              {t('swap.header.viewOnly')}
            </Text>
          </Flex>
        </TouchableArea>
      )}

      {!isViewOnlyWallet && (
        <Popover
          placement="bottom-end"
          open={showSwapSettingsModal}
          onOpenChange={(open) => {
            // Only close on interface because SwapSettings are rendered in a modal on mobile/extension
            // and when click is triggered inside extension Modal it causes onOpenChange to trigger
            if (!open && isInterface) {
              setShowSettingsModal(false)
            }
          }}
        >
          <TouchableArea hapticFeedback testID={TestID.SwapSettings}>
            <Flex
              centered
              row
              backgroundColor={showCustomSlippage ? '$surface2' : '$transparent'}
              borderRadius="$roundedFull"
              gap="$spacing4"
              px={showCustomSlippage ? '$spacing8' : '$spacing4'}
              py="$spacing4"
            >
              {showCustomSlippage ? (
                <Text color="$neutral2" variant="buttonLabel3">
                  {formatPercent(customSlippageTolerance)}
                </Text>
              ) : null}
              <Popover.Trigger onPress={onPressSwapSettings}>
                <Settings color={colors.neutral2.get()} size={isWeb ? iconSizes.icon20 : iconSizes.icon24} />
              </Popover.Trigger>
            </Flex>
          </TouchableArea>

          <SwapSettingsModal
            customSettings={customSettings}
            isOpen={showSwapSettingsModal}
            onClose={onCloseSettingsModal}
          />
        </Popover>
      )}
    </Flex>
  )
}
