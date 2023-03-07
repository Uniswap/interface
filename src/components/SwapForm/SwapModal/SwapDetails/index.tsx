import { Currency, Price, Rounding } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { useState } from 'react'
import { AlertTriangle, Repeat } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { AutoColumn } from 'components/Column'
import Dots from 'components/Dots'
import InfoHelper from 'components/InfoHelper'
import Loader from 'components/Loader'
import { RowBetween, RowFixed } from 'components/Row'
import { useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import ValueWithLoadingSkeleton from 'components/SwapForm/SwapModal/SwapDetails/ValueWithLoadingSkeleton'
import { StyledBalanceMaxMini } from 'components/swapv2/styleds'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { TYPE } from 'theme'
import { DetailedRouteSummary } from 'types/route'
import { formattedNum, toK } from 'utils'
import { minimumAmountAfterSlippage } from 'utils/currencyAmount'
import { getFormattedFeeAmountUsdV2 } from 'utils/fee'

function formattedMinimumReceived(number: string) {
  if (!number) {
    return 0
  }

  const num = parseFloat(number)

  if (num > 500000000) {
    return toK(num.toFixed(0))
  }

  if (num === 0) {
    return 0
  }

  if (num < 0.0001 && num > 0) {
    return '< 0.0001'
  }

  if (num >= 1000) {
    return Number(num.toFixed(0)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 6 })
  }

  return Number(num.toFixed(6)).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  })
}

function formatExecutionPrice(executionPrice?: Price<Currency, Currency>, inverted?: boolean): string {
  if (!executionPrice) {
    return ''
  }

  const inputSymbol = executionPrice.baseCurrency?.symbol
  const outputSymbol = executionPrice.quoteCurrency?.symbol

  return inverted
    ? `${executionPrice.invert().toSignificant(6, undefined, Rounding.ROUND_DOWN)} ${inputSymbol} / ${outputSymbol}`
    : `${executionPrice.toSignificant(6, undefined, Rounding.ROUND_DOWN)} ${outputSymbol} / ${inputSymbol}`
}

const StatusWrapper = styled.div`
  width: 100%;
  height: 40px;
`

type Optional<T> = {
  [key in keyof T]: T[key] | undefined
}

export type Props = {
  isLoading: boolean
  hasError: boolean
} & Optional<Pick<DetailedRouteSummary, 'gasUsd' | 'parsedAmountOut' | 'executionPrice' | 'amountInUsd'>>

