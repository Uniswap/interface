import { isWebApp } from '@universe/environment'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName, SectionName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import type { TransactionSettingConfig } from 'uniswap/src/features/transactions/components/settings/types'
import {
  TransactionScreen,
  useTransactionModalContext,
} from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { SwapFormScreen } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreen'
import { useSwapOnPrevious } from 'uniswap/src/features/transactions/swap/review/hooks/useSwapOnPrevious'
import {
  SwapReviewScreen,
  SwapReviewScreenProviders,
} from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapReviewScreen'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'

export function CurrentScreen({
  settings,
  onSubmitSwap,
  tokenColor,
  onCurrencyPanelsLayout,
}: {
  settings: TransactionSettingConfig[]
  onSubmitSwap?: () => Promise<void> | void
  tokenColor?: string
  onCurrencyPanelsLayout?: (height: number) => void
}): JSX.Element {
  const { screen } = useTransactionModalContext()

  const isSubmitting = useSwapFormStore((s) => s.isSubmitting)
  const { onPrev } = useSwapOnPrevious()

  return (
    <>
      <Trace logImpression section={SectionName.SwapForm}>
        <SwapFormScreen
          settings={settings}
          hideContent={false}
          tokenColor={tokenColor}
          onCurrencyPanelsLayout={onCurrencyPanelsLayout}
        />
      </Trace>

      {/*
          We want to render the `Modal` from the start to allow the tamagui animation to happen once we switch the `isModalOpen` prop to `true`.
          We only render `SwapReviewScreen` once the user is truly on that step though.
        */}
      <SwapReviewScreenProviders hideContent={false} onSubmitSwap={onSubmitSwap}>
        <Modal
          height="auto"
          alignment={isWebApp ? 'center' : 'top'}
          isModalOpen={screen === TransactionScreen.Review}
          isDismissible={!isSubmitting}
          name={ModalName.SwapReview}
          padding="$spacing12"
          gap={0}
          onClose={onPrev}
        >
          {screen === TransactionScreen.Review && (
            <Trace logImpression section={SectionName.SwapReview}>
              <SwapReviewScreen />
            </Trace>
          )}
        </Modal>
      </SwapReviewScreenProviders>
    </>
  )
}
