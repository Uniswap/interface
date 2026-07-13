import { useEffect } from 'react'
import type { ColorTokens, FlexProps } from 'ui/src'
import type { IconSizeTokens } from 'ui/src/theme'
import { chainIdToPlatform } from 'uniswap/src/features/platforms/utils/chains'
import { useTransactionSettingsWithSlippage } from 'uniswap/src/features/transactions/components/settings/hooks/useTransactionSettingsWithSlippage'
import { Slippage } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/slippage/Slippage/Slippage'
import { useSlippageSettings } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/slippage/useSlippageSettings'
import {
  type ModalIdWithSlippage,
  TransactionSettingsModalId,
} from 'uniswap/src/features/transactions/components/settings/stores/TransactionSettingsModalStore/createTransactionSettingsModalStore'
import { TransactionSettingsModalStoreContextProvider } from 'uniswap/src/features/transactions/components/settings/stores/TransactionSettingsModalStore/TransactionSettingsModalStoreContextProvider'
import {
  useSetTransactionSettingsAutoSlippageTolerance,
  useTransactionSettingsStore,
} from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import { TransactionSettings as BaseTransactionSettings } from 'uniswap/src/features/transactions/components/settings/TransactionSettings'
import { TransactionSettingsButtonWithSlippage } from 'uniswap/src/features/transactions/components/settings/TransactionSettingsButtonWithSlippage'
import type { TransactionSettingConfig } from 'uniswap/src/features/transactions/components/settings/types'
import {
  filterSettingsByPlatformAndTradeRouting,
  getShouldSettingApplyToRouting,
} from 'uniswap/src/features/transactions/components/settings/utils'
import SlippageWarningModal from 'uniswap/src/features/transactions/swap/components/SwapFormSettings/SlippageWarningModal'
import { useSwapFormStoreDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

export interface SwapFormSettingsProps {
  settings: TransactionSettingConfig[]
  adjustTopAlignment?: boolean
  adjustRightAlignment?: boolean
  position?: FlexProps['position']
  iconColor?: ColorTokens
  iconSize?: IconSizeTokens
  defaultTitle?: string
}

interface SwapFormSettingsInnerProps extends SwapFormSettingsProps {
  isZeroSlippage: boolean
}

const customModalIds: ModalIdWithSlippage[] = [TransactionSettingsModalId.SlippageWarning]

export function SwapFormSettings({ settings, ...restProps }: SwapFormSettingsProps): JSX.Element {
  const setAutoSlippageTolerance = useSetTransactionSettingsAutoSlippageTolerance()
  const customSlippageTolerance = useTransactionSettingsStore((s) => s.customSlippageTolerance)
  const { slippageTolerance, chainId, tradeRouting } = useSwapFormStoreDerivedSwapInfo((s) => {
    const routing = s.trade.trade?.routing
    return {
      slippageTolerance: getShouldSettingApplyToRouting(Slippage, routing)
        ? (s.trade.trade?.slippageTolerance ?? s.trade.indicativeTrade?.slippageTolerance)
        : 0,
      chainId: s.chainId,
      tradeRouting: routing,
    }
  })

  // The trade's slippage reflects the user's custom value when one is set, so syncing it
  // here would overwrite the auto-calculated tolerance. Preserve the last-known auto value
  // while a custom slippage is active so the high-slippage warning can compare against it.
  useEffect(() => {
    if (customSlippageTolerance !== undefined) {
      return
    }
    setAutoSlippageTolerance(slippageTolerance)
  }, [customSlippageTolerance, slippageTolerance, setAutoSlippageTolerance])

  const filteredSettings = filterSettingsByPlatformAndTradeRouting(settings, {
    platform: chainIdToPlatform(chainId),
    tradeRouting,
  })
  const isZeroSlippage = !getShouldSettingApplyToRouting(Slippage, tradeRouting)

  return (
    <TransactionSettingsModalStoreContextProvider<ModalIdWithSlippage> modalIds={customModalIds}>
      <SwapFormSettingsInner {...restProps} settings={filteredSettings} isZeroSlippage={isZeroSlippage} />
    </TransactionSettingsModalStoreContextProvider>
  )
}

export function SwapFormSettingsInner({
  settings,
  adjustTopAlignment = true,
  adjustRightAlignment = true,
  position = 'absolute',
  iconColor = '$neutral2',
  iconSize,
  defaultTitle,
  isZeroSlippage,
}: SwapFormSettingsInnerProps): JSX.Element {
  const { isSlippageWarningModalVisible, handleHideSlippageWarningModalWithSeen, onCloseSettingsModal } =
    useTransactionSettingsWithSlippage()
  const { autoSlippageTolerance } = useSlippageSettings()

  return (
    <>
      <SlippageWarningModal isOpen={isSlippageWarningModalVisible} onClose={handleHideSlippageWarningModalWithSeen} />
      <BaseTransactionSettings
        settings={settings}
        adjustTopAlignment={adjustTopAlignment}
        adjustRightAlignment={adjustRightAlignment}
        position={position}
        iconColor={iconColor}
        iconSize={iconSize}
        defaultTitle={defaultTitle}
        testID={TestID.SwapSettings}
        CustomSettingsButton={
          <TransactionSettingsButtonWithSlippage
            autoSlippageTolerance={autoSlippageTolerance}
            isZeroSlippage={isZeroSlippage}
            iconColor={iconColor}
            iconSize={iconSize}
          />
        }
        onClose={onCloseSettingsModal}
      />
    </>
  )
}
