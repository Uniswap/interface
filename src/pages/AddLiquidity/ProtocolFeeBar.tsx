import { Percent, CurrencyAmount } from '@swapr/sdk'
import React, { useContext } from 'react'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { AutoColumn } from '../../components/Column'
import { AutoRow } from '../../components/Row'
import QuestionHelper from '../../components/QuestionHelper'
import { TYPE } from '../../theme'

export function ProtocolFeeBar({
  feePercentage,
  swapFee,
  protocolFeeDenominator,
  feeAAmount,
  feeBAmount
}: {
  feePercentage?: Percent
  swapFee?: Percent
  protocolFeeDenominator?: number
  feeAAmount?: CurrencyAmount
  feeBAmount?: CurrencyAmount
}) {
  const theme = useContext(ThemeContext)
  return (
    <AutoColumn gap="md">
      <AutoRow justify="space-around" gap="4px">
        <AutoColumn justify="center">
          <TYPE.black>{swapFee?.toSignificant(4) ?? '-'} %</TYPE.black>
          <Text fontWeight={500} fontSize={14} color={theme.text2} pt={1}>
            Swap fee
            <QuestionHelper text="The % fee applied to each swap in the token pair." />
          </Text>
        </AutoColumn>
        <AutoColumn justify="center">
          <TYPE.black>{protocolFeeDenominator?.toString() ?? '-'}</TYPE.black>
          <Text fontWeight={500} fontSize={14} color={theme.text2} pt={1}>
            Protocol Fee Denominator
            <QuestionHelper text="The number to which the swap fee is divided to get the protocol fee." />
          </Text>
        </AutoColumn>
        <AutoColumn justify="center">
          <TYPE.black>{feePercentage?.toSignificant(4) ?? '-'} %</TYPE.black>
          <Text fontWeight={500} fontSize={14} color={theme.text2} pt={1}>
            Protocol Fee %
            <QuestionHelper text="The % fee applied to each addition and removal of liquidity in the token pair." />
          </Text>
        </AutoColumn>
        <AutoColumn justify="center">
          <TYPE.black>{feeAAmount?.toSignificant(4) ?? '-'}</TYPE.black>
          <Text fontWeight={500} fontSize={14} color={theme.text2} pt={1}>
            {feeAAmount?.currency.symbol}
          </Text>
        </AutoColumn>
        <AutoColumn justify="center">
          <TYPE.black>{feeBAmount?.toSignificant(4) ?? '-'}</TYPE.black>
          <Text fontWeight={500} fontSize={14} color={theme.text2} pt={1}>
            {feeBAmount?.currency.symbol}
          </Text>
        </AutoColumn>
      </AutoRow>
    </AutoColumn>
  )
}
