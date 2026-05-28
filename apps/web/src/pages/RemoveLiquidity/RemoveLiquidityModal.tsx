// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { LiquidityModalHeader } from 'components/Liquidity/LiquidityModalHeader'
import {
  DecreaseLiquidityStep,
  RemoveLiquidityModalContextProvider,
  useRemoveLiquidityModalContext,
} from 'components/RemoveLiquidity/RemoveLiquidityModalContext'
import { RemoveLiquidityReview } from 'components/RemoveLiquidity/RemoveLiquidityReview'
import { RemoveLiquidityTxContextProvider } from 'components/RemoveLiquidity/RemoveLiquidityTxContext'
import { useModalState } from 'hooks/useModalState'
import { useLPSlippageValue } from 'pages/Pool/Positions/create/hooks/useLPSlippageValues'
import { RemoveLiquidityForm } from 'pages/RemoveLiquidity/RemoveLiquidityForm'
import { useTranslation } from 'react-i18next'
import { HeightAnimator } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TransactionSettingsContextProvider } from 'uniswap/src/features/transactions/components/settings/contexts/TransactionSettingsContext'
import { TransactionSettingKey } from 'uniswap/src/features/transactions/components/settings/slice'

function RemoveLiquidityModalInner() {
  const { closeModal } = useModalState(ModalName.RemoveLiquidity)
  const { t } = useTranslation()
  const { step, setStep, positionInfo } = useRemoveLiquidityModalContext()
  const autoSlippageTolerance = useLPSlippageValue(
    positionInfo?.version,
    positionInfo?.currency0Amount.currency,
    positionInfo?.currency1Amount.currency,
  )

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
    <TransactionSettingsContextProvider
      settingKey={TransactionSettingKey.LP}
      autoSlippageTolerance={autoSlippageTolerance}
    >
      <RemoveLiquidityTxContextProvider>
        <Modal name={ModalName.RemoveLiquidity} onClose={closeModal} isDismissible gap="$gap24" padding="$padding16">
          <LiquidityModalHeader
            title={t('pool.removeLiquidity')}
            closeModal={closeModal}
            goBack={step === DecreaseLiquidityStep.Review ? () => setStep(DecreaseLiquidityStep.Input) : undefined}
          />
          <HeightAnimator animation="fast" useInitialHeight>
            {modalContent}
          </HeightAnimator>
        </Modal>
      </RemoveLiquidityTxContextProvider>
    </TransactionSettingsContextProvider>
  )
}

export function RemoveLiquidityModal() {
  return (
    <RemoveLiquidityModalContextProvider>
      <RemoveLiquidityModalInner />
    </RemoveLiquidityModalContextProvider>
  )
}
