import { createContext, useContext } from 'react'
import { ColorTokens, Flex, FlexProps, Popover } from 'ui/src'
import { IconSizeTokens } from 'ui/src/theme'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { TransactionSettingsModal } from 'uniswap/src/features/transactions/components/settings/TransactionSettingsModal/TransactionSettingsModal'
import { useTransactionSettingsContext } from 'uniswap/src/features/transactions/components/settings/contexts/TransactionSettingsContext'
import type { TransactionSettingConfig } from 'uniswap/src/features/transactions/components/settings/types'
import { ViewOnlyModal } from 'uniswap/src/features/transactions/modals/ViewOnlyModal'
import SlippageWarningModal from 'uniswap/src/features/transactions/swap/form/header/SwapFormSettings/SlippageWarningModal'
import { SwapFormSettingsButton } from 'uniswap/src/features/transactions/swap/form/header/SwapFormSettings/SwapFormSettingsButton'
import { ViewOnlyButton } from 'uniswap/src/features/transactions/swap/form/header/SwapFormSettings/ViewOnlyButton'
import { useSlippageSettings } from 'uniswap/src/features/transactions/swap/form/header/SwapFormSettings/settingsConfigurations/slippage/useSlippageSettings'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard/dismissNativeKeyboard'
import { isExtension, isInterface, isMobileApp, isMobileWeb } from 'utilities/src/platform'
import { useEvent } from 'utilities/src/react/hooks'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

export function SwapFormSettings(props: SwapFormSettingsProps): JSX.Element {
  return (
    <SwapFormSettingsProvider>
      <SwapFormSettingsInner {...props} />
    </SwapFormSettingsProvider>
  )
}

interface SwapFormSettingsProps {
  settings: TransactionSettingConfig[]
  adjustTopAlignment?: boolean
  adjustRightAlignment?: boolean
  position?: FlexProps['position']
  iconColor?: ColorTokens
  iconSize?: IconSizeTokens
  defaultTitle?: string
  isBridgeTrade?: boolean
}

function SwapFormSettingsInner({
  settings,
  adjustTopAlignment = true,
  adjustRightAlignment = true,
  position = 'absolute',
  iconColor = '$neutral2',
  iconSize,
  defaultTitle,
  isBridgeTrade,
}: SwapFormSettingsProps): JSX.Element {
  const account = useAccountMeta()
  const { customSlippageTolerance, slippageWarningModalSeen, updateTransactionSettings } =
    useTransactionSettingsContext()
  const { autoSlippageTolerance } = useSlippageSettings()

  const {
    isTransactionSettingsModalVisible,
    showViewOnlyModal,
    showSlippageWarningModal,
    handleShowTransactionSettingsModal,
    handleHideTransactionSettingsModal,
    handleShowViewOnlyModal,
    handleHideViewOnlyModal,
    handleShowSlippageWarningModal,
    handleHideSlippageWarningModal,
  } = useSwapFormSettingsContext()

  const onCloseSettingsModal = useEvent((): void => {
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
  })

  const onPressSwapSettings = useEvent((): void => {
    if (isTransactionSettingsModalVisible) {
      onCloseSettingsModal()
    } else {
      handleShowTransactionSettingsModal()
    }

    dismissNativeKeyboard()
  })

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

interface SwapFormSettingsContextType {
  isTransactionSettingsModalVisible: boolean
  showViewOnlyModal: boolean
  showSlippageWarningModal: boolean
  handleShowTransactionSettingsModal: () => void
  handleHideTransactionSettingsModal: () => void
  handleShowViewOnlyModal: () => void
  handleHideViewOnlyModal: () => void
  handleShowSlippageWarningModal: () => void
  handleHideSlippageWarningModal: () => void
}

const SwapFormSettingsContext = createContext<SwapFormSettingsContextType>({
  isTransactionSettingsModalVisible: false,
  showViewOnlyModal: false,
  showSlippageWarningModal: false,
  handleShowTransactionSettingsModal: () => {},
  handleHideTransactionSettingsModal: () => {},
  handleShowViewOnlyModal: () => {},
  handleHideViewOnlyModal: () => {},
  handleShowSlippageWarningModal: () => {},
  handleHideSlippageWarningModal: () => {},
})

const SwapFormSettingsProvider = ({ children }: { children: React.ReactNode }): JSX.Element => {
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

  return (
    <SwapFormSettingsContext.Provider
      value={{
        isTransactionSettingsModalVisible,
        showViewOnlyModal,
        showSlippageWarningModal,
        handleShowTransactionSettingsModal,
        handleHideTransactionSettingsModal,
        handleShowViewOnlyModal,
        handleHideViewOnlyModal,
        handleShowSlippageWarningModal,
        handleHideSlippageWarningModal,
      }}
    >
      {children}
    </SwapFormSettingsContext.Provider>
  )
}

export const useSwapFormSettingsContext = (): SwapFormSettingsContextType => {
  const context = useContext(SwapFormSettingsContext)
  if (!context) {
    throw new Error('useSwapFormSettingsContext must be used within a SwapFormSettingsProvider')
  }
  return context
}