const SwapDetails: React.FC<Props> = ({
  isLoading,
  hasError,
  gasUsd,
  parsedAmountOut,
  executionPrice,
  amountInUsd,
}) => {
  const { isSolana, isEVM } = useActiveWeb3React()
  const [showInverted, setShowInverted] = useState<boolean>(false)
  const theme = useTheme()
  const { feeConfig, slippage } = useSwapFormContext()

  const formattedFeeAmountUsd = getFormattedFeeAmountUsdV2(Number(amountInUsd || 0), feeConfig?.feeAmount)

  const minimumAmountOut = parsedAmountOut ? minimumAmountAfterSlippage(parsedAmountOut, slippage) : undefined
  const currencyOut = parsedAmountOut?.currency
  const minimumAmountOutStr =
    minimumAmountOut && currencyOut ? (
      <Text
        as="span"
        sx={{
          color: theme.text,
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
        }}
      >
        {formattedMinimumReceived(minimumAmountOut.toSignificant(6))} {currencyOut.symbol}
      </Text>
    ) : (
      ''
    )

  const renderStatusNotice = () => {
    if (isLoading) {
      return (
        <StatusWrapper>
          <Flex
            width="100%"
            height="100%"
            padding="0 10px"
            alignItems="center"
            sx={{
              borderRadius: '24px',
              background: theme.buttonBlack,
              gap: '8px',
            }}
          >
            <Loader size="20px" stroke={theme.primary} />
            <Text as="span" fontSize="12px" color={theme.primary} fontStyle="italic">
              <Dots>
                <Trans>Locking in this price</Trans>
              </Dots>
            </Text>
          </Flex>
        </StatusWrapper>
      )
    }

    if (hasError) {
      return (
        <StatusWrapper>
          <Flex
            width="100%"
            height="100%"
            padding="12px"
            alignItems="center"
            sx={{
              borderRadius: '24px',
              background: rgba(theme.warning, 0.25),
              gap: '8px',
            }}
          >
            <AlertTriangle color={theme.warning} size={16} />
            <Text as="span" color={theme.warning} fontSize="12px">
              <Trans>Something went wrong. Please try again</Trans>
            </Text>
          </Flex>
        </StatusWrapper>
      )
    }

    return (
      <StatusWrapper>
        <TYPE.subHeader textAlign="left" style={{ width: '100%', color: theme.subText, fontStyle: 'italic' }}>
          {minimumAmountOutStr && (
            <Trans>
              Output is estimated. You will receive at least {minimumAmountOutStr} or the transaction will revert.
            </Trans>
          )}
          {isSolana && <Trans>We may send multiple transactions to complete the swap.</Trans>}
        </TYPE.subHeader>
      </StatusWrapper>
    )
  }

  return (
    <>
      {renderStatusNotice()}

      <AutoColumn gap="0.5rem" style={{ padding: '1rem', border: `1px solid ${theme.border}`, borderRadius: '8px' }}>
        <RowBetween align="center" height="20px">
          <Text fontWeight={400} fontSize={14} color={theme.subText}>
            <Trans>Current Price</Trans>
          </Text>

          <ValueWithLoadingSkeleton
            skeletonStyle={{
              width: '160px',
            }}
            isShowingSkeleton={isLoading}
            content={
              executionPrice ? (
                <Flex
                  fontWeight={500}
                  fontSize={14}
                  color={theme.text}
                  sx={{
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'right',
                    paddingLeft: '10px',
                  }}
                >
                  {formatExecutionPrice(executionPrice, showInverted)}
                  <StyledBalanceMaxMini onClick={() => setShowInverted(!showInverted)}>
                    <Repeat size={14} color={theme.text} />
                  </StyledBalanceMaxMini>
                </Flex>
              ) : (
                <TYPE.black fontSize={14}>--</TYPE.black>
              )
            }
          />
        </RowBetween>

        <RowBetween align="center" height="20px">
          <RowFixed>
            <TYPE.black fontSize={14} fontWeight={400} color={theme.subText}>
              <Trans>Minimum Received</Trans>
            </TYPE.black>
            <InfoHelper size={14} text={t`You will receive at least this amount or your transaction will revert`} />
          </RowFixed>

          <ValueWithLoadingSkeleton
            skeletonStyle={{
              width: '108px',
            }}
            isShowingSkeleton={isLoading}
            content={<TYPE.black fontSize={14}>{minimumAmountOutStr || '--'}</TYPE.black>}
          />
        </RowBetween>

        {isEVM && (
          <RowBetween height="20px">
            <RowFixed>
              <TYPE.black fontSize={14} fontWeight={400} color={theme.subText}>
                <Trans>Gas Fee</Trans>
              </TYPE.black>
              <InfoHelper size={14} text={t`Estimated network fee for your transaction`} />
            </RowFixed>

            <ValueWithLoadingSkeleton
              skeletonStyle={{
                width: '64px',
              }}
              isShowingSkeleton={isLoading}
              content={
                <TYPE.black color={theme.text} fontSize={14}>
                  {gasUsd ? formattedNum(String(gasUsd), true) : '--'}
                </TYPE.black>
              }
            />
          </RowBetween>
        )}

        <RowBetween height="20px">
          <RowFixed>
            <TYPE.black fontSize={14} fontWeight={400} color={theme.subText}>
              <Trans>Slippage</Trans>
            </TYPE.black>
          </RowFixed>

          <TYPE.black fontSize={14}>{slippage / 100}%</TYPE.black>
        </RowBetween>

        {feeConfig && (
          <RowBetween>
            <RowFixed>
              <TYPE.black fontSize={14} fontWeight={400} color={theme.subText}>
                <Trans>Referral Fee</Trans>
              </TYPE.black>
              <InfoHelper size={14} text={t`Commission fee to be paid directly to your referrer`} />
            </RowFixed>
            <TYPE.black color={theme.text} fontSize={14}>
              {formattedFeeAmountUsd}
            </TYPE.black>
          </RowBetween>
        )}
      </AutoColumn>
    </>
  )
}

export default SwapDetails
