import { PropsWithChildren } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { ModalNameType } from 'uniswap/src/features/telemetry/constants'
import { TransactionModalContextState } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import type { SwapFlowTimer } from 'uniswap/src/features/transactions/swap/utils/SwapFlowTimer'

export type TransactionModalProps = PropsWithChildren<{
  modalName: ModalNameType
  onClose: () => void
  onCurrencyChange?: TransactionModalContextState['onCurrencyChange']
  openWalletRestoreModal?: TransactionModalContextState['openWalletRestoreModal']
  swapRedirectCallback?: TransactionModalContextState['swapRedirectCallback']
  renderBiometricsIcon?: TransactionModalContextState['renderBiometricsIcon']
  walletNeedsRestore?: TransactionModalContextState['walletNeedsRestore']
  authTrigger?: TransactionModalContextState['authTrigger']
  passkeyAuthStatus?: TransactionModalContextState['passkeyAuthStatus']
  /**
   * When set (swap flow), wraps modal children so `useSwapFlowTimer()` works inside the
   * bottom-sheet portal. Must live inside `TransactionModal` — a provider above the sheet loses context.
   */
  swapFlowTimer?: SwapFlowTimer
}>

export type TransactionModalInnerContainerProps = PropsWithChildren<{
  bottomSheetViewStyles: StyleProp<ViewStyle>
  fullscreen: boolean
}>

export type TransactionModalFooterContainerProps = PropsWithChildren
