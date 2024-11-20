import { useState } from 'react'
import { FadeIn } from 'react-native-reanimated'
import { Flex } from 'ui/src'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import {
  TransactionModalContextProvider,
  TransactionScreen,
} from 'uniswap/src/features/transactions/TransactionModal/TransactionModalContext'
import {
  TransactionModalFooterContainerProps,
  TransactionModalInnerContainerProps,
  TransactionModalProps,
} from 'uniswap/src/features/transactions/TransactionModal/TransactionModalProps'
import { TransactionModalUpdateLogger } from 'uniswap/src/features/transactions/TransactionModal/TransactionModalUpdateLogger'

export function TransactionModal({
  children,
  onClose,
  onCurrencyChange,
  openWalletRestoreModal,
  walletNeedsRestore,
  swapRedirectCallback,
  modalName,
}: TransactionModalProps): JSX.Element {
  const [screen, setScreen] = useState<TransactionScreen>(TransactionScreen.Form)

  return (
    <Flex fill justifyContent="flex-end">
      <TransactionModalContextProvider
        bottomSheetViewStyles={{}}
        openWalletRestoreModal={openWalletRestoreModal}
        walletNeedsRestore={walletNeedsRestore}
        screen={screen}
        setScreen={setScreen}
        swapRedirectCallback={swapRedirectCallback}
        onClose={onClose}
        onCurrencyChange={onCurrencyChange}
      >
        {children}
        <TransactionModalUpdateLogger modalName={modalName} />
      </TransactionModalContextProvider>
    </Flex>
  )
}

export function TransactionModalInnerContainer({
  fullscreen,
  children,
}: TransactionModalInnerContainerProps): JSX.Element {
  return <Flex fill={fullscreen}>{children}</Flex>
}

export function TransactionModalFooterContainer({ children }: TransactionModalFooterContainerProps): JSX.Element {
  return (
    <AnimatedFlex entering={FadeIn} position="relative" pt="$spacing24">
      {children}
    </AnimatedFlex>
  )
}
