import { Trans } from '@lingui/macro'
import { Currency } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { useWeb3React } from '@web3-react/core'
import { sendEvent } from 'components/analytics'
import { AutoColumn } from 'components/Column'
import { RowBetween } from 'components/Row'
import { useFeeTierDistribution } from 'hooks/useFeeTierDistribution'
import { PoolState, usePools } from 'hooks/usePools'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import { FeeOption } from './FeeOption'
import { FEE_AMOUNT_DETAIL } from './shared'

const Select = styled.div`
  align-items: flex-start;
  display: grid;
  grid-auto-flow: column;
  grid-gap: 8px;
  width: 100%;
  display: flex;
`

export default function FeeSelector({
  feeAmount,
  handleFeePoolSelect,
  currencyA,
  currencyB,
}: {
  feeAmount?: FeeAmount
  handleFeePoolSelect: (feeAmount: FeeAmount) => void
  currencyA?: Currency
  currencyB?: Currency
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

      // handleFeePoolSelect(largestUsageFeeTier)
    }
  }, [feeAmount, isLoading, isError, largestUsageFeeTier, handleFeePoolSelect])

  useEffect(() => {
    setShowOptions(isError)
  }, [isError])

  return (
    <AutoColumn gap="md">
      <RowBetween paddingBottom="20px">
        <ThemedText.DeprecatedLabel>
          <Trans>Select Fee Tier</Trans>
        </ThemedText.DeprecatedLabel>
      </RowBetween>
      <RowBetween>
        {chainId && (
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
      </RowBetween>
    </AutoColumn>
  )
}
