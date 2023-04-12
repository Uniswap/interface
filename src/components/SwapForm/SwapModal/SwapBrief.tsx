import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import React from 'react'
import { ArrowDown } from 'react-feather'
import Skeleton from 'react-loading-skeleton'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import { RowBetween } from 'components/Row'
import { useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import UpdatedBadge, { Props as UpdatedBadgeProps } from 'components/SwapForm/SwapModal/SwapDetails/UpdatedBadge'
import { RESERVE_USD_DECIMALS } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { formattedNum } from 'utils'

type Props = {
  inputAmount: CurrencyAmount<Currency>
  amountInUsd: string
  outputAmount: CurrencyAmount<Currency>
  outputAmountFromBuild: CurrencyAmount<Currency> | undefined
  amountOutUsdFromBuild: string | undefined
  isLoading: boolean
  currencyOut: Currency
} & UpdatedBadgeProps

const TruncatedText = styled(Text)`
  text-overflow: ellipsis;
  overflow: hidden;
  font-size: 24px;
  font-weight: 500;
`

export const CurrencyInputAmountWrapper = styled(Flex)`
  flex-direction: column;
  gap: 8px;
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.border};
  padding: 12px 16px;
`

export const ArrowDownWrapper = styled.div`
  border: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.buttonGray};
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: calc(76px - 6px);
  left: 50%;
  transform: translateX(-50%);
`

export default function SwapBrief({
  inputAmount,
  amountInUsd,
  outputAmount,
  outputAmountFromBuild,
  amountOutUsdFromBuild,
  $level,
  isLoading,
  currencyOut,
}: Props) {
  const theme = useTheme()
  const { typedValue } = useSwapFormContext()

  const renderOutputAmount = () => {
    if (isLoading) {
      return (
        <Skeleton
          width="108px"
          // there's border of 1px
          height="26.5px"
          baseColor={theme.border}
          highlightColor={theme.buttonGray}
          borderRadius="80px"
        />
      )
    }

    if (!outputAmountFromBuild) {
      return <TruncatedText>--</TruncatedText>
    }

    return <TruncatedText>{outputAmountFromBuild.toSignificant(RESERVE_USD_DECIMALS)}</TruncatedText>
  }

  const renderAmountOutUsd = () => {
    if (isLoading) {
      return (
        <Skeleton
          width="64px"
          // there's border of 1px
          height="15px"
          baseColor={theme.border}
          highlightColor={theme.buttonGray}
          borderRadius="80px"
        />
      )
    }

    if (!amountOutUsdFromBuild) {
      return (
        <Text fontSize={14} fontWeight={500} color={theme.subText}>
          --
        </Text>
      )
    }

    return (
      <Text fontSize={14} fontWeight={500} color={theme.subText}>
        ~{formattedNum(amountOutUsdFromBuild, true)}
      </Text>
    )
  }

  return (
    <AutoColumn gap="sm" style={{ marginTop: '16px', position: 'relative' }}>
      <CurrencyInputAmountWrapper>
        <Text fontSize={12} fontWeight={500} color={theme.subText}>
          <Trans>Input Amount</Trans>
        </Text>
        <RowBetween>
          <TruncatedText>{typedValue}</TruncatedText>
          <Flex alignItems="center" sx={{ gap: '8px' }} minWidth="fit-content">
            <Text fontSize={14} fontWeight={500} color={theme.subText}>
              ~{formattedNum(amountInUsd, true)}
            </Text>
            <CurrencyLogo currency={inputAmount.currency} size="24px" />
            <Text fontSize={20} fontWeight={500} color={theme.subText}>
              {inputAmount.currency.symbol}
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
          <UpdatedBadge $level={$level} outputAmount={outputAmount} />
        </Flex>
        <RowBetween>
          {renderOutputAmount()}
          <Flex alignItems="center" sx={{ gap: '8px' }} minWidth="fit-content">
            {renderAmountOutUsd()}
            <CurrencyLogo currency={currencyOut} size="24px" />
            <Text fontSize={20} fontWeight={500} color={theme.subText}>
              {currencyOut.symbol}
            </Text>
          </Flex>
        </RowBetween>
      </CurrencyInputAmountWrapper>
    </AutoColumn>
  )
}
