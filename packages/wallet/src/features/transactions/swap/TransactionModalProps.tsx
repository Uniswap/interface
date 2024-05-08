import { PropsWithChildren } from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import { TransactionModalContextState } from 'wallet/src/features/transactions/contexts/TransactionModalContext'
import { ModalNameType } from 'wallet/src/telemetry/constants'

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
