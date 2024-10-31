import { useEffect, useState } from 'react'
import { isWeb } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ModalName, SectionName } from 'uniswap/src/features/telemetry/constants'
import {
  TransactionModal,
  TransactionModalFooterContainer,
} from 'uniswap/src/features/transactions/TransactionModal/TransactionModal'
import {
  TransactionScreen,
  useTransactionModalContext,
} from 'uniswap/src/features/transactions/TransactionModal/TransactionModalContext'
import { TransactionModalProps } from 'uniswap/src/features/transactions/TransactionModal/TransactionModalProps'
import {
  SwapFormContext,
  SwapFormState,
  useSwapFormContext,
} from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { SwapTxContextProviderTradingApi } from 'uniswap/src/features/transactions/swap/contexts/SwapTxContext'
import { SwapFormButton } from 'uniswap/src/features/transactions/swap/form/SwapFormButton'
import { SwapFormScreen } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen'
import { SwapReviewScreen } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen'
import { SwapSettingConfig } from 'uniswap/src/features/transactions/swap/settings/configs/types'
import { SwapCallback } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import { WrapCallback } from 'uniswap/src/features/transactions/swap/types/wrapCallback'
import { isInterface } from 'utilities/src/platform'

export interface SwapFlowProps extends Omit<TransactionModalProps, 'fullscreen' | 'modalName'> {
  prefilledState?: SwapFormState
  customSettings?: SwapSettingConfig[]
  hideHeader?: boolean
  hideFooter?: boolean
  swapCallback: SwapCallback
  wrapCallback: WrapCallback
}

export function SwapFlow({
  customSettings = [],
  swapCallback,
  wrapCallback,
  ...transactionModalProps
}: SwapFlowProps): JSX.Element {
  const swapFormContext = useSwapFormContext()
  return (
    <TransactionModal modalName={ModalName.Swap} {...transactionModalProps}>
      {/* Re-create the SwapFormContextProvider, since native Modal can cause its children to be in a separate component tree. */}
      <SwapFormContext.Provider value={swapFormContext}>
        <SwapTxContextProviderTradingApi>
          <CurrentScreen customSettings={customSettings} swapCallback={swapCallback} wrapCallback={wrapCallback} />
        </SwapTxContextProviderTradingApi>
      </SwapFormContext.Provider>
    </TransactionModal>
  )
}

function CurrentScreen({
  customSettings,
  swapCallback,
  wrapCallback,
}: {
  customSettings: SwapSettingConfig[]
  swapCallback: SwapCallback
  wrapCallback: WrapCallback
}): JSX.Element {
  const { screen, setScreen } = useTransactionModalContext()

  if (isWeb) {
    return (
      <>
        <Trace logImpression section={SectionName.SwapForm}>
          <SwapFormScreen customSettings={customSettings} hideContent={false} wrapCallback={wrapCallback} />
        </Trace>

        {/*
              We want to render the `Modal` from the start to allow the tamagui animation to happen once we switch the `isModalOpen` prop to `true`.
              We only render `SwapReviewScreen` once the user is truly on that step though.
            */}
        <Modal
          alignment={isInterface ? 'center' : 'top'}
          isModalOpen={screen === TransactionScreen.Review}
          name={ModalName.SwapReview}
          onClose={() => setScreen(TransactionScreen.Form)}
        >
          <Trace logImpression section={SectionName.SwapReview}>
            <SwapReviewScreen hideContent={false} swapCallback={swapCallback} wrapCallback={wrapCallback} />
          </Trace>
        </Modal>
      </>
    )
  }

  switch (screen) {
    case TransactionScreen.Form:
      return (
        <Trace logImpression section={SectionName.SwapForm}>
          <SwapFormScreenDelayedRender customSettings={customSettings} />
          <TransactionModalFooterContainer>
            <SwapFormButton />
          </TransactionModalFooterContainer>
        </Trace>
      )
    case TransactionScreen.Review:
      return (
        <Trace logImpression section={SectionName.SwapReview}>
          <SwapReviewScreenDelayedRender swapCallback={swapCallback} wrapCallback={wrapCallback} />
        </Trace>
      )
  }
}

// We add a short hardcoded delay to allow the sheet to animate quickly both on first render and when going back from Review -> Form.
function SwapFormScreenDelayedRender({ customSettings }: { customSettings: SwapSettingConfig[] }): JSX.Element {
  const [hideContent, setHideContent] = useState(true)

  useEffect(() => {
    setTimeout(() => setHideContent(false), 25)
  }, [])

  return <SwapFormScreen customSettings={customSettings} hideContent={hideContent} />
}

// We add a short hardcoded delay to allow the sheet to animate quickly when going from Form -> Review.
function SwapReviewScreenDelayedRender({
  swapCallback,
  wrapCallback,
}: {
  swapCallback: SwapCallback
  wrapCallback: WrapCallback
}): JSX.Element {
  const [hideContent, setHideContent] = useState(true)

  useEffect(() => {
    setTimeout(() => setHideContent(false), 25)
  }, [])

  return <SwapReviewScreen hideContent={hideContent} swapCallback={swapCallback} wrapCallback={wrapCallback} />
}
