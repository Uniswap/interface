import {
  IncreaseLiquidityContextProvider,
  IncreaseLiquidityStep,
  useIncreaseLiquidityContext,
} from 'components/IncreaseLiquidity/IncreaseLiquidityContext'
import { IncreaseLiquidityReview } from 'components/IncreaseLiquidity/IncreaseLiquidityReview'
import { IncreaseLiquidityTxContextProvider } from 'components/IncreaseLiquidity/IncreaseLiquidityTxContext'
import { LiquidityModalHeader } from 'components/Liquidity/LiquidityModalHeader'
import { useModalState } from 'hooks/useModalState'
import { IncreaseLiquidityForm } from 'pages/IncreaseLiquidity/IncreaseLiquidityForm'
import { useLPSlippageValue } from 'pages/Pool/Positions/create/hooks/useLPSlippageValues'
import { useTranslation } from 'react-i18next'
import { HeightAnimator } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TransactionSettingsContextProvider } from 'uniswap/src/features/transactions/components/settings/contexts/TransactionSettingsContext'
import { TransactionSettingKey } from 'uniswap/src/features/transactions/components/settings/slice'

function IncreaseLiquidityModalInner() {
  const { t } = useTranslation()

  const { step, setStep, increaseLiquidityState } = useIncreaseLiquidityContext()
  const { closeModal } = useModalState(ModalName.AddLiquidity)
  const autoSlippageTolerance = useLPSlippageValue(
    increaseLiquidityState.position?.version,
    increaseLiquidityState.position?.currency0Amount.currency,
    increaseLiquidityState.position?.currency1Amount.currency,
  )

  let modalContent
  switch (step) {
    case IncreaseLiquidityStep.Input:
      modalContent = <IncreaseLiquidityForm />
      break
    case IncreaseLiquidityStep.Review:
      modalContent = <IncreaseLiquidityReview onClose={closeModal} />
      break
  }

  return (
    <TransactionSettingsContextProvider
      settingKey={TransactionSettingKey.LP}
      autoSlippageTolerance={autoSlippageTolerance}
    >
      <IncreaseLiquidityTxContextProvider>
        <Modal name={ModalName.AddLiquidity} onClose={closeModal} isDismissible gap="$gap24" padding="$padding16">
          <LiquidityModalHeader
            title={t('common.addLiquidity')}
            closeModal={closeModal}
            goBack={step === IncreaseLiquidityStep.Review ? () => setStep(IncreaseLiquidityStep.Input) : undefined}
          />
          <HeightAnimator animation="fast" useInitialHeight>
            {modalContent}
          </HeightAnimator>
        </Modal>
      </IncreaseLiquidityTxContextProvider>
    </TransactionSettingsContextProvider>
  )
}

export function IncreaseLiquidityModal() {
  return (
    <IncreaseLiquidityContextProvider>
      <IncreaseLiquidityModalInner />
    </IncreaseLiquidityContextProvider>
  )
}
