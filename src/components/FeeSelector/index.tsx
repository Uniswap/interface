import React, { useCallback, useEffect, useRef, useState } from 'react'
import { FeeAmount } from '@uniswap/v3-sdk'
import { Currency } from '@uniswap/sdk-core'
import { Trans } from '@lingui/macro'
import { AutoColumn } from 'components/Column'
import { DynamicSection } from 'pages/AddLiquidity/styled'
import { TYPE } from 'theme'
import { RowBetween } from 'components/Row'
import { ButtonGray, ButtonRadioChecked } from 'components/Button'
import styled, { keyframes } from 'styled-components/macro'
import Badge from 'components/Badge'
import Card from 'components/Card'
import usePrevious from 'hooks/usePrevious'
import { useFeeTierDistribution } from 'hooks/useFeeTierDistribution'
import ReactGA from 'react-ga'
import { Box } from 'rebass'

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

const FeeTierPercentageBadge = ({ percentage }: { percentage: number | undefined }) => {
  return (
    <Badge>
      <TYPE.label fontSize={12}>
        {percentage !== undefined ? <Trans>{percentage?.toFixed(0)}% select</Trans> : <Trans>Not created</Trans>}
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
                  <TYPE.label data-test-id="selected-fee-label">
                    <Trans>{FeeAmountLabel[feeAmount].label}% fee tier</Trans>
                  </TYPE.label>
                  <Box style={{ width: 'fit-content', marginTop: '8px' }} data-test-id="selected-fee-percentage">
                    {distributions && feeAmount && <FeeTierPercentageBadge percentage={distributions[feeAmount]} />}
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

                {distributions && <FeeTierPercentageBadge percentage={distributions[FeeAmount.LOW]} />}
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

                {distributions && <FeeTierPercentageBadge percentage={distributions[FeeAmount.MEDIUM]} />}
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

                {distributions && <FeeTierPercentageBadge percentage={distributions[FeeAmount.HIGH]} />}
              </AutoColumn>
            </ButtonRadioChecked>
          </RowBetween>
        )}
      </DynamicSection>
    </AutoColumn>
  )
}
