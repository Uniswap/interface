import { Pair } from '@kyberswap/ks-sdk-classic'
import { Currency, CurrencyAmount, Fraction, Percent, Price } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import JSBI from 'jsbi'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import CurrentPrice from 'components/CurrentPrice'
import { PoolPriceRangeBar } from 'components/PoolPriceBar'
import { RowBetween, RowFixed } from 'components/Row'
import FormattedPriceImpact from 'components/swapv2/FormattedPriceImpact'
import { ONE_BIPS } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { Field } from 'state/mint/actions'
import { TYPE } from 'theme'
import { formattedNum } from 'utils'
import { useCurrencyConvertedToNative } from 'utils/dmm'

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 1rem;
  border: 1px solid ${({ theme }) => theme.border};
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
  priceImpact,
  estimatedUsd,
}: {
  pair: Pair | null | undefined
  noLiquidity?: boolean
  price?: Price<Currency, Currency>
  currencies: { [field in Field]?: Currency }
  parsedAmounts: { [field in Field]?: CurrencyAmount<Currency> }
  poolTokenPercentage?: Percent
  onAdd: () => void
  amplification?: Fraction
  priceImpact?: Percent
  estimatedUsd?: [number, number]
}) {
  const theme = useTheme()
  const amp = !!pair
    ? new Fraction(JSBI.BigInt(pair.amp)).divide(JSBI.BigInt(10000)).toSignificant(5)
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
            <Flex alignItems="center">
              <TYPE.black fontSize={14} fontWeight={400}>
                {parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)}
              </TYPE.black>
              {estimatedUsd && !!estimatedUsd[0] && (
                <Text color={theme.subText} marginLeft="4px" fontSize={14}>
                  ({formattedNum(estimatedUsd[0].toString(), true) || undefined})
                </Text>
              )}
            </Flex>
          </RowFixed>
        </RowBetween>

        <RowBetween>
          <TYPE.subHeader fontSize={14} fontWeight={400} color={theme.subText}>
            <Trans>Pooled {tokenB?.symbol}</Trans>
          </TYPE.subHeader>
          <RowFixed>
            <CurrencyLogo currency={currencies[Field.CURRENCY_B]} style={{ marginRight: '8px' }} />
            <Flex alignItems="center">
              <TYPE.black fontSize={14} fontWeight={400}>
                {parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)}
              </TYPE.black>

              {estimatedUsd && !!estimatedUsd[1] && (
                <Text color={theme.subText} marginLeft="4px" fontSize={14}>
                  ({formattedNum(estimatedUsd[1].toString(), true) || undefined})
                </Text>
              )}
            </Flex>
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

      <ButtonPrimary style={{ margin: '4px 0 0 0', padding: '12px' }} onClick={onAdd}>
        <Text fontWeight={500}>{noLiquidity ? <Trans>Create Pool</Trans> : <Trans>Confirm</Trans>}</Text>
      </ButtonPrimary>
    </>
  )
}
