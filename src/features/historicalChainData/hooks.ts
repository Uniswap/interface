import { Token } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import {
  useDailyTokenPricesQuery,
  useHourlyTokenPricesQuery,
} from 'src/features/historicalChainData/generated/uniswap-hooks'
import {
  getTokenQueryKey,
  parseTokenData,
  useV3SubgraphClient,
} from 'src/features/historicalChainData/utils'

type WithPeriodStartUnix<T> = T & { periodStartUnix: number }

interface TokenPricesProps {
  token?: Token
}

export function useHourlyTokenPrices({
  token,
  // TODO(judo): should also allow periodEnd to get exactly 1 data point. ditto below
  // periodEndUnix
  periodStartUnix,
}: WithPeriodStartUnix<TokenPricesProps>) {
  const client = useV3SubgraphClient(token?.chainId)

  // non-null assertions enforced by `enabled`
  const { data, ...queryStatus } = useHourlyTokenPricesQuery(
    client!,
    getTokenQueryKey(token!, {
      periodStartUnix,
    }),
    { enabled: Boolean(client) && Boolean(token) }
  )

  const prices = useMemo(() => parseTokenData(data?.tokenHourDatas), [data?.tokenHourDatas])

  return {
    prices,
    ...queryStatus,
  }
}

export function useDailyTokenPrices({ token }: TokenPricesProps) {
  const client = useV3SubgraphClient(token?.chainId)

  // non-null assertions enforced by `enabled`
  const { data, ...queryStatus } = useDailyTokenPricesQuery(client!, getTokenQueryKey(token!), {
    enabled: Boolean(client) && Boolean(token),
  })

  const prices = useMemo(() => parseTokenData(data?.tokenDayDatas), [data?.tokenDayDatas])

  return {
    prices,
    ...queryStatus,
  }
}
