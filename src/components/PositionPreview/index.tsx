import React, { useState, useCallback, useContext } from 'react'
import { Position } from '@uniswap/v3-sdk'
import { LightCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import { TYPE } from 'theme'
import { RowBetween, RowFixed } from 'components/Row'
import CurrencyLogo from 'components/CurrencyLogo'
import { unwrappedToken } from 'utils/wrappedCurrency'
import { Break } from 'components/earn/styled'
import { useTranslation } from 'react-i18next'
import { Currency } from '@uniswap/sdk-core'
import RateToggle from 'components/RateToggle'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import RangeBadge from 'components/Badge/RangeBadge'
import { ThemeContext } from 'styled-components'
import { JSBI } from '@uniswap/v2-sdk'

export const PositionPreview = ({
  position,
  title,
  inRange,
  baseCurrencyDefault,
}: {
  position: Position
  title?: string
  inRange: boolean
  baseCurrencyDefault?: Currency | undefined
}) => {
  const { t } = useTranslation()

  const theme = useContext(ThemeContext)

  const currency0 = unwrappedToken(position.pool.token0)
  const currency1 = unwrappedToken(position.pool.token1)

  // track which currency should be base
  const [baseCurrency, setBaseCurrency] = useState(
    baseCurrencyDefault
      ? baseCurrencyDefault === currency0
        ? currency0
        : baseCurrencyDefault === currency1
        ? currency1
        : currency0
      : currency0
  )

  const sorted = baseCurrency === currency0
  const quoteCurrency = sorted ? currency1 : currency0

  const price = sorted ? position.pool.priceOf(position.pool.token0) : position.pool.priceOf(position.pool.token1)

  const priceLower = sorted ? position.token0PriceLower : position.token0PriceUpper.invert()
  const priceUpper = sorted ? position.token0PriceUpper : position.token0PriceLower.invert()

  const handleRateChange = useCallback(() => {
    setBaseCurrency(quoteCurrency)
  }, [quoteCurrency])

  const removed = position?.liquidity && JSBI.equal(position?.liquidity, JSBI.BigInt(0))

  return (
    <AutoColumn gap="md" style={{ marginTop: '0.5rem' }}>
      <RowBetween style={{ marginBottom: '0.5rem' }}>
        <RowFixed>
          <DoubleCurrencyLogo
            currency0={currency0 ?? undefined}
            currency1={currency1 ?? undefined}
            size={24}
            margin={true}
          />
          <TYPE.label ml="10px" fontSize="24px">
            {currency0?.symbol} / {currency1?.symbol}
          </TYPE.label>
        </RowFixed>
        <RangeBadge removed={removed} inRange={inRange} />
      </RowBetween>

      <LightCard>
        <AutoColumn gap="md">
          <RowBetween>
            <RowFixed>
              <CurrencyLogo currency={currency0} />
              <TYPE.label ml="8px">{currency0?.symbol}</TYPE.label>
            </RowFixed>
            <RowFixed>
              <TYPE.label mr="8px">{position.amount0.toSignificant(4)}</TYPE.label>
            </RowFixed>
          </RowBetween>
          <RowBetween>
            <RowFixed>
              <CurrencyLogo currency={currency1} />
              <TYPE.label ml="8px">{currency1?.symbol}</TYPE.label>
            </RowFixed>
            <RowFixed>
              <TYPE.label mr="8px">{position.amount1.toSignificant(4)}</TYPE.label>
            </RowFixed>
          </RowBetween>
          <Break />
          <RowBetween>
            <TYPE.label>{t('feeTier')}</TYPE.label>
            <TYPE.label>{position?.pool?.fee / 10000}%</TYPE.label>
          </RowBetween>
        </AutoColumn>
      </LightCard>

      <AutoColumn gap="md">
        <RowBetween>
          {title ? <TYPE.main>{title}</TYPE.main> : <div />}
          <RateToggle
            currencyA={sorted ? currency0 : currency1}
            currencyB={sorted ? currency1 : currency0}
            handleRateToggle={handleRateChange}
          />
        </RowBetween>

        <RowBetween>
          <LightCard width="48%" padding="8px">
            <AutoColumn gap="4px" justify="center">
              <TYPE.main fontSize="12px">Min Price</TYPE.main>
              <TYPE.mediumHeader textAlign="center">{`${priceLower.toSignificant(5)}`}</TYPE.mediumHeader>
              <TYPE.main
                textAlign="center"
                fontSize="12px"
              >{` ${quoteCurrency.symbol}/${baseCurrency.symbol}`}</TYPE.main>
              <TYPE.small textAlign="center" color={theme.text3} style={{ marginTop: '4px' }}>
                Your position will be 100% composed of {baseCurrency?.symbol} at this price
              </TYPE.small>
            </AutoColumn>
          </LightCard>

          <LightCard width="48%" padding="8px">
            <AutoColumn gap="4px" justify="center">
              <TYPE.main fontSize="12px">Max Price</TYPE.main>
              <TYPE.mediumHeader textAlign="center">{`${priceUpper.toSignificant(5)}`}</TYPE.mediumHeader>
              <TYPE.main
                textAlign="center"
                fontSize="12px"
              >{` ${quoteCurrency.symbol}/${baseCurrency.symbol}`}</TYPE.main>
              <TYPE.small textAlign="center" color={theme.text3} style={{ marginTop: '4px' }}>
                Your position will be 100% composed of {quoteCurrency?.symbol} at this price
              </TYPE.small>
            </AutoColumn>
          </LightCard>
        </RowBetween>
        <LightCard padding="12px ">
          <AutoColumn gap="4px" justify="center">
            <TYPE.main fontSize="12px">Current price</TYPE.main>
            <TYPE.mediumHeader>{`${price.toSignificant(6)} `}</TYPE.mediumHeader>
            <TYPE.main
              textAlign="center"
              fontSize="12px"
            >{` ${quoteCurrency.symbol}/${baseCurrency.symbol}`}</TYPE.main>
          </AutoColumn>
        </LightCard>
      </AutoColumn>
    </AutoColumn>
  )
}
