import { Fraction, Percent, Token } from '@uniswap/sdk'
import React, { useContext } from 'react'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { AutoColumn } from '../../components/Column'
import { AutoRow } from '../../components/Row'
import { ONE_BIPS } from '../../constants'
import { Field } from '../../state/mint/actions'
import { TYPE } from '../../theme'

export const PoolPriceBar = ({
  tokens,
  noLiquidity,
  poolTokenPercentage,
  price
}: {
  tokens: { [field in Field]?: Token }
  noLiquidity?: boolean
  poolTokenPercentage?: Percent
  price?: Fraction
}) => {
  const theme = useContext(ThemeContext)
  return (
    <AutoColumn gap="md">
      <AutoRow justify="space-around" gap="4px">
        <AutoColumn justify="center">
          <TYPE.black>{price?.toSignificant(6) ?? '0'}</TYPE.black>
          <Text fontWeight={500} fontSize={14} color={theme.text2} pt={1}>
            {tokens[Field.TOKEN_B]?.symbol} per {tokens[Field.TOKEN_A]?.symbol}
          </Text>
        </AutoColumn>
        <AutoColumn justify="center">
          <TYPE.black>{price?.invert().toSignificant(6) ?? '0'}</TYPE.black>
          <Text fontWeight={500} fontSize={14} color={theme.text2} pt={1}>
            {tokens[Field.TOKEN_A]?.symbol} per {tokens[Field.TOKEN_B]?.symbol}
          </Text>
        </AutoColumn>
        <AutoColumn justify="center">
          <TYPE.black>
            {noLiquidity && price
              ? '100'
              : (poolTokenPercentage?.lessThan(ONE_BIPS) ? '<0.01' : poolTokenPercentage?.toFixed(2)) ?? '0'}
            %
          </TYPE.black>
          <Text fontWeight={500} fontSize={14} color={theme.text2} pt={1}>
            Share of Pool
          </Text>
        </AutoColumn>
      </AutoRow>
    </AutoColumn>
  )
}
