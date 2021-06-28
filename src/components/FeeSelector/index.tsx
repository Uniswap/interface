import React, { useEffect, useMemo, useState } from 'react'
import { FeeAmount } from '@uniswap/v3-sdk'
import { Token } from '@uniswap/sdk-core'
import { Trans } from '@lingui/macro'
import { AutoColumn } from 'components/Column'
import { DynamicSection } from 'pages/AddLiquidity/styled'
import { TYPE } from 'theme'
import { RowBetween } from 'components/Row'
import { ButtonGray, ButtonRadioChecked } from 'components/Button'
import styled from 'styled-components/macro'
import { skipToken } from '@reduxjs/toolkit/query/react'
import Badge from 'components/Badge'
import { useGetFeeTierDistributionQuery } from 'state/data/slice'
import { DarkGreyCard } from 'components/Card'
import Loader from 'components/Loader'
import { useBlockNumber } from 'state/application/hooks'

// maximum number of blocks past which we consider the data stale
const MAX_DATA_BLOCK_AGE = 10

const ResponsiveText = styled(TYPE.label)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 12px;
  `};
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

function useFeeDistribution(token0: Token | undefined, token1: Token | undefined) {
  const latestBlock = useBlockNumber()
  const { isLoading, isUninitialized, isError, data } = useGetFeeTierDistributionQuery(
    token0 && token1 ? { token0: token0.address.toLowerCase(), token1: token1.address.toLowerCase() } : skipToken
  )

  // auto-select fee tier when available
  return useMemo(() => {
    const { distributions, block: dataBlock } = data ?? { distributions: undefined, block: undefined }

    if (isLoading || isUninitialized || isError || !distributions || !latestBlock || !dataBlock) {
      return {
        isLoading,
        isUninitialized,
        isError,
      }
    }

    if (latestBlock - dataBlock > MAX_DATA_BLOCK_AGE) {
      return {
        isLoading,
        isUninitialized,
        isError,
      }
    }

    const largestUsageFeeTier = Object.keys(distributions)
      .map((d) => Number(d))
      .filter((d: FeeAmount) => distributions[d] !== 0 && distributions[d] !== undefined)
      .reduce((a: FeeAmount, b: FeeAmount) => ((distributions[a] ?? 0) > (distributions[b] ?? 0) ? a : b), -1)

    return {
      isLoading,
      isUninitialized,
      isError,
      distributions,
      largestUsageFeeTier,
    }
  }, [isLoading, isUninitialized, isError, data, latestBlock])
}

const FeeTierPercentageBadge = ({ percentage }: { percentage: string | undefined }) => {
  return (
    <Badge>
      <TYPE.label fontSize={12}>
        {Boolean(percentage) ? <Trans>{percentage}% select</Trans> : <Trans>Not created</Trans>}
      </TYPE.label>
    </Badge>
  )
}

export default function FeeSelector({
  disabled = false,
  feeAmount,
  handleFeePoolSelect,
  token0,
  token1,
}: {
  disabled?: boolean
  feeAmount?: FeeAmount
  handleFeePoolSelect: (feeAmount: FeeAmount) => void
  token0?: Token | undefined
  token1?: Token | undefined
}) {
  const [showOptions, setShowOptions] = useState(false)

  const { isLoading, isUninitialized, isError, distributions, largestUsageFeeTier } = useFeeDistribution(token0, token1)

  useEffect(() => {
    if (largestUsageFeeTier === undefined) {
      return
    }

    if (largestUsageFeeTier === -1) {
      // cannot recommend, open options
      setShowOptions(true)
    }

    handleFeePoolSelect(largestUsageFeeTier)
  }, [largestUsageFeeTier, handleFeePoolSelect])

  useEffect(() => {
    setShowOptions(false)
  }, [token0, token1])

  useEffect(() => {
    setShowOptions(isError)
  }, [isError])

  // in case of loading or error, we can ignore the query
  const feeTierPercentages =
    !isLoading && !isUninitialized && !isError && distributions
      ? {
          [FeeAmount.LOW]: distributions[FeeAmount.LOW]
            ? ((distributions[FeeAmount.LOW] ?? 0) * 100).toFixed(0)
            : undefined,
          [FeeAmount.MEDIUM]: distributions[FeeAmount.MEDIUM]
            ? ((distributions[FeeAmount.MEDIUM] ?? 0) * 100).toFixed(0)
            : undefined,
          [FeeAmount.HIGH]: distributions[FeeAmount.HIGH]
            ? ((distributions[FeeAmount.HIGH] ?? 0) * 100).toFixed(0)
            : undefined,
        }
      : undefined

  return (
    <AutoColumn gap="16px">
      <DynamicSection gap="md" disabled={disabled}>
        <DarkGreyCard>
          <RowBetween>
            <AutoColumn>
              {!feeAmount || isLoading || isUninitialized ? (
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
                  <TYPE.label>
                    <Trans>{FeeAmountLabel[feeAmount].label} % fee</Trans>
                  </TYPE.label>

                  <TYPE.main fontWeight={400} fontSize="12px" textAlign="left">
                    <Trans>{FeeAmountLabel[feeAmount].description}</Trans>
                  </TYPE.main>
                </>
              )}
            </AutoColumn>

            {isLoading ? (
              <Loader size="20px" />
            ) : (
              <ButtonGray onClick={() => setShowOptions(!showOptions)} width="auto" padding="4px" borderRadius="6px">
                {showOptions ? <Trans>Hide</Trans> : <Trans>Edit</Trans>}
              </ButtonGray>
            )}
          </RowBetween>
        </DarkGreyCard>

        {showOptions && (
          <RowBetween>
            <ButtonRadioChecked
              width="32%"
              active={feeAmount === FeeAmount.LOW}
              onClick={() => handleFeePoolSelect(FeeAmount.LOW)}
            >
              <AutoColumn gap="sm" justify="flex-start">
                <ResponsiveText>
                  <Trans>0.05% fee</Trans>
                </ResponsiveText>
                <TYPE.main fontWeight={400} fontSize="12px" textAlign="left">
                  <Trans>Best for stable pairs.</Trans>
                </TYPE.main>

                {feeTierPercentages && <FeeTierPercentageBadge percentage={feeTierPercentages[FeeAmount.LOW]} />}
              </AutoColumn>
            </ButtonRadioChecked>
            <ButtonRadioChecked
              width="32%"
              active={feeAmount === FeeAmount.MEDIUM}
              onClick={() => handleFeePoolSelect(FeeAmount.MEDIUM)}
            >
              <AutoColumn gap="sm" justify="flex-start">
                <ResponsiveText>
                  <Trans>0.3% fee</Trans>
                </ResponsiveText>
                <TYPE.main fontWeight={400} fontSize="12px" textAlign="left">
                  <Trans>Best for most pairs.</Trans>
                </TYPE.main>

                {feeTierPercentages && <FeeTierPercentageBadge percentage={feeTierPercentages[FeeAmount.MEDIUM]} />}
              </AutoColumn>
            </ButtonRadioChecked>
            <ButtonRadioChecked
              width="32%"
              active={feeAmount === FeeAmount.HIGH}
              onClick={() => handleFeePoolSelect(FeeAmount.HIGH)}
            >
              <AutoColumn gap="sm" justify="flex-start">
                <ResponsiveText>
                  <Trans>1% fee</Trans>
                </ResponsiveText>
                <TYPE.main fontWeight={400} fontSize="12px" textAlign="left">
                  <Trans>Best for exotic pairs.</Trans>
                </TYPE.main>

                {feeTierPercentages && <FeeTierPercentageBadge percentage={feeTierPercentages[FeeAmount.HIGH]} />}
              </AutoColumn>
            </ButtonRadioChecked>
          </RowBetween>
        )}
      </DynamicSection>
    </AutoColumn>
  )
}
