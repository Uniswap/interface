import React, { useState, useCallback, useMemo } from 'react'
import { Position } from '@uniswap/v3-sdk'
import { DarkCard, DarkGreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import { TYPE } from 'theme'
import { RowBetween, RowFixed } from 'components/Row'
import CurrencyLogo from 'components/CurrencyLogo'
import { unwrappedToken } from 'utils/wrappedCurrency'
import { Break } from 'components/earn/styled'
import { useTranslation } from 'react-i18next'
import RateToggle from 'components/RateToggle'

export const PositionPreview = ({ position, title }: { position: Position; title?: string }) => {
  const { t } = useTranslation()

  const currency0 = unwrappedToken(position.pool.token0)
  const currency1 = unwrappedToken(position.pool.token1)

  // track which currency should be base
  const [baseCurrency, setBaseCurrency] = useState(currency0)
  const sorted = baseCurrency === currency0
  const quoteCurrency = sorted ? currency1 : currency0

  const quotePrice = useMemo(() => {
    return sorted ? position.pool.priceOf(position.pool.token1) : position.pool.priceOf(position.pool.token0)
  }, [sorted, position.pool])

  const priceLower = sorted ? position.token0PriceUpper.invert() : position.token0PriceLower
  const priceUpper = sorted ? position.token0PriceLower.invert() : position.token0PriceUpper

  const handleRateChange = useCallback(() => {
    setBaseCurrency(quoteCurrency)
  }, [quoteCurrency])

  return (
    <DarkGreyCard>
      <AutoColumn gap="md">
        <RowBetween>
          {title ? <TYPE.main>{title}</TYPE.main> : <div />}
          <RateToggle
            currencyA={sorted ? currency1 : currency0}
            currencyB={sorted ? currency0 : currency1}
            handleRateToggle={handleRateChange}
          />
        </RowBetween>
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
        <RowBetween>
          <TYPE.label>Current Price</TYPE.label>
          <TYPE.label>{`1 ${quoteCurrency?.symbol} = ${quotePrice.toSignificant(6)} ${
            baseCurrency?.symbol
          }`}</TYPE.label>
        </RowBetween>
        <RowBetween>
          <DarkCard width="46%" padding="8px">
            <AutoColumn gap="4px" justify="center">
              <TYPE.main fontSize="12px">Min price</TYPE.main>
              <TYPE.label textAlign="center">{`${priceLower.toSignificant(4)}`}</TYPE.label>
              <TYPE.main
                textAlign="center"
                fontSize="12px"
              >{` ${quoteCurrency.symbol}/${baseCurrency.symbol}`}</TYPE.main>
            </AutoColumn>
          </DarkCard>
          <TYPE.main ml="4px" mr="4px">
            ⟷
          </TYPE.main>
          <DarkCard width="46%" padding="8px">
            <AutoColumn gap="4px" justify="center">
              <TYPE.main fontSize="12px">Max price</TYPE.main>
              <TYPE.label textAlign="center">{`${priceUpper.toSignificant(4)}`}</TYPE.label>
              <TYPE.main
                textAlign="center"
                fontSize="12px"
              >{` ${quoteCurrency.symbol}/${baseCurrency.symbol}`}</TYPE.main>
            </AutoColumn>
          </DarkCard>
        </RowBetween>
      </AutoColumn>
    </DarkGreyCard>
  )
}
