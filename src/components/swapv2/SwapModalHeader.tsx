import { Trans } from '@lingui/macro'
import React from 'react'
import { ArrowDown } from 'react-feather'
import { Flex, Text } from 'rebass'

import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import { RowBetween } from 'components/Row'
import { ArrowDownWrapper, CurrencyInputAmountWrapper } from 'components/SwapForm/SwapModal/SwapBrief'
import { RESERVE_USD_DECIMALS } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { useSwapState } from 'state/swap/hooks'
import { formattedNum } from 'utils'
import { Aggregator } from 'utils/aggregator'
import { useCurrencyConvertedToNative } from 'utils/dmm'

import { TruncatedText } from './styleds'

export default function SwapModalHeader({ trade }: { trade: Aggregator }) {
  const theme = useTheme()

  const nativeInput = useCurrencyConvertedToNative(trade.inputAmount.currency)

  const nativeOutput = useCurrencyConvertedToNative(trade.outputAmount.currency)

  const { typedValue } = useSwapState()

  return (
    <>
      <Text fontWeight={400} fontSize={12} color={theme.subText} mt="12px">
        <Trans>Please review the details of your swap:</Trans>
      </Text>
      <AutoColumn gap="sm" style={{ marginTop: '16px', position: 'relative' }}>
        <CurrencyInputAmountWrapper>
          <Text fontSize={12} fontWeight={500} color={theme.subText}>
            <Trans>Input Amount</Trans>
          </Text>
          <RowBetween>
            <TruncatedText>{typedValue}</TruncatedText>
            <Flex alignItems="center" sx={{ gap: '8px' }} minWidth="fit-content">
              <Text fontSize={14} fontWeight={500} color={theme.subText}>
                ~{formattedNum(trade.amountInUsd.toString(), true)}
              </Text>
              <CurrencyLogo currency={nativeInput} size="24px" />
              <Text fontSize={20} fontWeight={500} color={theme.subText}>
                {nativeInput?.symbol}
              </Text>
            </Flex>
          </RowBetween>
        </CurrencyInputAmountWrapper>

        <ArrowDownWrapper>
          <ArrowDown size="12" color={theme.subText} />
        </ArrowDownWrapper>

        <CurrencyInputAmountWrapper>
          <Flex alignItems="center" style={{ gap: '4px' }}>
            <Text fontSize={12} fontWeight={500} color={theme.subText}>
              <Trans>Output Amount</Trans>
            </Text>
          </Flex>
          <RowBetween>
            <TruncatedText>{trade.outputAmount.toSignificant(RESERVE_USD_DECIMALS)}</TruncatedText>
            <Flex alignItems="center" sx={{ gap: '8px' }} minWidth="fit-content">
              <Text fontSize={14} fontWeight={500} color={theme.subText}>
                ~{formattedNum(trade.amountOutUsd.toString(), true)}
              </Text>
              <CurrencyLogo currency={nativeOutput} size="24px" />
              <Text fontSize={20} fontWeight={500} color={theme.subText}>
                {nativeOutput?.symbol}
              </Text>
            </Flex>
          </RowBetween>
        </CurrencyInputAmountWrapper>
      </AutoColumn>
    </>
  )
}
