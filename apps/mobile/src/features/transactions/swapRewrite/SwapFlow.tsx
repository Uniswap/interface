import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react'
import { TouchableWithoutFeedback } from 'react-native'
import { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { HandleBar } from 'src/components/modals/HandleBar'
import { IS_ANDROID } from 'src/constants/globals'
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
import { SwapTxContextProvider } from 'src/features/transactions/swapRewrite/contexts/SwapTxContext'
import { SwapFormScreen } from 'src/features/transactions/swapRewrite/SwapFormScreen'
import { SwapPendingScreen } from 'src/features/transactions/swapRewrite/SwapPendingScreen'
import { SwapReviewScreen } from 'src/features/transactions/swapRewrite/SwapReviewScreen'
import { AnimatedFlex, Flex, useSporeColors } from 'ui/src'
import { Trace } from 'utilities/src/telemetry/trace/Trace'
import {
  CurrencyField,
  TransactionState,
} from 'wallet/src/features/transactions/transactionState/types'

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
            exactAmountFiat: prefilledState.exactAmountFiat,
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

  const insets = useSafeAreaInsets()

  const screenXOffset = useSharedValue(0)

  const wrapperStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: screenXOffset.value }],
  }))

  const shouldShowFullscreen = screen === SwapScreen.SwapForm || screen === SwapScreen.SwapPending

  return (
    <BottomSheetModal
      hideKeyboardOnDismiss
      renderBehindInset
      backgroundColor={colors.surface1.get()}
      fullScreen={shouldShowFullscreen}
      hideHandlebar={shouldShowFullscreen}
      name={ModalName.Swap}
      onClose={onClose}>
      <TouchableWithoutFeedback>
        <Flex mt={shouldShowFullscreen ? insets.top : '$spacing8'}>
          {shouldShowFullscreen && <HandleBar backgroundColor="none" />}

          <AnimatedFlex grow row height="100%" style={wrapperStyle}>
            <Flex
              pb={IS_ANDROID ? '$spacing32' : '$spacing16'}
              px="$spacing16"
              style={{ marginBottom: insets.bottom }}
              width="100%">
              <SwapScreenContextProvider>
                <SwapFormContextProvider prefilledState={modifiedPrefilledState} onClose={onClose}>
                  <SwapTxContextProvider>
                    <CurrentScreen setScreen={setScreen} />
                  </SwapTxContextProvider>
                </SwapFormContextProvider>
              </SwapScreenContextProvider>
            </Flex>
          </AnimatedFlex>
        </Flex>
      </TouchableWithoutFeedback>
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
          <SwapFormScreen />
        </Trace>
      )
    case SwapScreen.SwapReview:
      return (
        <Trace logImpression section={SectionName.SwapReview}>
          <SwapReviewScreen />
        </Trace>
      )
    case SwapScreen.SwapPending:
      return (
        <Trace logImpression section={SectionName.SwapPending}>
          <SwapPendingScreen />
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
