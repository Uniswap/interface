// eslint-disable-next-line no-restricted-imports
import { LiquidityModalDetailRows } from 'components/Liquidity/LiquidityModalDetailRows'
import { LiquidityModalHeader } from 'components/Liquidity/LiquidityModalHeader'
import { LiquidityPositionInfo } from 'components/Liquidity/LiquidityPositionInfo'
import { TokenInfo } from 'components/Liquidity/TokenInfo'
import { StyledPercentInput } from 'components/PercentInput'
import useSelectChain from 'hooks/useSelectChain'
import {
  RemoveLiquidityModalContextProvider,
  useLiquidityModalContext,
} from 'pages/RemoveLiquidity/RemoveLiquidityModalContext'
import {
  RemoveLiquidityTxContextProvider,
  useRemoveLiquidityTxContext,
} from 'pages/RemoveLiquidity/RemoveLiquidityTxContext'
import { ClickablePill } from 'pages/Swap/Buy/PredefinedAmount'
import { NumericalInputMimic, NumericalInputSymbolContainer, NumericalInputWrapper } from 'pages/Swap/common/shared'
import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useCloseModal } from 'state/application/hooks'
import { liquiditySaga } from 'state/sagas/liquidity/liquiditySaga'
import { Button, Flex, Text, useSporeColors } from 'ui/src'
import { ProgressIndicator } from 'uniswap/src/components/ConfirmSwapModal/ProgressIndicator'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { isValidLiquidityTxContext } from 'uniswap/src/features/transactions/liquidity/types'
import { useUSDCValue } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { TransactionStep } from 'uniswap/src/features/transactions/swap/utils/generateTransactionSteps'
import { Trans, useTranslation } from 'uniswap/src/i18n'
import useResizeObserver from 'use-resize-observer'
import { useAccount } from 'wagmi'

function RemoveLiquidityModalInner() {
  const closeModal = useCloseModal(ModalName.RemoveLiquidity)
  const hiddenObserver = useResizeObserver<HTMLElement>()
  const { t } = useTranslation()
  const colors = useSporeColors()
  const { percent, positionInfo, setPercent, percentInvalid } = useLiquidityModalContext()
  const removeLiquidityTxContext = useRemoveLiquidityTxContext()
  const { gasFeeEstimateUSD, txContext } = removeLiquidityTxContext
  const [steps, setSteps] = useState<TransactionStep[]>([])
  const [currentStep, setCurrentStep] = useState<{ step: TransactionStep; accepted: boolean } | undefined>()
  const selectChain = useSelectChain()
  const startChainId = useAccount().chainId
  const account = useAccountMeta()
  const dispatch = useDispatch()
  const currency0FiatAmount = useUSDCValue(positionInfo?.currency0Amount) ?? undefined
  const currency1FiatAmount = useUSDCValue(positionInfo?.currency1Amount) ?? undefined

  const onFailure = () => {
    setCurrentStep(undefined)
  }

  const onDecreaseLiquidity = () => {
    const isValidTx = isValidLiquidityTxContext(txContext)
    if (!account || account?.type !== AccountType.SignerMnemonic || !isValidTx) {
      return
    }
    dispatch(
      liquiditySaga.actions.trigger({
        selectChain,
        startChainId,
        account,
        liquidityTxContext: txContext,
        setCurrentStep,
        setSteps,
        onSuccess: closeModal,
        onFailure,
      }),
    )
  }

  if (!positionInfo) {
    throw new Error('RemoveLiquidityModal must have an initial state when opening')
  }

  const { restPosition, currency0Amount, currency1Amount } = positionInfo

  return (
    <Modal name={ModalName.AddLiquidity} onClose={closeModal} isDismissible>
      <Flex gap="$spacing24">
        <LiquidityModalHeader title={t('pool.removeLiquidity')} closeModal={closeModal} />

        {currentStep ? (
          <>
            <Flex gap="$gap16" px="$padding16">
              <TokenInfo
                currencyAmount={currency0Amount.multiply(percent).divide(100)}
                currencyUSDAmount={currency0FiatAmount?.multiply(percent).divide(100)}
              />
              <Text variant="body3" color="$neutral2">
                {t('common.and')}
              </Text>
              <TokenInfo
                currencyAmount={currency1Amount.multiply(percent).divide(100)}
                currencyUSDAmount={currency1FiatAmount?.multiply(percent).divide(100)}
              />
            </Flex>
            <ProgressIndicator steps={steps} currentStep={currentStep} />
          </>
        ) : (
          <>
            {/* Position info */}
            <Flex width="100%" row justifyContent="center">
              <LiquidityPositionInfo position={restPosition} />
            </Flex>
            {/* Percent input panel */}
            <Flex p="$padding16" gap="$gap12">
              <Text variant="body3" color="$neutral2">
                <Trans i18nKey="common.withdrawal.amount" />
              </Text>
              <Flex row alignItems="center" justifyContent="center" width="100%">
                <NumericalInputWrapper width="100%">
                  <StyledPercentInput
                    value={percent}
                    onUserInput={(value: string) => {
                      setPercent(value)
                    }}
                    placeholder="0"
                    $width={percent && hiddenObserver.width ? hiddenObserver.width + 1 : undefined}
                    maxDecimals={1}
                    maxLength={2}
                  />
                  <NumericalInputSymbolContainer showPlaceholder={!percent}>%</NumericalInputSymbolContainer>
                  <NumericalInputMimic ref={hiddenObserver.ref}>{percent}</NumericalInputMimic>
                </NumericalInputWrapper>
              </Flex>
              <Flex row gap="$gap8" width="100%" justifyContent="center">
                {[25, 50, 75, 100].map((option) => {
                  const active = percent === option.toString()
                  const disabled = false
                  return (
                    <ClickablePill
                      key={option}
                      onPress={() => {
                        setPercent(option.toString())
                      }}
                      $disabled={disabled}
                      $active={active}
                      customBorderColor={colors.surface3.val}
                      foregroundColor={colors[disabled ? 'neutral3' : active ? 'neutral1' : 'neutral2'].val}
                      label={option < 100 ? option + '%' : t('swap.button.max')}
                      px="$spacing16"
                      textVariant="buttonLabel2"
                    />
                  )
                })}
              </Flex>
            </Flex>
            {/* Detail rows */}
            <LiquidityModalDetailRows
              currency0Amount={currency0Amount}
              currency1Amount={currency1Amount}
              networkCost={gasFeeEstimateUSD}
            />
            <Button size="large" disabled={percentInvalid || !txContext?.txRequest} onPress={onDecreaseLiquidity}>
              <Flex row alignItems="center" gap="$spacing8">
                <Text variant="buttonLabel1" color="$white" animation="fastHeavy">
                  {t('common.button.remove')}
                </Text>
              </Flex>
            </Button>
          </>
        )}
      </Flex>
    </Modal>
  )
}

export function RemoveLiquidityModal() {
  return (
    <RemoveLiquidityModalContextProvider>
      <RemoveLiquidityTxContextProvider>
        <RemoveLiquidityModalInner />
      </RemoveLiquidityTxContextProvider>
    </RemoveLiquidityModalContextProvider>
  )
}
