import { LoaderButton } from 'components/Button/LoaderButton'
import { DepositInputForm } from 'components/Liquidity/DepositInputForm'
import { useUpdatedAmountsFromDependentAmount } from 'components/Liquidity/hooks/useDependentAmountFallback'
import {
  useCreatePositionContext,
  useCreateTxContext,
  useDepositContext,
  usePriceRangeContext,
} from 'pages/Pool/Positions/create/CreatePositionContext'
import { CreatePositionModal } from 'pages/Pool/Positions/create/CreatePositionModal'
import { Container } from 'pages/Pool/Positions/create/shared'
import { useCallback, useState } from 'react'
import { Trans } from 'react-i18next'
import { PositionField } from 'types/position'
import { Flex, FlexProps, Text } from 'ui/src'

export const DepositStep = ({ ...rest }: FlexProps) => {
  const {
    derivedPositionInfo: { currencies },
  } = useCreatePositionContext()
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
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)

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
    setIsReviewModalOpen(true)
  }, [])

  const [token0, token1] = currencies

  const { deposit0Disabled, deposit1Disabled } = derivedPriceRangeInfo
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
      <Container {...rest}>
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
        <LoaderButton
          flex={1}
          py="$spacing16"
          px="$spacing20"
          onPress={handleReview}
          isDisabled={disabled}
          buttonKey="Position-Create-DepositButton"
          loading={requestLoading}
        >
          <Text variant="buttonLabel1" color="$neutralContrast">
            {inputError ? inputError : <Trans i18nKey="swap.button.review" />}
          </Text>
        </LoaderButton>
      </Container>
      <CreatePositionModal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} />
    </>
  )
}
