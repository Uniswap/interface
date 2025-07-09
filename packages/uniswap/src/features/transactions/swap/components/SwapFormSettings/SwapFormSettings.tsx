import { createContext, useContext, useEffect } from 'react'
import type { ColorTokens, FlexProps } from 'ui/src'
import { Flex, Popover } from 'ui/src'
import type { IconSizeTokens } from 'ui/src/theme'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { TransactionSettingsModal } from 'uniswap/src/features/transactions/components/settings/TransactionSettingsModal/TransactionSettingsModal'
import {
  useSetTransactionSettingsAutoSlippageTolerance,
  useTransactionSettingsActions,
  useTransactionSettingsStore,
} from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import type { TransactionSettingConfig } from 'uniswap/src/features/transactions/components/settings/types'
import { ViewOnlyModal } from 'uniswap/src/features/transactions/modals/ViewOnlyModal'
import SlippageWarningModal from 'uniswap/src/features/transactions/swap/components/SwapFormSettings/SlippageWarningModal'
import { SwapFormSettingsButton } from 'uniswap/src/features/transactions/swap/components/SwapFormSettings/SwapFormSettingsButton'
import { ViewOnlyButton } from 'uniswap/src/features/transactions/swap/components/SwapFormSettings/ViewOnlyButton'
import { useSlippageSettings } from 'uniswap/src/features/transactions/swap/components/SwapFormSettings/settingsConfigurations/slippage/useSlippageSettings'
import { useSwapFormStoreDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard/dismissNativeKeyboard'
import { isExtension, isInterface, isMobileApp, isMobileWeb } from 'utilities/src/platform'
import { useEvent } from 'utilities/src/react/hooks'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

export function SwapFormSettings(props: SwapFormSettingsProps): JSX.Element {
  const setAutoSlippageTolerance = useSetTransactionSettingsAutoSlippageTolerance()
  const slippageTolerance = useSwapFormStoreDerivedSwapInfo(
    (s) => s.trade.trade?.slippageTolerance ?? s.trade.indicativeTrade?.slippageTolerance,
  )

  useEffect(() => {
    setAutoSlippageTolerance(slippageTolerance)
  }, [slippageTolerance, setAutoSlippageTolerance])

  return <TransactionSettings {...props} />
}

export function TransactionSettings(props: SwapFormSettingsProps): JSX.Element {
  return (
    <SwapFormSettingsModalProvider>
      <SwapFormSettingsInner {...props} />
    </SwapFormSettingsModalProvider>
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
  const { customSlippageTolerance, slippageWarningModalSeen } = useTransactionSettingsStore((s) => ({
    customSlippageTolerance: s.customSlippageTolerance,
    slippageWarningModalSeen: s.slippageWarningModalSeen,
  }))
  const { setSlippageWarningModalSeen } = useTransactionSettingsActions()
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
  } = useSwapFormSettingsModalContext()

  const onCloseSettingsModal = useEvent((): void => {
    const shouldShowSlippageWarning =
      !slippageWarningModalSeen && customSlippageTolerance && customSlippageTolerance >= 20

    if (shouldShowSlippageWarning) {
      // Delay showing the slippage warning modal to avoid conflict with popover dismissal for a smoother UX
      setTimeout(() => {
        handleShowSlippageWarningModal()
        setSlippageWarningModalSeen(true)
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

interface SwapFormSettingsModalContextType {
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

const SwapFormSettingsModalContext = createContext<SwapFormSettingsModalContextType>({
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

const SwapFormSettingsModalProvider = ({ children }: { children: React.ReactNode }): JSX.Element => {
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
    <SwapFormSettingsModalContext.Provider
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
    </SwapFormSettingsModalContext.Provider>
  )
}

export const useSwapFormSettingsModalContext = (): SwapFormSettingsModalContextType => {
  const context = useContext(SwapFormSettingsModalContext)
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!context) {
    throw new Error('useSwapFormSettingsModalContext must be used within a SwapFormSettingsModalProvider')
  }
  return context
}
