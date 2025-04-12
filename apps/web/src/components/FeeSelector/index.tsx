import { FeePoolSelectAction, LiquidityEventName } from '@uniswap/analytics-events'
import { Currency } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import Card from 'components/Card/cards'
import { FeeOption } from 'components/FeeSelector/FeeOption'
import { FeeTierPercentageBadge } from 'components/FeeSelector/FeeTierPercentageBadge'
import { FEE_AMOUNT_DETAIL } from 'components/FeeSelector/shared'
import { AutoColumn } from 'components/deprecated/Column'
import { useAccount } from 'hooks/useAccount'
import { useFeeTierDistribution } from 'hooks/useFeeTierDistribution'
import { PoolState, usePools } from 'hooks/usePools'
import usePrevious from 'hooks/usePrevious'
import styled, { keyframes } from 'lib/styled-components'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Trans } from 'react-i18next'
import { Button, Flex, RadioButtonGroup, Text } from 'ui/src'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { useFormatter } from 'utils/formatNumbers'

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
  border: 1px solid ${({ theme }) => theme.surface3};
  animation: ${({ pulsing, theme }) => pulsing && pulse(theme.accent1)} 0.6s linear;
  align-self: center;
`

const Select = styled.div`
  align-items: flex-start;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-gap: 8px;
  width: 100%;
`

const DynamicSection = styled(AutoColumn)<{ disabled?: boolean }>`
  opacity: ${({ disabled }) => (disabled ? '0.2' : '1')};
  pointer-events: ${({ disabled }) => (disabled ? 'none' : 'initial')};
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
  currencyA?: Currency
  currencyB?: Currency
}) {
  const { chainId } = useAccount()
  const trace = useTrace()
  const { formatDelta } = useFormatter()

  const { isLoading, isError, largestUsageFeeTier, distributions } = useFeeTierDistribution(currencyA, currencyB)

  // get pool data on-chain for latest states
  const pools = usePools(
    [
      [currencyA, currencyB, FeeAmount.LOWEST],
      [currencyA, currencyB, FeeAmount.LOW_200],
      [currencyA, currencyB, FeeAmount.LOW_300],
      [currencyA, currencyB, FeeAmount.LOW_400],
      [currencyA, currencyB, FeeAmount.LOW],
      [currencyA, currencyB, FeeAmount.MEDIUM],
      [currencyA, currencyB, FeeAmount.HIGH],
    ],
    chainId,
  )

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
          [FeeAmount.LOW_200]: PoolState.NOT_EXISTS,
          [FeeAmount.LOW_300]: PoolState.NOT_EXISTS,
          [FeeAmount.LOW_400]: PoolState.NOT_EXISTS,
          [FeeAmount.LOW]: PoolState.NOT_EXISTS,
          [FeeAmount.MEDIUM]: PoolState.NOT_EXISTS,
          [FeeAmount.HIGH]: PoolState.NOT_EXISTS,
        },
      ),
    [pools],
  )

  const [showOptions, setShowOptions] = useState(false)
  const [pulsing, setPulsing] = useState(false)

  const previousFeeAmount = usePrevious(feeAmount)

  const recommended = useRef(false)

  const handleFeePoolSelectWithEvent = useCallback(
    (fee: FeeAmount) => {
      sendAnalyticsEvent(LiquidityEventName.SELECT_LIQUIDITY_POOL_FEE_TIER, {
        action: FeePoolSelectAction.MANUAL,
        fee_tier: fee,
        ...trace,
      })
      handleFeePoolSelect(fee)
    },
    [handleFeePoolSelect, trace],
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
      sendAnalyticsEvent(LiquidityEventName.SELECT_LIQUIDITY_POOL_FEE_TIER, {
        action: FeePoolSelectAction.RECOMMENDED,
        fee_tier: largestUsageFeeTier,
        ...trace,
      })

      handleFeePoolSelect(largestUsageFeeTier)
    }
  }, [feeAmount, isLoading, isError, largestUsageFeeTier, handleFeePoolSelect, trace])

  useEffect(() => {
    setShowOptions(isError)
  }, [isError])

  useEffect(() => {
    if (feeAmount && previousFeeAmount !== feeAmount) {
      setPulsing(true)
    }
  }, [previousFeeAmount, feeAmount])

  return (
    <Flex gap="$gap16">
      <DynamicSection gap="md" disabled={disabled}>
        <FocusedOutlineCard pulsing={pulsing} onAnimationEnd={() => setPulsing(false)}>
          <Flex row justifyContent="space-between" alignItems="center">
            <Flex id="add-liquidity-selected-fee">
              {!feeAmount ? (
                <>
                  <Text>
                    <Trans i18nKey="fee.tier" />
                  </Text>
                  <Text variant="body3" color="$neutral2">
                    <Trans i18nKey="fee.percentEarned" />
                  </Text>
                </>
              ) : (
                <>
                  <Text className="selected-fee-label">
                    <Trans
                      i18nKey="fee.tierExact"
                      values={{ fee: formatDelta(parseFloat(FEE_AMOUNT_DETAIL[feeAmount].label)) }}
                    />
                  </Text>
                  {distributions && (
                    <Flex row className="selected-fee-percentage">
                      <FeeTierPercentageBadge
                        distributions={distributions}
                        feeAmount={feeAmount}
                        poolState={poolsByFeeTier[feeAmount]}
                      />
                    </Flex>
                  )}
                </>
              )}
            </Flex>

            <Button
              onPress={() => setShowOptions(!showOptions)}
              variant="default"
              emphasis="secondary"
              size="small"
              fill={false}
            >
              {showOptions ? <Trans i18nKey="common.hide.button" /> : <Trans i18nKey="common.edit.button" />}
            </Button>
          </Flex>
        </FocusedOutlineCard>

        {chainId && showOptions && (
          <RadioButtonGroup
            value={feeAmount?.toString()}
            orientation="horizontal"
            justifyContent="flex-start"
            flexWrap="wrap"
          >
            <Select>
              {[
                FeeAmount.LOWEST,
                FeeAmount.LOW_200,
                FeeAmount.LOW_300,
                FeeAmount.LOW_400,
                FeeAmount.LOW,
                FeeAmount.MEDIUM,
                FeeAmount.HIGH,
              ].map((_feeAmount, i) => {
                const { supportedChains } = FEE_AMOUNT_DETAIL[_feeAmount]
                if ((supportedChains as unknown as UniverseChainId[]).includes(chainId)) {
                  return (
                    <FeeOption
                      feeAmount={_feeAmount}
                      selected={_feeAmount === feeAmount}
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
          </RadioButtonGroup>
        )}
      </DynamicSection>
    </Flex>
  )
}
