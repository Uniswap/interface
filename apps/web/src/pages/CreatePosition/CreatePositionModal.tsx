import { getLPBaseAnalyticsProperties } from 'components/Liquidity/analytics'
import { ReviewModal, ReviewModalProps } from 'components/Liquidity/ReviewModal'
import { getPoolIdOrAddressFromCreatePositionInfo } from 'components/Liquidity/utils/getPoolIdOrAddressFromCreatePositionInfo'
import { useAccount } from 'hooks/useAccount'
import useSelectChain from 'hooks/useSelectChain'
import { useCreateLiquidityContext } from 'pages/CreatePosition/CreateLiquidityContextProvider'
import { useSetOverrideOneClickSwapFlag } from 'pages/Swap/settings/OneClickSwap'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'
import { liquiditySaga } from 'state/sagas/liquidity/liquiditySaga'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import {
  CreatePositionTxAndGasInfo,
  isValidLiquidityTxContext,
  MigratePositionTxAndGasInfo,
} from 'uniswap/src/features/transactions/liquidity/types'
import { getErrorMessageToDisplay } from 'uniswap/src/features/transactions/liquidity/utils'
import { TransactionStep } from 'uniswap/src/features/transactions/steps/types'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { isSignerMnemonicAccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

export function CreatePositionModal({
  formattedAmounts,
  currencyAmounts,
  currencyAmountsUSDValue,
  txInfo,
  gasFeeEstimateUSD,
  transactionError,
  setTransactionError,
  isOpen,
  onClose,
}: Pick<
  ReviewModalProps,
  | 'formattedAmounts'
  | 'currencyAmounts'
  | 'currencyAmountsUSDValue'
  | 'gasFeeEstimateUSD'
  | 'transactionError'
  | 'isOpen'
  | 'onClose'
> & {
  txInfo?: CreatePositionTxAndGasInfo | MigratePositionTxAndGasInfo
  setTransactionError: (error: string | boolean) => void
}) {
  const {
    protocolVersion,
    creatingPoolOrPair,
    positionState: { fee, hook },
    setCurrentTransactionStep,
    poolOrPair,
    ticks,
  } = useCreateLiquidityContext()
  const { t } = useTranslation()

  const disableOneClickSwap = useSetOverrideOneClickSwapFlag()

  const [steps, setSteps] = useState<TransactionStep[]>([])
  const dispatch = useDispatch()
  const account = useWallet().evmAccount
  const selectChain = useSelectChain()
  const connectedAccount = useAccount()
  const startChainId = connectedAccount.chainId
  const navigate = useNavigate()
  const trace = useTrace()

  const onSuccess = useCallback(() => {
    setSteps([])
    setCurrentTransactionStep(undefined)
    onClose()
    navigate('/positions')
  }, [setCurrentTransactionStep, onClose, navigate])

  const handleCreate = useCallback(() => {
    setTransactionError(false)

    const isValidTx = isValidLiquidityTxContext(txInfo)
    if (
      !account ||
      !isSignerMnemonicAccountDetails(account) ||
      !isValidTx ||
      !currencyAmounts ||
      !currencyAmounts.TOKEN0 ||
      !currencyAmounts.TOKEN1
    ) {
      return
    }

    dispatch(
      liquiditySaga.actions.trigger({
        selectChain,
        startChainId,
        account,
        liquidityTxContext: txInfo,
        setCurrentStep: setCurrentTransactionStep,
        setSteps,
        onSuccess,
        onFailure: (e) => {
          if (e) {
            setTransactionError(getErrorMessageToDisplay({ calldataError: e }))
          }
          setCurrentTransactionStep(undefined)
        },
        disableOneClickSwap,
        analytics: {
          ...getLPBaseAnalyticsProperties({
            trace,
            hook,
            version: protocolVersion,
            tickLower: ticks[0] ?? undefined,
            tickUpper: ticks[1] ?? undefined,
            fee: fee?.feeAmount,
            tickSpacing: fee?.tickSpacing,
            currency0: currencyAmounts.TOKEN0.currency,
            currency1: currencyAmounts.TOKEN1.currency,
            currency0AmountUsd: currencyAmountsUSDValue?.TOKEN0,
            currency1AmountUsd: currencyAmountsUSDValue?.TOKEN1,
            poolId: getPoolIdOrAddressFromCreatePositionInfo({
              protocolVersion,
              poolOrPair,
              sdkCurrencies: {
                TOKEN0: currencyAmounts.TOKEN0.currency,
                TOKEN1: currencyAmounts.TOKEN1.currency,
              },
            }),
          }),
          expectedAmountBaseRaw: currencyAmounts.TOKEN0.quotient.toString(),
          expectedAmountQuoteRaw: currencyAmounts.TOKEN1.quotient.toString(),
          createPool: creatingPoolOrPair,
          createPosition: true,
        },
      }),
    )
  }, [
    txInfo,
    account,
    currencyAmounts,
    dispatch,
    selectChain,
    startChainId,
    setTransactionError,
    setCurrentTransactionStep,
    onSuccess,
    trace,
    fee?.feeAmount,
    fee?.tickSpacing,
    ticks,
    hook,
    currencyAmountsUSDValue?.TOKEN0,
    currencyAmountsUSDValue?.TOKEN1,
    protocolVersion,
    creatingPoolOrPair,
    poolOrPair,
    disableOneClickSwap,
  ])

  return (
    <ReviewModal
      modalName={ModalName.CreatePosition}
      headerTitle={t('position.create.modal.header')}
      confirmButtonText={t('common.button.create')}
      formattedAmounts={formattedAmounts}
      currencyAmounts={currencyAmounts}
      currencyAmountsUSDValue={currencyAmountsUSDValue}
      isDisabled={!txInfo?.action}
      gasFeeEstimateUSD={gasFeeEstimateUSD}
      transactionError={transactionError}
      steps={steps}
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleCreate}
    />
  )
}
