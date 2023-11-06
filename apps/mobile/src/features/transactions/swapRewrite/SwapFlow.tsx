import { BottomSheetFooter } from '@gorhom/bottom-sheet'
import React, {
  ComponentProps,
  Dispatch,
  ReactNode,
  SetStateAction,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { TouchableWithoutFeedback } from 'react-native'
import { FadeIn } from 'react-native-reanimated'
import { useAppSelector } from 'src/app/hooks'
import { useBottomSheetContext } from 'src/components/modals/BottomSheetContext'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { HandleBar } from 'src/components/modals/HandleBar'
import { selectModalState } from 'src/features/modals/selectModalState'
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
import { useOnCloseSwapModal } from 'src/features/transactions/swapRewrite/hooks/useOnCloseSwapModal'
import { SwapFormButton } from 'src/features/transactions/swapRewrite/SwapFormButton'
import { SwapFormScreen } from 'src/features/transactions/swapRewrite/SwapFormScreen'
import { SwapPendingScreen } from 'src/features/transactions/swapRewrite/SwapPendingScreen'
import { SwapReviewScreen } from 'src/features/transactions/swapRewrite/SwapReviewScreen'
import { AnimatedFlex, Flex, LinearGradient, useDeviceInsets, useSporeColors } from 'ui/src'
import { opacify } from 'ui/src/theme'
import { Trace } from 'utilities/src/telemetry/trace/Trace'
import {
  CurrencyField,
  TransactionState,
} from 'wallet/src/features/transactions/transactionState/types'

export function SwapFlow(): JSX.Element {
  const colors = useSporeColors()

  // We need this additional `screen` state outside of the `SwapScreenContext` because the `SwapScreenContextProvider` needs to be inside the `BottomSheetModal`'s `Container`.
  const [screen, setScreen] = useState<SwapScreen>(SwapScreen.SwapForm)

  const onCloseSwapModal = useOnCloseSwapModal()

  const insets = useDeviceInsets()

  const shouldShowFullscreen = screen === SwapScreen.SwapForm || screen === SwapScreen.SwapPending

  return (
    <BottomSheetModal
      hideKeyboardOnDismiss
      renderBehindTopInset
      backgroundColor={colors.surface1.get()}
      containerComponent={Container}
      footerComponent={Footer}
      fullScreen={shouldShowFullscreen}
      hideHandlebar={shouldShowFullscreen}
      name={ModalName.Swap}
      onClose={onCloseSwapModal}>
      <TouchableWithoutFeedback>
        <Flex mt={shouldShowFullscreen ? insets.top : '$spacing8'}>
          {shouldShowFullscreen && <HandleBar backgroundColor="none" />}

          <AnimatedFlex grow row height={shouldShowFullscreen ? '100%' : undefined}>
            <Flex px="$spacing16" width="100%">
              <CurrentScreen screen={screen} setScreen={setScreen} />
            </Flex>
          </AnimatedFlex>
        </Flex>
      </TouchableWithoutFeedback>
    </BottomSheetModal>
  )
}

function Container({ children }: { children?: ReactNode }): JSX.Element {
  const onCloseSwapModal = useOnCloseSwapModal()
  const { initialState } = useAppSelector(selectModalState(ModalName.Swap))

  const prefilledState = useMemo(
    (): SwapFormState | undefined =>
      initialState
        ? {
            customSlippageTolerance: initialState.customSlippageTolerance,
            exactAmountFiat: initialState.exactAmountFiat,
            exactAmountToken: initialState.exactAmountToken,
            exactCurrencyField: initialState.exactCurrencyField,
            focusOnCurrencyField: getFocusOnCurrencyField(initialState),
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
    <SwapScreenContextProvider>
      <SwapFormContextProvider prefilledState={prefilledState} onClose={onCloseSwapModal}>
        <SwapTxContextProvider>{children}</SwapTxContextProvider>
      </SwapFormContextProvider>
    </SwapScreenContextProvider>
  )
}

function Footer({
  animatedFooterPosition,
}: {
  animatedFooterPosition: ComponentProps<typeof BottomSheetFooter>['animatedFooterPosition']
}): JSX.Element {
  const { screen } = useSwapScreenContext()
  const colors = useSporeColors()
  const insets = useDeviceInsets()

  if (screen === SwapScreen.SwapForm || screen === SwapScreen.SwapReviewHoldingToSwap) {
    return (
      <BottomSheetFooter animatedFooterPosition={animatedFooterPosition}>
        <AnimatedFlex entering={FadeIn} pb={insets.bottom} position="relative" pt="$spacing24">
          <SwapFormButton />

          {/*
            This gradient adds a background behind the footer so that the content is hidden behind it
            when the user is moving the sheet, while the footer stays in place.
          */}
          <Flex bottom={0} left={0} position="absolute" right={0} top={0} zIndex={-1}>
            <LinearGradient
              colors={[opacify(0, colors.background.val), colors.background.val]}
              end={[0, 0.15]}
              height="100%"
              start={[0, 0]}
              width="100%"
            />
          </Flex>
        </AnimatedFlex>
      </BottomSheetFooter>
    )
  }

  return <></>
}

function CurrentScreen({
  screen,
  setScreen,
}: {
  screen: SwapScreen
  setScreen: Dispatch<SetStateAction<SwapScreen>>
}): JSX.Element {
  const { screen: contextScreen, screenRef: contextScreenRef } = useSwapScreenContext()

  useEffect(() => {
    setScreen(contextScreen)
  }, [contextScreen, contextScreenRef, setScreen])

  switch (screen) {
    case SwapScreen.SwapForm:
      return (
        <Trace logImpression section={SectionName.SwapForm}>
          <SwapFormScreenDelayedRender />
        </Trace>
      )
    case SwapScreen.SwapReview:
    case SwapScreen.SwapReviewHoldingToSwap:
      return (
        <Trace logImpression section={SectionName.SwapReview}>
          <SwapReviewScreenDelayedRender />
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

// We delay rendering of the `SwapFormScreen` until the bottom sheet is ready,
// and we also add a short hardcoded delay to allow the sheet to animate quickly when going back from Review -> Form.
// Note: we do this instead of using `isSheetReady` within `BottomSheetModal`, because `isSheetReady`only applies to first render or modal.
function SwapFormScreenDelayedRender(): JSX.Element {
  const { isSheetReady } = useBottomSheetContext()
  const [hideContent, setHideContent] = useState(true)

  useEffect(() => {
    setTimeout(() => setHideContent(false), 25)
  }, [])

  return <SwapFormScreen hideContent={hideContent || !isSheetReady} />
}

// We add a short hardcoded delay to allow the sheet to animate quickly when going from Form -> Review.
function SwapReviewScreenDelayedRender(): JSX.Element {
  const [hideContent, setHideContent] = useState(true)

  useEffect(() => {
    setTimeout(() => setHideContent(false), 25)
  }, [])

  return <SwapReviewScreen hideContent={hideContent} />
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
