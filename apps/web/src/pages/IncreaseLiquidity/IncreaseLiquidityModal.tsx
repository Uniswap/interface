import {
  IncreaseLiquidityContextProvider,
  IncreaseLiquidityStep,
  useIncreaseLiquidityContext,
} from 'components/IncreaseLiquidity/IncreaseLiquidityContext'
import { IncreaseLiquidityReview } from 'components/IncreaseLiquidity/IncreaseLiquidityReview'
import { IncreaseLiquidityTxContextProvider } from 'components/IncreaseLiquidity/IncreaseLiquidityTxContext'
import { LiquidityModalHeader } from 'components/Liquidity/LiquidityModalHeader'
import { IncreaseLiquidityForm } from 'pages/IncreaseLiquidity/IncreaseLiquidityForm'
import { useCloseModal } from 'state/application/hooks'
import { Flex, HeightAnimator } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useTranslation } from 'uniswap/src/i18n'

function IncreaseLiquidityModalInner() {
  const { t } = useTranslation()

  const { step, setStep } = useIncreaseLiquidityContext()
  const onClose = useCloseModal(ModalName.AddLiquidity)

  let modalContent
  switch (step) {
    case IncreaseLiquidityStep.Input:
      modalContent = <IncreaseLiquidityForm />
      break
    case IncreaseLiquidityStep.Review:
      modalContent = <IncreaseLiquidityReview onClose={onClose} />
      break
  }

  return (
    <Modal name={ModalName.AddLiquidity} onClose={onClose} isDismissible>
      <Flex px="$padding16" mb="$spacing24">
        <LiquidityModalHeader
          title={t('common.addLiquidity')}
          closeModal={onClose}
          goBack={step === IncreaseLiquidityStep.Review ? () => setStep(IncreaseLiquidityStep.Input) : undefined}
        />
      </Flex>
      <HeightAnimator animation="fast">{modalContent}</HeightAnimator>
    </Modal>
  )
}

export function IncreaseLiquidityModal() {
  return (
    <IncreaseLiquidityContextProvider>
      <IncreaseLiquidityTxContextProvider>
        <IncreaseLiquidityModalInner />
      </IncreaseLiquidityTxContextProvider>
    </IncreaseLiquidityContextProvider>
  )
}
