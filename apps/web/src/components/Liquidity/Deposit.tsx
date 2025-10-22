import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { ErrorCallout } from 'components/ErrorCallout'
import { useDefaultInitialPrice } from 'components/Liquidity/Create/hooks/useDefaultInitialPrice'
import { DepositInputForm } from 'components/Liquidity/DepositInputForm'
import { useUpdatedAmountsFromDependentAmount } from 'components/Liquidity/hooks/useDependentAmountFallback'
import { getPriceDifference } from 'components/Liquidity/utils/getPriceDifference'
import { getFieldsDisabled, isInvalidRange } from 'components/Liquidity/utils/priceRangeInfo'
import { useAccount } from 'hooks/useAccount'
import ConfirmCreatePositionModal from 'pages/CreatePosition/ConfirmCreatePositionModal'
import { useCreateLiquidityContext } from 'pages/CreatePosition/CreateLiquidityContextProvider'
import { CreatePositionModal } from 'pages/CreatePosition/CreatePositionModal'
import { useCreatePositionTxContext } from 'pages/CreatePosition/CreatePositionTxContext'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { PositionField } from 'types/position'
import { Button, Flex, Text } from 'ui/src'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'

export const DepositStep = () => {
  const {
    priceRangeState: { initialPrice, priceInverted },
    protocolVersion,
    creatingPoolOrPair,
    currencies,
    ticks,
    poolOrPair,
    depositState,
    setDepositState,
    refetch,
  } = useCreateLiquidityContext()

  const { t } = useTranslation()
  const { onConnectWallet } = useUniswapContext()
  const account = useAccount()
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const { TOKEN0, TOKEN1 } = currencies.display
  const { exactField } = depositState

  const { price: defaultInitialPrice } = useDefaultInitialPrice({
    currencies: {
      [PositionField.TOKEN0]: currencies.display.TOKEN0,
      [PositionField.TOKEN1]: currencies.display.TOKEN1,
    },
    // V2 create flow doesn't show the liquidity range chart so we always want
    // to get the default initial price for DisplayCurrentPrice in deposit step
    skip: !creatingPoolOrPair && protocolVersion === ProtocolVersion.V2,
  })

  const priceDifference = useMemo(
    () =>
      getPriceDifference({
        initialPrice,
        defaultInitialPrice,
        priceInverted,
      }),
    [initialPrice, defaultInitialPrice, priceInverted],
  )

  const invalidRange = protocolVersion !== ProtocolVersion.V2 && isInvalidRange(ticks[0], ticks[1])

  const {
    txInfo,
    gasFeeEstimateUSD,
    dependentAmount,
    transactionError,
    setTransactionError,
    currencyAmounts,
    inputError,
    formattedAmounts,
    currencyAmountsUSDValue,
    currencyBalances,
  } = useCreatePositionTxContext()

  const handleUserInput = (field: PositionField, newValue: string) => {
    setDepositState((prev) => ({
      exactField: field,
      exactAmounts: {
        ...prev.exactAmounts,
        [field]: newValue,
      },
    }))
  }

  const handleOnSetMax = (field: PositionField, amount: string) => {
    setDepositState((prev) => ({
      exactField: field,
      exactAmounts: {
        ...prev.exactAmounts,
        [field]: amount,
      },
    }))
  }

  const handleReview = useCallback(() => {
    if (priceDifference?.warning === WarningSeverity.High) {
      setIsConfirmModalOpen(true)
      return
    }

    setIsReviewModalOpen(true)
  }, [priceDifference?.warning])

  const { TOKEN0: deposit0Disabled, TOKEN1: deposit1Disabled } = getFieldsDisabled({
    ticks,
    poolOrPair,
  })

  const {
    updatedFormattedAmounts,
    updatedCurrencyAmounts,
    updatedUSDAmounts,
    updatedDeposit0Disabled,
    updatedDeposit1Disabled,
  } = useUpdatedAmountsFromDependentAmount({
    token0: TOKEN0,
    token1: TOKEN1,
    dependentAmount,
    exactField,
    currencyAmounts,
    currencyAmountsUSDValue,
    formattedAmounts,
    deposit0Disabled,
    deposit1Disabled,
  })

  useEffect(() => {
    if (deposit1Disabled) {
      setDepositState({ exactField: PositionField.TOKEN0, exactAmounts: {} })
    } else if (deposit0Disabled) {
      setDepositState({ exactField: PositionField.TOKEN1, exactAmounts: {} })
    }
  }, [deposit0Disabled, deposit1Disabled, setDepositState])

  if (!TOKEN0 || !TOKEN1) {
    return null
  }

  const disabled = !!inputError || !txInfo?.txRequest

  const requestLoading = Boolean(
    !transactionError &&
      !inputError &&
      !txInfo?.txRequest &&
      currencyAmounts?.TOKEN0 &&
      currencyAmounts.TOKEN1 &&
      !invalidRange,
  )

  return (
    <>
      {invalidRange ? null : (
        <Flex gap={32}>
          <Flex gap="$spacing4">
            <Text variant="subheading1">
              <Trans i18nKey="common.depositTokens" />
            </Text>
            <Text variant="body3" color="$neutral2">
              <Trans i18nKey="position.deposit.description" />
            </Text>
          </Flex>
        </Flex>
      )}
      <DepositInputForm
        autofocus={false}
        token0={TOKEN0}
        token1={TOKEN1}
        formattedAmounts={updatedFormattedAmounts ?? formattedAmounts}
        currencyAmounts={updatedCurrencyAmounts ?? currencyAmounts}
        currencyAmountsUSDValue={updatedUSDAmounts ?? currencyAmountsUSDValue}
        currencyBalances={currencyBalances}
        onUserInput={handleUserInput}
        onSetMax={handleOnSetMax}
        deposit0Disabled={updatedDeposit0Disabled}
        deposit1Disabled={updatedDeposit1Disabled}
        amount0Loading={requestLoading && exactField === PositionField.TOKEN1}
        amount1Loading={requestLoading && exactField === PositionField.TOKEN0}
      />
      <Flex row>
        {account.isConnected ? (
          <Button
            size="large"
            variant="branded"
            onPress={handleReview}
            isDisabled={disabled}
            key="Position-Create-DepositButton"
            loading={requestLoading}
          >
            {inputError ? inputError : t('swap.button.review')}
          </Button>
        ) : (
          <Button size="large" variant="branded" emphasis="secondary" onPress={() => onConnectWallet?.(Platform.EVM)}>
            {t('common.connectWallet.button')}
          </Button>
        )}
      </Flex>
      <ErrorCallout errorMessage={transactionError} onPress={refetch} />
      <CreatePositionModal
        formattedAmounts={updatedFormattedAmounts}
        currencyAmounts={updatedCurrencyAmounts ?? currencyAmounts}
        currencyAmountsUSDValue={updatedUSDAmounts}
        gasFeeEstimateUSD={gasFeeEstimateUSD}
        txInfo={txInfo}
        isOpen={isReviewModalOpen}
        transactionError={transactionError}
        setTransactionError={setTransactionError}
        onClose={() => setIsReviewModalOpen(false)}
      />
      {priceDifference?.warning === WarningSeverity.High && (
        <ConfirmCreatePositionModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onContinue={() => {
            setIsConfirmModalOpen(false)
            setIsReviewModalOpen(true)
          }}
          priceDifference={priceDifference}
        />
      )}
    </>
  )
}
