import { Modal } from 'uniswap/src/components/modals/Modal'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ModalName, SectionName } from 'uniswap/src/features/telemetry/constants'
import {
  TransactionScreen,
  useTransactionModalContext,
} from 'uniswap/src/features/transactions/TransactionModal/TransactionModalContext'

import { SwapFormScreen } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreen'
import type { SwapSettingConfig } from 'uniswap/src/features/transactions/swap/form/header/SwapFormSettings/settingsConfigurations/types'
import { SwapReviewScreen } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapReviewScreen'
import { isInterface } from 'utilities/src/platform'

export function CurrentScreen({
  settings,
  tokenColor,
}: {
  settings: SwapSettingConfig[]
  onSubmitSwap?: () => Promise<void>
  tokenColor?: string
}): JSX.Element {
  const { screen, setScreen } = useTransactionModalContext()

  return (
    <>
      <Trace logImpression section={SectionName.SwapForm}>
        <SwapFormScreen settings={settings} hideContent={false} tokenColor={tokenColor} />
      </Trace>

      {/*
          We want to render the `Modal` from the start to allow the tamagui animation to happen once we switch the `isModalOpen` prop to `true`.
          We only render `SwapReviewScreen` once the user is truly on that step though.
        */}
      <Modal
        height="auto"
        alignment={isInterface ? 'center' : 'top'}
        isModalOpen={screen === TransactionScreen.Review}
        name={ModalName.SwapReview}
        padding="$spacing12"
        onClose={() => setScreen(TransactionScreen.Form)}
      >
        <Trace logImpression section={SectionName.SwapReview}>
          <SwapReviewScreen hideContent={false} />
        </Trace>
      </Modal>
    </>
  )
}
