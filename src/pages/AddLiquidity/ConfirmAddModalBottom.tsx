import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Fraction, JSBI, Pair, Percent } from 'libs/sdk/src'
import React from 'react'
import { Text } from 'rebass'
import { ButtonPrimary } from '../../components/Button'
import { AutoRow, RowBetween, RowFixed } from '../../components/Row'
import CurrencyLogo from '../../components/CurrencyLogo'
import { Field } from '../../state/mint/actions'
import { TYPE } from '../../theme'
import { PoolPriceRangeBar } from './PoolPriceBar'
import { AutoColumn } from 'components/Column'
import { Separator } from 'components/SearchModal/styleds'
import styled from 'styled-components'
import { parseUnits } from 'ethers/lib/utils'
import { useActiveWeb3React } from 'hooks'
import { useCurrencyConvertedToNative } from 'utils/dmm'

const DashedLine = styled.div`
  width: 100%;
  border: 1px solid ${({ theme }) => theme.bg3};
  border-style: dashed;
`
export function ConfirmAddModalBottom({
  pair,
  noLiquidity,
  price,
  currencies,
  parsedAmounts,
  poolTokenPercentage,
  onAdd,
  amplification
}: {
  pair: Pair | null | undefined
  noLiquidity?: boolean
  price?: Fraction
  currencies: { [field in Field]?: Currency }
  parsedAmounts: { [field in Field]?: CurrencyAmount }
  poolTokenPercentage?: Percent
  onAdd: () => void
  amplification?: Fraction
}) {
  const amp = !!pair
    ? new Fraction(pair.amp).divide(JSBI.BigInt(10000)).toSignificant(5)
    : amplification?.divide(JSBI.BigInt(10000)).toSignificant(5)
  const { chainId } = useActiveWeb3React()
  const tokenA = useCurrencyConvertedToNative(currencies[Field.CURRENCY_A] as Currency)
  const tokenB = useCurrencyConvertedToNative(currencies[Field.CURRENCY_B] as Currency)
  return (
    <>
      <RowBetween>
        <TYPE.body>
          <Trans>Pooled {tokenA?.symbol}</Trans>
        </TYPE.body>
        <RowFixed>
          <CurrencyLogo currency={currencies[Field.CURRENCY_A]} style={{ marginRight: '8px' }} />
          <TYPE.body>{parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)}</TYPE.body>
        </RowFixed>
      </RowBetween>
      <RowBetween>
        <TYPE.body>
          <TYPE.body>
            <Trans>Pooled {tokenB?.symbol}</Trans>
          </TYPE.body>
        </TYPE.body>
        <RowFixed>
          <CurrencyLogo currency={currencies[Field.CURRENCY_B]} style={{ marginRight: '8px' }} />
          <TYPE.body>{parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)}</TYPE.body>
        </RowFixed>
      </RowBetween>
      <RowBetween>
        <TYPE.body>Rates</TYPE.body>
        <TYPE.body>{`1 ${tokenA?.symbol} = ${price?.toSignificant(4)} ${tokenB?.symbol}`}</TYPE.body>
      </RowBetween>
      <RowBetween style={{ justifyContent: 'flex-end' }}>
        <TYPE.body>{`1 ${tokenB?.symbol} = ${price?.invert().toSignificant(4)} ${tokenA?.symbol}`}</TYPE.body>
      </RowBetween>
      <DashedLine />
      <TYPE.body>AMP{!!amp ? <>&nbsp;=&nbsp;{amp}</> : ''}</TYPE.body>
      <PoolPriceRangeBar pair={pair} currencies={currencies} price={price} amplification={amplification} />

      <DashedLine />
      <RowBetween>
        <TYPE.body>Pool Share: {noLiquidity ? '100' : poolTokenPercentage?.toSignificant(4)}%</TYPE.body>
      </RowBetween>
      <ButtonPrimary style={{ margin: '20px 0 0 0' }} onClick={onAdd}>
        <Text fontWeight={500} fontSize={20}>
          {noLiquidity ? 'Create Pool' : 'Confirm'}
        </Text>
      </ButtonPrimary>
    </>
  )
}
