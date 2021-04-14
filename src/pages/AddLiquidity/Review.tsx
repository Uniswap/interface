import React, { useMemo } from 'react'
import { RowBetween, RowFixed } from '../../components/Row'
import CurrencyLogo from '../../components/CurrencyLogo'
import { Field } from '../../state/mint/actions'
import { TYPE } from '../../theme'
import { AutoColumn } from 'components/Column'
import Card, { DarkGreyCard } from 'components/Card'
import styled from 'styled-components'
import { Break } from 'components/earn/styled'
import { useTranslation } from 'react-i18next'
import { Currency, CurrencyAmount, Price } from '@uniswap/sdk-core'
import { Position } from '@uniswap/v3-sdk'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { wrappedCurrency } from 'utils/wrappedCurrency'
import { useActiveWeb3React } from 'hooks'
// import QuestionHelper from 'components/QuestionHelper'
// import { WarningBadge } from 'components/Badge/Badge.stories'
// import { AlertCircle } from 'react-feather'
// import useTheme from 'hooks/useTheme'

const Wrapper = styled.div`
  padding: 20px;
  min-width: 460px;
`

const Badge = styled(Card)<{ inRange?: boolean }>`
  width: fit-content;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  padding: 4px 6px;
  background-color: ${({ inRange, theme }) => (inRange ? theme.green1 : theme.yellow2)};
`

export function Review({
  position,
  currencies,
  parsedAmounts,
  priceLower,
  priceUpper,
  outOfRange,
}: {
  position?: Position
  currencies: { [field in Field]?: Currency }
  parsedAmounts: { [field in Field]?: CurrencyAmount }
  priceLower?: Price
  priceUpper?: Price
  outOfRange: boolean
}) {
  const { t } = useTranslation()
  const { chainId } = useActiveWeb3React()
  //   const theme = useTheme()

  const currencyA: Currency | undefined = currencies[Field.CURRENCY_A]
  const currencyB: Currency | undefined = currencies[Field.CURRENCY_B]

  // formatted with tokens
  const [tokenA, tokenB] = useMemo(() => [wrappedCurrency(currencyA, chainId), wrappedCurrency(currencyB, chainId)], [
    chainId,
    currencyA,
    currencyB,
  ])

  return (
    <Wrapper>
      <AutoColumn gap="lg">
        <RowBetween>
          <RowFixed>
            <DoubleCurrencyLogo currency0={currencyA} currency1={currencyB} size={24} margin={true} />
            <TYPE.label ml="10px" fontSize="24px">
              {currencyA?.symbol} / {currencyB?.symbol}
            </TYPE.label>
          </RowFixed>
          <Badge inRange={!outOfRange}>{outOfRange ? 'Out of range' : 'In Range'}</Badge>
        </RowBetween>
        {position && tokenA && tokenB && (
          <DarkGreyCard>
            <AutoColumn gap="md">
              <TYPE.label>Deposit Amounts</TYPE.label>
              {parsedAmounts[Field.CURRENCY_A] && (
                <RowBetween>
                  <RowFixed>
                    <CurrencyLogo currency={currencyA} />
                    <TYPE.label ml="8px">{currencyA?.symbol}</TYPE.label>
                  </RowFixed>
                  <RowFixed>
                    <TYPE.label mr="8px">{parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)}</TYPE.label>
                  </RowFixed>
                </RowBetween>
              )}
              {parsedAmounts[Field.CURRENCY_B] && (
                <RowBetween>
                  <RowFixed>
                    <CurrencyLogo currency={currencyB} />
                    <TYPE.label ml="8px">{currencyB?.symbol}</TYPE.label>
                  </RowFixed>
                  <RowFixed>
                    <TYPE.label mr="8px">{parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)}</TYPE.label>
                  </RowFixed>
                </RowBetween>
              )}
              <Break />
              <RowBetween>
                <TYPE.label>{t('feePool')}</TYPE.label>
                <TYPE.label>{position?.pool?.fee / 10000}%</TYPE.label>
              </RowBetween>
              <RowBetween>
                <TYPE.label>Current Price</TYPE.label>
                <TYPE.label>{`1 ${currencyA?.symbol} = ${position?.pool
                  ?.priceOf(position.pool?.token0.equals(tokenA) ? position.pool?.token0 : position.pool?.token1)
                  .toSignificant(6)} ${position.pool.token1?.symbol}`}</TYPE.label>
              </RowBetween>
              <RowBetween>
                <TYPE.label>Active Range</TYPE.label>
                <TYPE.label>{`1 ${
                  position.pool?.token0.equals(tokenA) ? currencyA?.symbol : currencyB?.symbol
                } = ${priceLower?.toSignificant(4)} ⟷ ${priceUpper?.toSignificant(6)} ${
                  position.pool?.token0.equals(tokenA) ? currencyB?.symbol : currencyA?.symbol
                }`}</TYPE.label>
              </RowBetween>
            </AutoColumn>
          </DarkGreyCard>
        )}
        {/* <YellowCard>
          <AutoColumn gap="md">
            <RowBetween>
              <TYPE.label color={theme.text2}>Efficiency Comparison</TYPE.label>
              <AlertCircle stroke={theme.text2} />
            </RowBetween>
            <TYPE.label fontWeight={400} color={theme.text2}>
              This liquidity position has an increased capital efficiency relative to an unbounded price limit.
            </TYPE.label>
          </AutoColumn>
        </YellowCard> */}
      </AutoColumn>
    </Wrapper>
  )
}

export default Review
