import { DepositInputForm } from 'components/Liquidity/DepositInputForm'
import { useUpdatedAmountsFromDependentAmount } from 'components/Liquidity/hooks/useDependentAmountFallback'
import ConfirmCreatePositionModal from 'pages/Pool/Positions/create/ConfirmCreatePositionModal'
import {
  useCreatePositionContext,
  useCreateTxContext,
  useDepositContext,
  usePriceRangeContext,
} from 'pages/Pool/Positions/create/CreatePositionContext'
import { CreatePositionModal } from 'pages/Pool/Positions/create/CreatePositionModal'
import { useCallback, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { PositionField } from 'types/position'
import { Button, Flex, Text } from 'ui/src'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'

export const DepositStep = () => {
  const {
    derivedPositionInfo: { currencies },
  } = useCreatePositionContext()
  const { t } = useTranslation()
  const { derivedPriceRangeInfo } = usePriceRangeContext()
  const {
    depositState: { exactField },
    setDepositState,
    derivedDepositInfo: {
      formattedAmounts,
      currencyAmounts,
      currencyAmountsUSDValue,
      currencyBalances,
      error: inputError,
    },
  } = useDepositContext()
  const { txInfo, error: dataFetchingError, dependentAmount } = useCreateTxContext()
  const { deposit0Disabled, deposit1Disabled, priceDifference } = derivedPriceRangeInfo
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
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

  const [token0, token1] = currencies

  const { updatedFormattedAmounts, updatedUSDAmounts, updatedDeposit0Disabled, updatedDeposit1Disabled } =
    useUpdatedAmountsFromDependentAmount({
      token0,
      token1,
      dependentAmount,
      exactField,
      currencyAmounts,
      currencyAmountsUSDValue,
      formattedAmounts,
      deposit0Disabled,
      deposit1Disabled,
    })

  if (!token0 || !token1) {
    return null
  }

  const disabled = !!inputError || !txInfo?.txRequest

  const requestLoading = Boolean(
    !dataFetchingError && !inputError && !txInfo?.txRequest && currencyAmounts?.TOKEN0 && currencyAmounts.TOKEN1,
  )

  return (
    <>
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
      <DepositInputForm
        token0={token0}
        token1={token1}
        formattedAmounts={updatedFormattedAmounts}
        currencyAmounts={currencyAmounts}
        currencyAmountsUSDValue={updatedUSDAmounts}
        currencyBalances={currencyBalances}
        onUserInput={handleUserInput}
        onSetMax={handleOnSetMax}
        deposit0Disabled={updatedDeposit0Disabled}
        deposit1Disabled={updatedDeposit1Disabled}
        amount0Loading={requestLoading && exactField === PositionField.TOKEN1}
        amount1Loading={requestLoading && exactField === PositionField.TOKEN0}
      />
      <Flex row>
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
      </Flex>
      <CreatePositionModal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} />
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
