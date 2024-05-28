import { PropsWithChildren } from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import { ModalNameType } from 'uniswap/src/features/telemetry/constants'
import { TransactionModalContextState } from 'wallet/src/features/transactions/contexts/TransactionModalContext'

export type TransactionModalProps = PropsWithChildren<{
  fullscreen: boolean
  modalName: ModalNameType
  onClose: () => void
  openWalletRestoreModal?: TransactionModalContextState['openWalletRestoreModal']
  walletNeedsRestore?: TransactionModalContextState['walletNeedsRestore']
  BiometricsIcon?: TransactionModalContextState['BiometricsIcon']
  authTrigger?: TransactionModalContextState['authTrigger']
}>

export type TransactionModalInnerContainerProps = PropsWithChildren<{
  bottomSheetViewStyles: StyleProp<ViewStyle>
  fullscreen: boolean
}>

export type TransactionModalFooterContainerProps = PropsWithChildren
