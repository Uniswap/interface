import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { ModalName, SectionName } from 'src/features/telemetry/constants'
import {
  SwapContextProvider,
  SwapFormState,
  SwapScreen,
  useSwapContext,
} from 'src/features/transactions/swapRewrite/SwapContext'
import { useSporeColors } from 'ui/src'
import { Trace } from 'utilities/src/telemetry/trace/Trace'
import {
  CurrencyField,
  TransactionState,
} from 'wallet/src/features/transactions/transactionState/types'
import { SwapForm } from './SwapForm'
import { SwapReview } from './SwapReview'

export function SwapFlow({
  prefilledState,
  onClose,
}: {
  prefilledState?: TransactionState
  onClose: () => void
}): JSX.Element {
  const colors = useSporeColors()

  // We need this additional `screen` state outside of the `SwapContext` because the `SwapContextProvider` needs to be inside the `BottomSheetModal`.
  const [screen, setScreen] = useState<SwapScreen>(SwapScreen.SwapForm)

  const modifiedPrefilledState = useMemo(
    (): SwapFormState | undefined =>
      prefilledState
        ? {
            customSlippageTolerance: prefilledState.customSlippageTolerance,
            exactAmountFiat: prefilledState.exactAmountUSD,
            exactAmountToken: prefilledState.exactAmountToken,
            exactCurrencyField: prefilledState.exactCurrencyField,
            focusOnCurrencyField: getFocusOnCurrencyField(prefilledState),
            input: prefilledState.input ?? undefined,
            output: prefilledState.output ?? undefined,
            screen: SwapScreen.SwapForm,
            selectingCurrencyField: prefilledState.selectingCurrencyField,
            txId: prefilledState.txId,
          }
        : undefined,
    [prefilledState]
  )

  return (
    <BottomSheetModal
      hideKeyboardOnDismiss
      renderBehindInset
      backgroundColor={colors.surface1.val}
      fullScreen={screen === SwapScreen.SwapForm}
      hideHandlebar={screen === SwapScreen.SwapForm}
      name={ModalName.Swap}
      onClose={onClose}>
      <SwapContextProvider prefilledState={modifiedPrefilledState} onClose={onClose}>
        <CurrentScreen setScreen={setScreen} />
      </SwapContextProvider>
    </BottomSheetModal>
  )
}

function CurrentScreen({
  setScreen,
}: {
  setScreen: Dispatch<SetStateAction<SwapScreen>>
}): JSX.Element {
  const { screen } = useSwapContext()

  useEffect(() => {
    setScreen(screen)
  }, [screen, setScreen])

  switch (screen) {
    case SwapScreen.SwapForm:
      return (
        <Trace logImpression section={SectionName.SwapForm}>
          <SwapForm />
        </Trace>
      )
    case SwapScreen.SwapReview:
      return <SwapReview />
    default:
      throw new Error(`Unknown screen: ${screen}`)
  }
}

function getFocusOnCurrencyField({
  focusOnCurrencyField,
  input,
  output,
  exactCurrencyField,
}: TransactionState): CurrencyField | undefined {
  if (focusOnCurrencyField) {
    return focusOnCurrencyField
  }

  if (input && exactCurrencyField === CurrencyField.INPUT) {
    return CurrencyField.INPUT
  }

  if (output && exactCurrencyField === CurrencyField.OUTPUT) {
    return CurrencyField.OUTPUT
  }

  return undefined
}
