import { FadeIn } from 'react-native-reanimated'
import { AnimatedFlex, Flex } from 'ui/src'
import { TransactionModalContextProvider } from 'wallet/src/features/transactions/contexts/TransactionModalContext'
import {
  TransactionModalFooterContainerProps,
  TransactionModalInnerContainerProps,
  TransactionModalProps,
} from 'wallet/src/features/transactions/swap/TransactionModalProps'

export function TransactionModal({
  children,
  // fullscreen,
  // modalName,
  onClose,
  openWalletRestoreModal,
  walletNeedsRestore,
}: TransactionModalProps): JSX.Element {
  return (
    <Flex fill justifyContent="flex-end">
      <TransactionModalContextProvider
        bottomSheetViewStyles={{}}
        handleContentLayout={(): void => undefined}
        openWalletRestoreModal={openWalletRestoreModal}
        walletNeedsRestore={walletNeedsRestore}
        onClose={onClose}>
        {children}
      </TransactionModalContextProvider>
    </Flex>
  )
}

export function TransactionModalInnerContainer({
  // bottomSheetViewStyles,
  onLayout,
  fullscreen,
  children,
}: TransactionModalInnerContainerProps): JSX.Element {
  return (
    <Flex fill={fullscreen} onLayout={onLayout}>
      {children}
    </Flex>
  )
}

export function TransactionModalFooterContainer({
  children,
}: TransactionModalFooterContainerProps): JSX.Element {
  return (
    <AnimatedFlex entering={FadeIn} position="relative" pt="$spacing24">
      {children}
    </AnimatedFlex>
  )
}
