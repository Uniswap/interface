import { PropsWithChildren } from 'react'
/* eslint-disable no-restricted-imports */
import type { StyleProp } from 'react-native/Libraries/StyleSheet/StyleSheet'
import type { ViewStyle } from 'react-native/Libraries/StyleSheet/StyleSheetTypes'
import { ModalNameType } from 'uniswap/src/features/telemetry/constants'
import { TransactionModalContextState } from 'uniswap/src/features/transactions/TransactionModal/TransactionModalContext'

export type TransactionModalProps = PropsWithChildren<{
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
