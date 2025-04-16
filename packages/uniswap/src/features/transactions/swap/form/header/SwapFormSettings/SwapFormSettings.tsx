import { useCallback } from 'react'
import { ColorTokens, Flex, FlexProps, Popover } from 'ui/src'
import { IconSizeTokens } from 'ui/src/theme'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { ViewOnlyModal } from 'uniswap/src/features/transactions/modals/ViewOnlyModal'
import { useTransactionSettingsContext } from 'uniswap/src/features/transactions/settings/contexts/TransactionSettingsContext'
import SlippageWarningModal from 'uniswap/src/features/transactions/swap/form/header/SwapFormSettings/SlippageWarningModal'
import { SwapFormSettingsButton } from 'uniswap/src/features/transactions/swap/form/header/SwapFormSettings/SwapFormSettingsButton'
import { TransactionSettingsModal } from 'uniswap/src/features/transactions/swap/form/header/SwapFormSettings/TransactionSettingsModal/TransactionSettingsModal'
import { ViewOnlyButton } from 'uniswap/src/features/transactions/swap/form/header/SwapFormSettings/ViewOnlyButton'
import { useSlippageSettings } from 'uniswap/src/features/transactions/swap/form/header/SwapFormSettings/settingsConfigurations/hooks/useSlippageSettings'
import type { SwapSettingConfig } from 'uniswap/src/features/transactions/swap/form/header/SwapFormSettings/settingsConfigurations/types'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard'
import { isExtension, isInterface, isMobileApp, isMobileWeb } from 'utilities/src/platform'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

export function SwapFormSettings({
  settings,
  adjustTopAlignment = true,
  adjustRightAlignment = true,
  position = 'absolute',
  iconColor = '$neutral2',
  iconSize,
  defaultTitle,
  isBridgeTrade,
}: {
  settings: SwapSettingConfig[]
  adjustTopAlignment?: boolean
  adjustRightAlignment?: boolean
  position?: FlexProps['position']
  iconColor?: ColorTokens
  iconSize?: IconSizeTokens
  defaultTitle?: string
  isBridgeTrade?: boolean
}): JSX.Element {
  const account = useAccountMeta()
  const { customSlippageTolerance, slippageWarningModalSeen, updateTransactionSettings } =
    useTransactionSettingsContext()
  const { autoSlippageTolerance } = useSlippageSettings()

  const {
    value: isTransactionSettingsModalVisible,
    setTrue: handleShowTransactionSettingsModal,
    setFalse: handleHideTransactionSettingsModal,
  } = useBooleanState(false)

  const {
    value: showViewOnlyModal,
    setTrue: handleShowViewOnlyModal,
    setFalse: handleHideViewOnlyModal,
  } = useBooleanState(false)

  const {
    value: showSlippageWarningModal,
    setTrue: handleShowSlippageWarningModal,
    setFalse: handleHideSlippageWarningModal,
  } = useBooleanState(false)

  const onPressSwapSettings = useCallback((): void => {
    handleShowTransactionSettingsModal()
    dismissNativeKeyboard()
  }, [handleShowTransactionSettingsModal])

  const onCloseSettingsModal = useCallback((): void => {
    const shouldShowSlippageWarning =
      !slippageWarningModalSeen && customSlippageTolerance && customSlippageTolerance >= 20

    if (shouldShowSlippageWarning) {
      // Delay showing the slippage warning modal to avoid conflict with popover dismissal for a smoother UX
      setTimeout(() => {
        handleShowSlippageWarningModal()
        updateTransactionSettings({ slippageWarningModalSeen: true })
      }, 80)

      // Leave swap settings modal open for mobile app (to layer modals), but close for web apps
      if (!isMobileApp) {
        handleHideTransactionSettingsModal()
      }
    } else {
      handleHideTransactionSettingsModal()
    }
  }, [
    slippageWarningModalSeen,
    customSlippageTolerance,
    updateTransactionSettings,
    handleHideTransactionSettingsModal,
    handleShowSlippageWarningModal,
  ])

  const isViewOnlyWallet = account?.type === AccountType.Readonly

  const topAlignment = adjustTopAlignment ? (isInterface ? -38 : 6) : 0
  const rightAlignment = adjustRightAlignment ? (isMobileApp ? 24 : 4) : 0
  const popoverOffset = isInterface
    ? { crossAxis: adjustRightAlignment ? 0 : 8, mainAxis: adjustTopAlignment ? 0 : 8 }
    : undefined

  const shouldShowCustomSlippage = customSlippageTolerance && !isBridgeTrade

  const meetsPlatformConditions = (isInterface || isExtension) && !isMobileWeb
  const exceedsSlippageTolerance = !!customSlippageTolerance && customSlippageTolerance > autoSlippageTolerance

  const shouldShowSettingsIconTooltip =
    meetsPlatformConditions && exceedsSlippageTolerance && !isTransactionSettingsModalVisible

  return (
    <>
      <ViewOnlyModal isOpen={showViewOnlyModal} onDismiss={handleHideViewOnlyModal} />
      <SlippageWarningModal isOpen={showSlippageWarningModal} onClose={handleHideSlippageWarningModal} />
      <Flex row gap="$spacing4" position={position} top={topAlignment} right={rightAlignment} zIndex="$default">
        {isViewOnlyWallet ? (
          <ViewOnlyButton onPress={handleShowViewOnlyModal} />
        ) : (
          <Popover
            offset={popoverOffset}
            placement="bottom-end"
            open={isTransactionSettingsModalVisible}
            onOpenChange={(open: boolean) => {
              // Only close on interface because SwapSettings are rendered in a modal on mobile/extension
              // and when click is triggered inside extension Modal it causes onOpenChange to trigger
              if (!open && isInterface) {
                onCloseSettingsModal()
              }
            }}
          >
            <Flex>
              <SwapFormSettingsButton
                shouldShowCustomSlippage={!!shouldShowCustomSlippage}
                customSlippageTolerance={customSlippageTolerance}
                shouldShowTooltip={shouldShowSettingsIconTooltip}
                iconColor={iconColor}
                iconSize={iconSize}
                onPress={onPressSwapSettings}
              />
              <TransactionSettingsModal
                settings={settings}
                defaultTitle={defaultTitle}
                isOpen={isTransactionSettingsModalVisible}
                onClose={onCloseSettingsModal}
              />
            </Flex>
          </Popover>
        )}
      </Flex>
    </>
  )
}
