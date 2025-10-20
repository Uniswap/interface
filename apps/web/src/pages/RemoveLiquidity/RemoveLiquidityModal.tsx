import { useLPSlippageValue } from 'components/Liquidity/Create/hooks/useLPSlippageValues'
import { LiquidityModalHeader } from 'components/Liquidity/LiquidityModalHeader'
import { useModalState } from 'hooks/useModalState'
import { RemoveLiquidityForm } from 'pages/RemoveLiquidity/RemoveLiquidityForm'
import {
  DecreaseLiquidityStep,
  RemoveLiquidityModalContextProvider,
  useRemoveLiquidityModalContext,
} from 'pages/RemoveLiquidity/RemoveLiquidityModalContext'
import { RemoveLiquidityReview } from 'pages/RemoveLiquidity/RemoveLiquidityReview'
import { RemoveLiquidityTxContextProvider } from 'pages/RemoveLiquidity/RemoveLiquidityTxContext'
import { useTranslation } from 'react-i18next'
import { HeightAnimator } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { LPTransactionSettingsStoreContextProvider } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/LPTransactionSettingsStoreContextProvider'

function RemoveLiquidityModalInner() {
  const { closeModal } = useModalState(ModalName.RemoveLiquidity)
  const { t } = useTranslation()
  const { step, setStep, positionInfo } = useRemoveLiquidityModalContext()
  const autoSlippageTolerance = useLPSlippageValue({
    version: positionInfo?.version,
    currencyA: positionInfo?.currency0Amount.currency,
    currencyB: positionInfo?.currency1Amount.currency,
  })

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
    <LPTransactionSettingsStoreContextProvider autoSlippageTolerance={autoSlippageTolerance}>
      <RemoveLiquidityTxContextProvider>
        <Modal name={ModalName.RemoveLiquidity} onClose={closeModal} isDismissible gap="$gap24" padding="$padding16">
          <LiquidityModalHeader
            title={t('pool.removeLiquidity')}
            closeModal={closeModal}
            goBack={step === DecreaseLiquidityStep.Review ? () => setStep(DecreaseLiquidityStep.Input) : undefined}
          />
          <HeightAnimator useInitialHeight>{modalContent}</HeightAnimator>
        </Modal>
      </RemoveLiquidityTxContextProvider>
    </LPTransactionSettingsStoreContextProvider>
  )
}

export function RemoveLiquidityModal() {
  return (
    <RemoveLiquidityModalContextProvider>
      <RemoveLiquidityModalInner />
    </RemoveLiquidityModalContextProvider>
  )
}
