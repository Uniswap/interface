// eslint-disable-next-line no-restricted-imports
import { LiquidityModalHeader } from 'components/Liquidity/LiquidityModalHeader'
import {
  DecreaseLiquidityStep,
  RemoveLiquidityModalContextProvider,
  useRemoveLiquidityModalContext,
} from 'components/RemoveLiquidity/RemoveLiquidityModalContext'
import { RemoveLiquidityReview } from 'components/RemoveLiquidity/RemoveLiquidityReview'
import { RemoveLiquidityTxContextProvider } from 'components/RemoveLiquidity/RemoveLiquidityTxContext'
import { RemoveLiquidityForm } from 'pages/RemoveLiquidity/RemoveLiquidityForm'
import { useCloseModal } from 'state/application/hooks'
import { HeightAnimator } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { MIN_AUTO_SLIPPAGE_TOLERANCE } from 'uniswap/src/constants/transactions'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { SwapSettingsContextProvider } from 'uniswap/src/features/transactions/swap/settings/contexts/SwapSettingsContext'
import { useTranslation } from 'uniswap/src/i18n'

function RemoveLiquidityModalInner() {
  const closeModal = useCloseModal(ModalName.RemoveLiquidity)
  const { t } = useTranslation()
  const { step, setStep } = useRemoveLiquidityModalContext()

  let modalContent
  switch (step) {
    case DecreaseLiquidityStep.Input:
      modalContent = <RemoveLiquidityForm />
      break
    case DecreaseLiquidityStep.Review:
      modalContent = <RemoveLiquidityReview onClose={closeModal} />
      break
  }

  return (
    <Modal
      name={ModalName.RemoveLiquidity}
      onClose={closeModal}
      isDismissible
      gap="$gap24"
      padding="$padding16"
      height="max-content"
    >
      <LiquidityModalHeader
        title={t('pool.removeLiquidity')}
        closeModal={closeModal}
        goBack={step === DecreaseLiquidityStep.Review ? () => setStep(DecreaseLiquidityStep.Input) : undefined}
      />
      <HeightAnimator animation="fast">{modalContent}</HeightAnimator>
    </Modal>
  )
}

export function RemoveLiquidityModal() {
  return (
    <RemoveLiquidityModalContextProvider>
      <SwapSettingsContextProvider autoSlippageTolerance={MIN_AUTO_SLIPPAGE_TOLERANCE}>
        <RemoveLiquidityTxContextProvider>
          <RemoveLiquidityModalInner />
        </RemoveLiquidityTxContextProvider>
      </SwapSettingsContextProvider>
    </RemoveLiquidityModalContextProvider>
  )
}
