import { Trans } from '@lingui/macro'
import { Currency } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { useWeb3React } from '@web3-react/core'
import { sendEvent } from 'components/analytics'
import { ButtonGray } from 'components/Button'
import Card from 'components/Card'
import { AutoColumn } from 'components/Column'
import { RowBetween } from 'components/Row'
import { useFeeTierDistribution } from 'hooks/useFeeTierDistribution'
import { PoolState, usePools } from 'hooks/usePools'
import usePrevious from 'hooks/usePrevious'
import { DynamicSection } from 'pages/AddLiquidity/styled'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Box } from 'rebass'
import styled, { keyframes } from 'styled-components/macro'
import { ThemedText } from 'theme'

import { FeeOption } from './FeeOption'
import { FeeTierPercentageBadge } from './FeeTierPercentageBadge'
import { FEE_AMOUNT_DETAIL } from './shared'

const pulse = (color: string) => keyframes`
  0% {
    box-shadow: 0 0 0 0 ${color};
  }

  70% {
    box-shadow: 0 0 0 2px ${color};
  }

  100% {
    box-shadow: 0 0 0 0 ${color};
  }
`
const FocusedOutlineCard = styled(Card)<{ pulsing: boolean }>`
  border: 1px solid ${({ theme }) => theme.backgroundInteractive};
  animation: ${({ pulsing, theme }) => pulsing && pulse(theme.accentAction)} 0.6s linear;
  align-self: center;
`

const Select = styled.div`
  align-items: flex-start;
  display: grid;
  grid-auto-flow: column;
  grid-gap: 8px;
`

export default function FeeSelector({
  disabled = false,
  feeAmount,
  handleFeePoolSelect,
  currencyA,
  currencyB,
}: {
  disabled?: boolean
  feeAmount?: FeeAmount
  handleFeePoolSelect: (feeAmount: FeeAmount) => void
  currencyA?: Currency | undefined
  currencyB?: Currency | undefined
}) {
  const { chainId } = useWeb3React()

  const { isLoading, isError, largestUsageFeeTier, distributions } = useFeeTierDistribution(currencyA, currencyB)

  // get pool data on-chain for latest states
  const pools = usePools([
    [currencyA, currencyB, FeeAmount.LOWEST],
    [currencyA, currencyB, FeeAmount.LOW],
    [currencyA, currencyB, FeeAmount.MEDIUM],
    [currencyA, currencyB, FeeAmount.HIGH],
  ])

  const poolsByFeeTier: Record<FeeAmount, PoolState> = useMemo(
    () =>
      pools.reduce(
        (acc, [curPoolState, curPool]) => {
          acc = {
            ...acc,
            ...{ [curPool?.fee as FeeAmount]: curPoolState },
          }
          return acc
        },
        {
          // default all states to NOT_EXISTS
          [FeeAmount.LOWEST]: PoolState.NOT_EXISTS,
          [FeeAmount.LOW]: PoolState.NOT_EXISTS,
          [FeeAmount.MEDIUM]: PoolState.NOT_EXISTS,
          [FeeAmount.HIGH]: PoolState.NOT_EXISTS,
        }
      ),
    [pools]
  )

  const [showOptions, setShowOptions] = useState(false)
  const [pulsing, setPulsing] = useState(false)

  const previousFeeAmount = usePrevious(feeAmount)

  const recommended = useRef(false)

  const handleFeePoolSelectWithEvent = useCallback(
    (fee: FeeAmount) => {
      sendEvent({
        category: 'FeePoolSelect',
        action: 'Manual',
      })
      handleFeePoolSelect(fee)
    },
    [handleFeePoolSelect]
  )

  useEffect(() => {
    if (feeAmount || isLoading || isError) {
      return
    }

    if (!largestUsageFeeTier) {
      // cannot recommend, open options
      setShowOptions(true)
    } else {
      setShowOptions(false)

      recommended.current = true
      sendEvent({
        category: 'FeePoolSelect',
        action: ' Recommended',
      })

      handleFeePoolSelect(largestUsageFeeTier)
    }
  }, [feeAmount, isLoading, isError, largestUsageFeeTier, handleFeePoolSelect])

  useEffect(() => {
    setShowOptions(isError)
  }, [isError])

  useEffect(() => {
    if (feeAmount && previousFeeAmount !== feeAmount) {
      setPulsing(true)
    }
  }, [previousFeeAmount, feeAmount])

  return (
    <AutoColumn gap="16px">
      <DynamicSection gap="md" disabled={disabled}>
        <FocusedOutlineCard pulsing={pulsing} onAnimationEnd={() => setPulsing(false)}>
          <RowBetween>
            <AutoColumn id="add-liquidity-selected-fee">
              {!feeAmount ? (
                <>
                  <ThemedText.DeprecatedLabel>
                    <Trans>Fee tier</Trans>
                  </ThemedText.DeprecatedLabel>
                  <ThemedText.DeprecatedMain fontWeight={400} fontSize="12px" textAlign="left">
                    <Trans>The % you will earn in fees.</Trans>
                  </ThemedText.DeprecatedMain>
                </>
              ) : (
                <>
                  <ThemedText.DeprecatedLabel className="selected-fee-label">
                    <Trans>{FEE_AMOUNT_DETAIL[feeAmount].label}% fee tier</Trans>
                  </ThemedText.DeprecatedLabel>
                  <Box style={{ width: 'fit-content', marginTop: '8px' }} className="selected-fee-percentage">
                    {distributions && (
                      <FeeTierPercentageBadge
                        distributions={distributions}
                        feeAmount={feeAmount}
                        poolState={poolsByFeeTier[feeAmount]}
                      />
                    )}
                  </Box>
                </>
              )}
            </AutoColumn>

            <ButtonGray onClick={() => setShowOptions(!showOptions)} width="auto" padding="4px" $borderRadius="6px">
              {showOptions ? <Trans>Hide</Trans> : <Trans>Edit</Trans>}
            </ButtonGray>
          </RowBetween>
        </FocusedOutlineCard>

        {chainId && showOptions && (
          <Select>
            {[FeeAmount.LOWEST, FeeAmount.LOW, FeeAmount.MEDIUM, FeeAmount.HIGH].map((_feeAmount, i) => {
              const { supportedChains } = FEE_AMOUNT_DETAIL[_feeAmount]
              if (supportedChains.includes(chainId)) {
                return (
                  <FeeOption
                    feeAmount={_feeAmount}
                    active={feeAmount === _feeAmount}
                    onClick={() => handleFeePoolSelectWithEvent(_feeAmount)}
                    distributions={distributions}
                    poolState={poolsByFeeTier[_feeAmount]}
                    key={i}
                  />
                )
              }
              return null
            })}
          </Select>
        )}
      </DynamicSection>
    </AutoColumn>
  )
}
