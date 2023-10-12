import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { ModalName, SectionName } from 'src/features/telemetry/constants'
import {
  SwapFormContextProvider,
  SwapFormState,
} from 'src/features/transactions/swapRewrite/contexts/SwapFormContext'
import {
  SwapScreen,
  SwapScreenContextProvider,
  useSwapScreenContext,
} from 'src/features/transactions/swapRewrite/contexts/SwapScreenContext'
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

  // We need this additional `screen` state outside of the `SwapScreenContext` because the `SwapScreenContextProvider` needs to be inside the `BottomSheetModal`.
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
      backgroundColor={colors.surface1.get()}
      fullScreen={screen === SwapScreen.SwapForm}
      hideHandlebar={screen === SwapScreen.SwapForm}
      name={ModalName.Swap}
      onClose={onClose}>
      <SwapScreenContextProvider>
        <SwapFormContextProvider prefilledState={modifiedPrefilledState} onClose={onClose}>
          <CurrentScreen setScreen={setScreen} />
        </SwapFormContextProvider>
      </SwapScreenContextProvider>
    </BottomSheetModal>
  )
}

function CurrentScreen({
  setScreen,
}: {
  setScreen: Dispatch<SetStateAction<SwapScreen>>
}): JSX.Element {
  const { screen } = useSwapScreenContext()

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
      return (
        <Trace logImpression section={SectionName.SwapReview}>
          <SwapReview />
        </Trace>
      )
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
