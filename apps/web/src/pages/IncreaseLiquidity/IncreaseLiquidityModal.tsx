import {
  IncreaseLiquidityContextProvider,
  IncreaseLiquidityStep,
  useIncreaseLiquidityContext,
} from 'components/IncreaseLiquidity/IncreaseLiquidityContext'
import { IncreaseLiquidityReview } from 'components/IncreaseLiquidity/IncreaseLiquidityReview'
import { IncreaseLiquidityTxContextProvider } from 'components/IncreaseLiquidity/IncreaseLiquidityTxContext'
import { LiquidityModalHeader } from 'components/Liquidity/LiquidityModalHeader'
import { IncreaseLiquidityForm } from 'pages/IncreaseLiquidity/IncreaseLiquidityForm'
import { useTranslation } from 'react-i18next'
import { useCloseModal } from 'state/application/hooks'
import { HeightAnimator } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { MIN_AUTO_SLIPPAGE_TOLERANCE } from 'uniswap/src/constants/transactions'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TransactionSettingsContextProvider } from 'uniswap/src/features/transactions/settings/contexts/TransactionSettingsContext'
import { TransactionSettingKey } from 'uniswap/src/features/transactions/settings/slice'

function IncreaseLiquidityModalInner() {
  const { t } = useTranslation()

  const { step, setStep } = useIncreaseLiquidityContext()
  const onClose = useCloseModal(ModalName.AddLiquidity)

  if (step === IncreaseLiquidityStep.Input) {
    return (
      <Modal name={ModalName.AddLiquidity} onClose={onClose} isDismissible gap="$gap24" padding="$padding16">
        <LiquidityModalHeader title={t('common.addLiquidity')} closeModal={onClose} />
        <HeightAnimator animation="fast">
          <IncreaseLiquidityForm />
        </HeightAnimator>
      </Modal>
    )
  }

  return (
    <Modal
      name={ModalName.AddLiquidity}
      onClose={onClose}
      isDismissible
      gap="$gap12"
      paddingX="$padding8"
      paddingY="$padding12"
      height="max-content"
    >
      <LiquidityModalHeader
        title={t('common.addLiquidity')}
        closeModal={onClose}
        goBack={() => setStep(IncreaseLiquidityStep.Input)}
      />
      <HeightAnimator animation="fast">
        <IncreaseLiquidityReview onClose={onClose} />
      </HeightAnimator>
    </Modal>
  )
}

export function IncreaseLiquidityModal() {
  return (
    <IncreaseLiquidityContextProvider>
      <TransactionSettingsContextProvider
        settingKey={TransactionSettingKey.LP}
        autoSlippageTolerance={MIN_AUTO_SLIPPAGE_TOLERANCE}
      >
        <IncreaseLiquidityTxContextProvider>
          <IncreaseLiquidityModalInner />
        </IncreaseLiquidityTxContextProvider>
      </TransactionSettingsContextProvider>
    </IncreaseLiquidityContextProvider>
  )
}
