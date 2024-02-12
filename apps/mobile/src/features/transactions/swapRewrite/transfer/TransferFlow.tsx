import { Dispatch, ReactNode, SetStateAction, useEffect, useMemo, useState } from 'react'
import { useAppSelector } from 'src/app/hooks'
import { selectModalState } from 'src/features/modals/selectModalState'
import { ModalName, SectionName } from 'src/features/telemetry/constants'
import {
  SwapFormContextProvider,
  SwapFormState,
} from 'src/features/transactions/swapRewrite/contexts/SwapFormContext'
import {
  TransferScreen,
  TransferScreenContextProvider,
  useTransferScreenContext,
} from 'src/features/transactions/swapRewrite/contexts/TransferScreenContex'
import { useOnCloseSendModal } from 'src/features/transactions/swapRewrite/hooks/useOnCloseSwapModal'
import { TransactionModal } from 'src/features/transactions/swapRewrite/TransactionModal'
import { TransferFormScreen } from 'src/features/transactions/swapRewrite/transfer/TransferFormScreen'
import { getFocusOnCurrencyFieldFromInitialState } from 'src/features/transactions/swapRewrite/utils'
import { Trace } from 'utilities/src/telemetry/trace/Trace'

export function TransferFlow(): JSX.Element {
  // We need this additional `screen` state outside of the `SwapScreenContext` because the `TransferContextProvider` needs to be inside the `BottomSheetModal`'s `Container`.
  const [screen, setScreen] = useState<TransferScreen>(TransferScreen.TransferForm)
  const fullscreen = screen === TransferScreen.TransferForm
  const onClose = useOnCloseSendModal()

  return (
    <TransactionModal fullscreen={fullscreen} modalName={ModalName.Send} onClose={onClose}>
      <TransferContextsContainer>
        <CurrentScreen screen={screen} setScreen={setScreen} />
      </TransferContextsContainer>
    </TransactionModal>
  )
}

function CurrentScreen({
  screen,
  setScreen,
}: {
  screen: TransferScreen
  setScreen: Dispatch<SetStateAction<TransferScreen>>
}): JSX.Element {
  const { screen: contextScreen, screenRef: contextScreenRef } = useTransferScreenContext()

  useEffect(() => {
    setScreen(contextScreen)
  }, [contextScreen, contextScreenRef, setScreen])

  switch (screen) {
    case TransferScreen.TransferForm:
      return (
        <Trace logImpression section={SectionName.TransferForm}>
          <TransferFormScreenDelayedRender />
        </Trace>
      )
    default:
      throw new Error(`Unknown screen: ${screen}`)
  }
}

function TransferFormScreenDelayedRender(): JSX.Element {
  const [hideContent, setHideContent] = useState(true)
  useEffect(() => {
    setTimeout(() => setHideContent(false), 25)
  }, [])
  return <TransferFormScreen hideContent={hideContent} />
}

function TransferContextsContainer({ children }: { children?: ReactNode }): JSX.Element {
  const onClose = useOnCloseSendModal()
  const { initialState } = useAppSelector(selectModalState(ModalName.Send))

  const prefilledState = useMemo(
    (): SwapFormState | undefined =>
      initialState
        ? {
            customSlippageTolerance: initialState.customSlippageTolerance,
            exactAmountFiat: initialState.exactAmountFiat,
            exactAmountToken: initialState.exactAmountToken,
            exactCurrencyField: initialState.exactCurrencyField,
            focusOnCurrencyField: getFocusOnCurrencyFieldFromInitialState(initialState),
            input: initialState.input ?? undefined,
            output: initialState.output ?? undefined,
            selectingCurrencyField: initialState.selectingCurrencyField,
            txId: initialState.txId,
            isFiatMode: false,
            isSubmitting: false,
          }
        : undefined,
    [initialState]
  )

  return (
    <TransferScreenContextProvider>
      <SwapFormContextProvider prefilledState={prefilledState} onClose={onClose}>
        {children}
      </SwapFormContextProvider>
    </TransferScreenContextProvider>
  )
}
