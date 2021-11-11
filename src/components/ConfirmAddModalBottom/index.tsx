import React from 'react'
import { Trans } from '@lingui/macro'
import styled from 'styled-components'
import { Text } from 'rebass'

import { Currency, CurrencyAmount, Fraction, JSBI, Pair, Percent, Price } from '@dynamic-amm/sdk'
import { ONE_BIPS } from 'constants/index'
import { ButtonPrimary } from 'components/Button'
import { RowBetween, RowFixed } from 'components/Row'
import CurrencyLogo from 'components/CurrencyLogo'
import { PoolPriceRangeBar } from 'components/PoolPriceBar'
import FormattedPriceImpact from 'components/swap/FormattedPriceImpact'
import CurrentPrice from 'components/CurrentPrice'
import { Field } from 'state/mint/actions'
import { TYPE } from 'theme'
import { useCurrencyConvertedToNative } from 'utils/dmm'
import useTheme from 'hooks/useTheme'

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 1rem;
  border: 1px solid ${({ theme }) => theme.border4};
  border-radius: 4px;
  margin-bottom: 24px;
`

const CurrentPriceWrapper = styled.div`
  display: flex;
  flex-direction: column;

  @media only screen and (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
`

export function ConfirmAddModalBottom({
  pair,
  noLiquidity,
  price,
  currencies,
  parsedAmounts,
  poolTokenPercentage,
  onAdd,
  amplification,
  priceImpact
}: {
  pair: Pair | null | undefined
  noLiquidity?: boolean
  price?: Price
  currencies: { [field in Field]?: Currency }
  parsedAmounts: { [field in Field]?: CurrencyAmount }
  poolTokenPercentage?: Percent
  onAdd: () => void
  amplification?: Fraction
  priceImpact?: Percent
}) {
  const theme = useTheme()
  const amp = !!pair
    ? new Fraction(pair.amp).divide(JSBI.BigInt(10000)).toSignificant(5)
    : amplification?.divide(JSBI.BigInt(10000)).toSignificant(5)
  const tokenA = useCurrencyConvertedToNative(currencies[Field.CURRENCY_A] as Currency)
  const tokenB = useCurrencyConvertedToNative(currencies[Field.CURRENCY_B] as Currency)

  return (
    <>
      <Section style={{ gap: '8px' }}>
        <RowBetween>
          <TYPE.subHeader fontSize={14} fontWeight={400} color={theme.subText}>
            <Trans>Pooled {tokenA?.symbol}</Trans>
          </TYPE.subHeader>
          <RowFixed>
            <CurrencyLogo currency={currencies[Field.CURRENCY_A]} style={{ marginRight: '8px' }} />
            <TYPE.black fontSize={14} fontWeight={400}>
              {parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)}
            </TYPE.black>
          </RowFixed>
        </RowBetween>

        <RowBetween>
          <TYPE.subHeader fontSize={14} fontWeight={400} color={theme.subText}>
            <Trans>Pooled {tokenB?.symbol}</Trans>
          </TYPE.subHeader>
          <RowFixed>
            <CurrencyLogo currency={currencies[Field.CURRENCY_B]} style={{ marginRight: '8px' }} />
            <TYPE.black fontSize={14} fontWeight={400}>
              {parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)}
            </TYPE.black>
          </RowFixed>
        </RowBetween>

        <CurrentPriceWrapper>
          <TYPE.subHeader fontSize={14} fontWeight={400} color={theme.subText}>
            <Trans>Current Price</Trans>
          </TYPE.subHeader>
          <TYPE.black fontWeight={400} fontSize={14}>
            <CurrentPrice price={price} />
          </TYPE.black>
        </CurrentPriceWrapper>

        <RowBetween>
          <TYPE.subHeader fontSize={14} fontWeight={400} color={theme.subText}>
            <Trans>Your Share of Pool</Trans>
          </TYPE.subHeader>
          <TYPE.black fontSize={14} fontWeight={400}>
            {noLiquidity && price
              ? '100'
              : poolTokenPercentage && poolTokenPercentage.greaterThan('0')
              ? poolTokenPercentage?.lessThan(ONE_BIPS)
                ? '<0.01'
                : poolTokenPercentage?.toFixed(2)
              : '0'}
            %
          </TYPE.black>
        </RowBetween>

        {priceImpact && (
          <RowBetween>
            <TYPE.subHeader fontSize={14} fontWeight={400} color={theme.subText}>
              <Trans>Price Impact</Trans>
            </TYPE.subHeader>
            <TYPE.black fontSize={14} fontWeight={400}>
              <FormattedPriceImpact priceImpact={priceImpact} />
            </TYPE.black>
          </RowBetween>
        )}
      </Section>

      {noLiquidity && (
        <Section>
          <TYPE.body>AMP{!!amp ? <>&nbsp;=&nbsp;{amp}</> : ''}</TYPE.body>
          <PoolPriceRangeBar pair={pair} currencies={currencies} price={price} amplification={amplification} />
        </Section>
      )}

      <ButtonPrimary style={{ margin: '4px 0 0 0', padding: '16px' }} onClick={onAdd}>
        <Text fontWeight={500} fontSize={18}>
          {noLiquidity ? 'Create Pool' : 'Confirm'}
        </Text>
      </ButtonPrimary>
    </>
  )
}
