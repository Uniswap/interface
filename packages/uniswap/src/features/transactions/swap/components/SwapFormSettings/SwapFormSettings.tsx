import { useEffect } from 'react'
import type { ColorTokens, FlexProps } from 'ui/src'
import type { IconSizeTokens } from 'ui/src/theme'
import { useTransactionSettingsWithSlippage } from 'uniswap/src/features/transactions/components/settings/hooks/useTransactionSettingsWithSlippage'
import { useSlippageSettings } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/slippage/useSlippageSettings'
import {
  type ModalIdWithSlippage,
  TransactionSettingsModalId,
} from 'uniswap/src/features/transactions/components/settings/stores/TransactionSettingsModalStore/createTransactionSettingsModalStore'
import { TransactionSettingsModalStoreContextProvider } from 'uniswap/src/features/transactions/components/settings/stores/TransactionSettingsModalStore/TransactionSettingsModalStoreContextProvider'
import { useSetTransactionSettingsAutoSlippageTolerance } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import { TransactionSettings as BaseTransactionSettings } from 'uniswap/src/features/transactions/components/settings/TransactionSettings'
import { TransactionSettingsButtonWithSlippage } from 'uniswap/src/features/transactions/components/settings/TransactionSettingsButtonWithSlippage'
import type { TransactionSettingConfig } from 'uniswap/src/features/transactions/components/settings/types'
import SlippageWarningModal from 'uniswap/src/features/transactions/swap/components/SwapFormSettings/SlippageWarningModal'
import { useSwapFormStoreDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { BridgeTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

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

const customModalIds: ModalIdWithSlippage[] = [TransactionSettingsModalId.SlippageWarning]

export function SwapFormSettings(props: SwapFormSettingsProps): JSX.Element {
  const setAutoSlippageTolerance = useSetTransactionSettingsAutoSlippageTolerance()
  const slippageTolerance = useSwapFormStoreDerivedSwapInfo((s) => {
    if (s.trade.trade instanceof BridgeTrade) {
      return 0
    }
    return s.trade.trade?.slippageTolerance ?? s.trade.indicativeTrade?.slippageTolerance
  })

  useEffect(() => {
    setAutoSlippageTolerance(slippageTolerance)
  }, [slippageTolerance, setAutoSlippageTolerance])

  return (
    <TransactionSettingsModalStoreContextProvider<ModalIdWithSlippage> modalIds={customModalIds}>
      <SwapFormSettingsInner {...props} />
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
  isBridgeTrade,
}: SwapFormSettingsProps): JSX.Element {
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
            isZeroSlippage={isBridgeTrade}
            iconColor={iconColor}
            iconSize={iconSize}
          />
        }
        onClose={onCloseSettingsModal}
      />
    </>
  )
}
