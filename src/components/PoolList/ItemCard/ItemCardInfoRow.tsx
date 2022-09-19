import { Currency, Fraction } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import React from 'react'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import CurrencyLogo from 'components/CurrencyLogo'
import InfoHelper from 'components/InfoHelper'
import { SubgraphPoolData } from 'state/pools/hooks'
import { priceRangeCalcBySubgraphPool } from 'utils/dmm'

export const Field = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.subText};
  line-height: 24px;
`

export const Value = styled.div`
  font-size: 12px;
  font-weight: 400;
  color: ${({ theme }) => theme.text};
  line-height: 24px;
`

export default function ItemCardInfoRow({
  name,
  value,
  infoHelperText,
  currency,
}: {
  name: string
  value: string | number
  infoHelperText?: string
  currency?: Currency
}) {
  return (
    <Flex justifyContent="space-between">
      <Field>
        <Flex>
          <Text>{name}</Text>
          {infoHelperText && <InfoHelper text={infoHelperText} />}
        </Flex>
      </Field>
      <Flex alignItems="center" style={{ gap: '4px' }}>
        {currency && value !== '-' && <CurrencyLogo currency={currency} size="16px" />}
        <Value>{value}</Value>
      </Flex>
    </Flex>
  )
}

export function ItemCardInfoRowPriceRange({ poolData }: { poolData: SubgraphPoolData }) {
  const formatPriceMin = (price?: Fraction) => {
    return price?.toSignificant(6) ?? '0'
  }

  const formatPriceMax = (price?: Fraction) => {
    return !price || price.equalTo(new Fraction('-1')) ? '♾️' : price.toSignificant(6)
  }

  return (
    <>
      <Flex justifyContent="space-between">
        <Field>
          <Trans>Price Range</Trans>
        </Field>
      </Flex>
      <Flex justifyContent="space-between">
        <Field style={{ marginLeft: '4px' }}>
          • {poolData.token0.symbol}/{poolData.token1.symbol}
        </Field>
        <Value>
          {formatPriceMin(priceRangeCalcBySubgraphPool(poolData)[0][0])} -{' '}
          {formatPriceMax(priceRangeCalcBySubgraphPool(poolData)[0][1])}
        </Value>
      </Flex>
      <Flex justifyContent="space-between">
        <Field style={{ marginLeft: '4px' }}>
          • {poolData.token1.symbol}/{poolData.token0.symbol}
        </Field>
        <Value>
          {formatPriceMin(priceRangeCalcBySubgraphPool(poolData)[1][0])} -{' '}
          {formatPriceMax(priceRangeCalcBySubgraphPool(poolData)[1][1])}
        </Value>
      </Flex>
    </>
  )
}
