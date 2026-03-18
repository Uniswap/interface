import { PropsWithChildren } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { ModalNameType } from 'uniswap/src/features/telemetry/constants'
import { TransactionModalContextState } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'

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
}>

export type TransactionModalInnerContainerProps = PropsWithChildren<{
  bottomSheetViewStyles: StyleProp<ViewStyle>
  fullscreen: boolean
}>

export type TransactionModalFooterContainerProps = PropsWithChildren
