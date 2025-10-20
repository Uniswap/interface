import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName, SectionName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import type { TransactionSettingConfig } from 'uniswap/src/features/transactions/components/settings/types'
import {
  TransactionScreen,
  useTransactionModalContext,
} from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { UnichainInstantBalanceModal } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/UnichainInstantBalanceModal'
import { SwapFormScreen } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreen'
import { useIsUnichainFlashblocksEnabled } from 'uniswap/src/features/transactions/swap/hooks/useIsUnichainFlashblocksEnabled'
import { SwapReviewScreen } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapReviewScreen'
import { useSwapDependenciesStore } from 'uniswap/src/features/transactions/swap/stores/swapDependenciesStore/useSwapDependenciesStore'
import { isWebApp } from 'utilities/src/platform'

export function CurrentScreen({
  settings,
  onSubmitSwap,
  tokenColor,
}: {
  settings: TransactionSettingConfig[]
  onSubmitSwap?: () => Promise<void> | void
  tokenColor?: string
}): JSX.Element {
  const { screen, setScreen } = useTransactionModalContext()

  const chainId = useSwapDependenciesStore((s) => s.derivedSwapInfo.chainId)
  const isFlashblocksEnabled = useIsUnichainFlashblocksEnabled(chainId)

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
        alignment={isWebApp ? 'center' : 'top'}
        isModalOpen={screen === TransactionScreen.Review}
        name={ModalName.SwapReview}
        padding="$spacing12"
        gap={0}
        onClose={() => setScreen(TransactionScreen.Form)}
      >
        <Trace logImpression section={SectionName.SwapReview}>
          <SwapReviewScreen hideContent={false} onSubmitSwap={onSubmitSwap} />
        </Trace>
      </Modal>

      {isFlashblocksEnabled && <UnichainInstantBalanceModal />}
    </>
  )
}
