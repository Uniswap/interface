import { LoaderButton } from 'components/Button/LoaderButton'
import { ButtonError } from 'components/Button/buttons'
import { DepositInputForm } from 'components/Liquidity/DepositInputForm'
import {
  useCreatePositionContext,
  useCreateTxContext,
  useDepositContext,
  usePriceRangeContext,
} from 'pages/Pool/Positions/create/CreatePositionContext'
import { CreatePositionModal } from 'pages/Pool/Positions/create/CreatePositionModal'
import { Container } from 'pages/Pool/Positions/create/shared'
import { useCallback, useState } from 'react'
import { PositionField } from 'types/position'
import { Flex, FlexProps, Text } from 'ui/src'
import { Trans } from 'uniswap/src/i18n'

export const DepositStep = ({ ...rest }: FlexProps) => {
  const {
    derivedPositionInfo: { currencies, isPoolOutOfSync },
  } = useCreatePositionContext()
  const { derivedPriceRangeInfo } = usePriceRangeContext()
  const {
    setDepositState,
    derivedDepositInfo: {
      formattedAmounts,
      currencyAmounts,
      currencyAmountsUSDValue,
      currencyBalances,
      error: inputError,
    },
  } = useDepositContext()
  const { txInfo, error: dataFetchingError } = useCreateTxContext()
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

  if (!token0 || !token1) {
    return null
  }

  const { deposit0Disabled, deposit1Disabled } = derivedPriceRangeInfo

  const disabled = !!inputError || !txInfo?.txRequest

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
          formattedAmounts={formattedAmounts}
          currencyAmounts={currencyAmounts}
          currencyAmountsUSDValue={currencyAmountsUSDValue}
          currencyBalances={currencyBalances}
          onUserInput={handleUserInput}
          onSetMax={handleOnSetMax}
          deposit0Disabled={deposit0Disabled}
          deposit1Disabled={deposit1Disabled}
        />
        {!isPoolOutOfSync || disabled ? (
          <LoaderButton
            flex={1}
            py="$spacing16"
            px="$spacing20"
            onPress={handleReview}
            disabled={disabled}
            buttonKey="Position-Create-DepositButton"
            loading={Boolean(
              !dataFetchingError &&
                !inputError &&
                !txInfo?.txRequest &&
                currencyAmounts?.TOKEN0 &&
                currencyAmounts.TOKEN1,
            )}
          >
            <Text variant="buttonLabel1" color="$neutralContrast">
              {inputError ? inputError : <Trans i18nKey="swap.button.review" />}
            </Text>
          </LoaderButton>
        ) : (
          <ButtonError error $borderRadius="20px" onClick={handleReview}>
            <Trans i18nKey="swap.button.review" />
          </ButtonError>
        )}
      </Container>
      <CreatePositionModal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} />
    </>
  )
}
