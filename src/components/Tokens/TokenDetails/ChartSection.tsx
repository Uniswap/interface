import { ParentSize } from '@visx/responsive'
import { ChartContainer, LoadingChart } from 'components/Tokens/TokenDetails/Skeleton'
import { TokenPrice$key } from 'graphql/data/__generated__/TokenPrice.graphql'
import { isPricePoint, PricePoint, tokenPriceFragment } from 'graphql/data/TokenPrice'
import { TimePeriod, toHistoryDuration } from 'graphql/data/util'
import { useAtomValue } from 'jotai/utils'
import { startTransition, Suspense, useCallback, useMemo, useState } from 'react'
import { useRefetchableFragment } from 'react-relay'
import styled from 'styled-components/macro'

import { MEDIUM_MEDIA_BREAKPOINT } from '../constants'
import { filterTimeAtom } from '../state'
import { DISPLAYS, ORDERED_TIMES } from '../TokenTable/TimeSelector'
import PriceChart from './PriceChart'

type RefetchFunction = (t: TimePeriod) => void
function useRefetchableTokenPrices(tokenPriceKey: TokenPrice$key): [PricePoint[] | undefined, RefetchFunction] {
  const [queryData, refetch] = useRefetchableFragment(tokenPriceFragment, tokenPriceKey)

  // Appends the current price to the end of the priceHistory array
  const priceHistory = useMemo(() => {
    const market = queryData.tokens?.[0]?.market
    const priceHistory = market?.priceHistory?.filter(isPricePoint)
    const currentPrice = market?.price?.value
    if (Array.isArray(priceHistory) && currentPrice !== undefined) {
      const timestamp = Date.now() / 1000
      return [...priceHistory, { timestamp, value: currentPrice }]
    }
    return priceHistory
  }, [queryData])

  const refetchTokenPrices = useCallback((timePeriod: TimePeriod) => {
    refetch({ duration: toHistoryDuration(timePeriod) })
  }, [])

  return [priceHistory, refetchTokenPrices]
}

export default function ChartSection({ tokenPriceKey }: { tokenPriceKey: TokenPrice$key | null | undefined }) {
  if (!tokenPriceKey) {
    return <LoadingChart />
  }

  return (
    <Suspense fallback={<LoadingChart />}>
      <ChartContainer>
        <Chart tokenPriceKey={tokenPriceKey} />
      </ChartContainer>
    </Suspense>
  )
}

function Chart({ tokenPriceKey }: { tokenPriceKey: TokenPrice$key }) {
  const [prices, refetchTokenPrices] = useRefetchableTokenPrices(tokenPriceKey)

  return (
    <ChartContainer>
      <ParentSize>{({ width }) => <PriceChart prices={prices ?? null} width={width} height={436} />}</ParentSize>
      <TimePeriodSelector refetchTokenPrices={refetchTokenPrices} />
    </ChartContainer>
  )
}

export const TimeOptionsWrapper = styled.div`
  display: flex;
  width: 100%;
  justify-content: flex-end;
`
export const TimeOptionsContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
  gap: 4px;
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 16px;
  height: 40px;
  padding: 4px;
  width: fit-content;

  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    width: 100%;
    justify-content: space-between;
    border: none;
  }
`
const TimeButton = styled.button<{ active: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme, active }) => (active ? theme.backgroundInteractive : 'transparent')};
  font-weight: 600;
  font-size: 16px;
  padding: 6px 12px;
  border-radius: 12px;
  line-height: 20px;
  border: none;
  cursor: pointer;
  color: ${({ theme, active }) => (active ? theme.textPrimary : theme.textSecondary)};
  transition-duration: ${({ theme }) => theme.transition.duration.fast};
  :hover {
    ${({ active, theme }) => !active && `opacity: ${theme.opacity.hover};`}
  }
`
function TimePeriodSelector({ refetchTokenPrices }: { refetchTokenPrices: RefetchFunction }) {
  const [timePeriod, setTimePeriod] = useState(useAtomValue(filterTimeAtom))
  return (
    <TimeOptionsWrapper>
      <TimeOptionsContainer>
        {ORDERED_TIMES.map((time) => (
          <TimeButton
            key={DISPLAYS[time]}
            active={timePeriod === time}
            onClick={() => {
              startTransition(() => {
                refetchTokenPrices(time)
                setTimePeriod(time)
              })
            }}
          >
            {DISPLAYS[time]}
          </TimeButton>
        ))}
      </TimeOptionsContainer>
    </TimeOptionsWrapper>
  )
}
