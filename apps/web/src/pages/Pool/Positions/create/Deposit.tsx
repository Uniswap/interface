import { DepositInputForm } from 'components/Liquidity/DepositInputForm'
import {
  useCreatePositionContext,
  useDepositContext,
  usePriceRangeContext,
} from 'pages/Pool/Positions/create/CreatePositionContext'
import { CreatePositionModal } from 'pages/Pool/Positions/create/CreatePositionModal'
import { Container } from 'pages/Pool/Positions/create/shared'
import { useCallback, useState } from 'react'
import { PositionField } from 'types/position'
import { Button, Flex, FlexProps, Text } from 'ui/src'
import { Trans } from 'uniswap/src/i18n'

export const DepositStep = ({ ...rest }: FlexProps) => {
  const {
    derivedPositionInfo: { sortedTokens },
  } = useCreatePositionContext()
  const {
    derivedPriceRangeInfo: { deposit0Disabled, deposit1Disabled },
  } = usePriceRangeContext()
  const {
    setDepositState,
    derivedDepositInfo: { formattedAmounts, currencyAmounts, currencyAmountsUSDValue, currencyBalances, error },
  } = useDepositContext()
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)

  const handleUserInput = (field: PositionField, newValue: string) => {
    setDepositState((prev) => ({
      ...prev,
      exactField: field,
      exactAmount: newValue,
    }))
  }

  const handleOnSetMax = (field: PositionField, amount: string) => {
    setDepositState((prev) => ({
      ...prev,
      exactField: field,
      exactAmount: amount,
    }))
  }

  const handleReview = useCallback(() => {
    setIsReviewModalOpen(true)
  }, [])

  const [token0, token1] = sortedTokens ?? [undefined, undefined]

  if (!token0 || !token1) {
    return null
  }

  return (
    <>
      <Container {...rest}>
        <Flex gap={32}>
          <Flex row alignItems="center">
            <Flex>
              <Text variant="subheading1">
                <Trans i18nKey="common.depositTokens" />
              </Text>
              <Text variant="body3" color="$neutral2">
                <Trans i18nKey="position.deposit.description" />
              </Text>
            </Flex>
          </Flex>
        </Flex>
        <DepositInputForm
          token0={token0}
          token1={token1}
          formattedAmounts={formattedAmounts}
          currencyAmounts={currencyAmounts}
          currencyAmountsUSDValue={currencyAmountsUSDValue}
          currencyBalances={currencyBalances}
          onUserInput={handleUserInput}
          onSetMax={handleOnSetMax}
          deposit0Disabled={deposit0Disabled}
          deposit1Disabled={deposit1Disabled}
        />
        <Button flex={1} py="$spacing16" px="$spacing20" onPress={handleReview} disabled={!!error}>
          <Text variant="buttonLabel1">{error ? error : <Trans i18nKey="swap.button.review" />}</Text>
        </Button>
      </Container>
      <CreatePositionModal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} />
    </>
  )
}
