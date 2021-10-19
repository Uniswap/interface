import { Trans } from '@lingui/macro'
import { Currency } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import Badge from 'components/Badge'
import { ButtonGray, ButtonRadioChecked } from 'components/Button'
import Card from 'components/Card'
import { AutoColumn } from 'components/Column'
import { RowBetween } from 'components/Row'
import { useFeeTierDistribution } from 'hooks/useFeeTierDistribution'
import { PoolState, usePools } from 'hooks/usePools'
import usePrevious from 'hooks/usePrevious'
import { DynamicSection } from 'pages/AddLiquidity/styled'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactGA from 'react-ga'
import { Box } from 'rebass'
import styled, { keyframes } from 'styled-components/macro'
import { TYPE } from 'theme'

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

const ResponsiveText = styled(TYPE.label)`
  line-height: 16px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 12px;
    line-height: 12px;
  `};
`

const FocusedOutlineCard = styled(Card)<{ pulsing: boolean }>`
  border: 1px solid ${({ theme }) => theme.bg2};
  animation: ${({ pulsing, theme }) => pulsing && pulse(theme.primary1)} 0.6s linear;
  align-self: center;
`

const FeeAmountLabel = {
  [FeeAmount.LOW]: {
    label: '0.05',
    description: <Trans>Best for stable pairs.</Trans>,
  },
  [FeeAmount.MEDIUM]: {
    label: '0.3',
    description: <Trans>Best for most pairs.</Trans>,
  },
  [FeeAmount.HIGH]: {
    label: '1',
    description: <Trans>Best for exotic pairs.</Trans>,
  },
}

function FeeTierPercentageBadge({
  feeAmount,
  distributions,
  poolState,
}: {
  feeAmount: FeeAmount
  distributions: ReturnType<typeof useFeeTierDistribution>['distributions']
  poolState: PoolState
}) {
  return (
    <Badge>
      <TYPE.label fontSize={12}>
        {!distributions || poolState === PoolState.NOT_EXISTS || poolState === PoolState.INVALID ? (
          <Trans>Not created</Trans>
        ) : distributions[feeAmount] !== undefined ? (
          <Trans>{distributions[feeAmount]?.toFixed(0)}% select</Trans>
        ) : (
          <Trans>No data</Trans>
        )}
      </TYPE.label>
    </Badge>
  )
}

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
  const { isLoading, isError, largestUsageFeeTier, distributions } = useFeeTierDistribution(currencyA, currencyB)

  // get pool data on-chain for latest states
  const pools = usePools([
    [currencyA, currencyB, FeeAmount.LOW],
    [currencyA, currencyB, FeeAmount.MEDIUM],
    [currencyA, currencyB, FeeAmount.HIGH],
  ])

  const poolsByFeeTier = useMemo(
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
    (fee) => {
      ReactGA.event({
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
      ReactGA.event({
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
                  <TYPE.label>
                    <Trans>Fee tier</Trans>
                  </TYPE.label>
                  <TYPE.main fontWeight={400} fontSize="12px" textAlign="left">
                    <Trans>The % you will earn in fees.</Trans>
                  </TYPE.main>
                </>
              ) : (
                <>
                  <TYPE.label className="selected-fee-label">
                    <Trans>{FeeAmountLabel[feeAmount].label}% fee tier</Trans>
                  </TYPE.label>
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

        {showOptions && (
          <RowBetween>
            <ButtonRadioChecked
              width="32%"
              active={feeAmount === FeeAmount.LOW}
              onClick={() => handleFeePoolSelectWithEvent(FeeAmount.LOW)}
            >
              <AutoColumn gap="sm" justify="flex-start">
                <AutoColumn justify="flex-start" gap="6px">
                  <ResponsiveText>
                    <Trans>0.05% fee</Trans>
                  </ResponsiveText>
                  <TYPE.main fontWeight={400} fontSize="12px" textAlign="left">
                    <Trans>Best for stable pairs.</Trans>
                  </TYPE.main>
                </AutoColumn>

                {distributions && (
                  <FeeTierPercentageBadge
                    distributions={distributions}
                    feeAmount={FeeAmount.LOW}
                    poolState={poolsByFeeTier[FeeAmount.LOW]}
                  />
                )}
              </AutoColumn>
            </ButtonRadioChecked>
            <ButtonRadioChecked
              width="32%"
              active={feeAmount === FeeAmount.MEDIUM}
              onClick={() => handleFeePoolSelectWithEvent(FeeAmount.MEDIUM)}
            >
              <AutoColumn gap="sm" justify="flex-start">
                <AutoColumn justify="flex-start" gap="4px">
                  <ResponsiveText>
                    <Trans>0.3% fee</Trans>
                  </ResponsiveText>
                  <TYPE.main fontWeight={400} fontSize="12px" textAlign="left">
                    <Trans>Best for most pairs.</Trans>
                  </TYPE.main>
                </AutoColumn>

                {distributions && (
                  <FeeTierPercentageBadge
                    distributions={distributions}
                    feeAmount={FeeAmount.MEDIUM}
                    poolState={poolsByFeeTier[FeeAmount.MEDIUM]}
                  />
                )}
              </AutoColumn>
            </ButtonRadioChecked>
            <ButtonRadioChecked
              width="32%"
              active={feeAmount === FeeAmount.HIGH}
              onClick={() => handleFeePoolSelectWithEvent(FeeAmount.HIGH)}
            >
              <AutoColumn gap="sm" justify="flex-start">
                <AutoColumn justify="flex-start" gap="4px">
                  <ResponsiveText>
                    <Trans>1% fee</Trans>
                  </ResponsiveText>
                  <TYPE.main fontWeight={400} fontSize="12px" textAlign="left">
                    <Trans>Best for exotic pairs.</Trans>
                  </TYPE.main>
                </AutoColumn>

                {distributions && (
                  <FeeTierPercentageBadge
                    distributions={distributions}
                    feeAmount={FeeAmount.HIGH}
                    poolState={poolsByFeeTier[FeeAmount.HIGH]}
                  />
                )}
              </AutoColumn>
            </ButtonRadioChecked>
          </RowBetween>
        )}
      </DynamicSection>
    </AutoColumn>
  )
}
