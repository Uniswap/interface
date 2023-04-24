import TokenDetails from 'components/Tokens/TokenDetails'
import { TokenDetailsPageSkeleton } from 'components/Tokens/TokenDetails/Skeleton'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { useTokenPriceQuery, useTokenQuery } from 'graphql/data/__generated__/types-and-hooks'
import { TimePeriod, toHistoryDuration, validateUrlChainParam } from 'graphql/data/util'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getNativeTokenDBAddress } from 'utils/nativeTokens'

export const pageTimePeriodAtom = atomWithStorage<TimePeriod>('tokenDetailsTimePeriod', TimePeriod.DAY)

export default function TokenDetailsPage() {
  const { tokenAddress, chainName } = useParams<{
    tokenAddress: string
    chainName?: string
  }>()
  const chain = validateUrlChainParam(chainName)
  const isNative = tokenAddress === NATIVE_CHAIN_ID
  const [timePeriod, setTimePeriod] = useAtom(pageTimePeriodAtom)
  const [detailedTokenAddress, duration] = useMemo(
    /* tokenAddress will always be defined in the path for for this page to render, but useParams will always
      return optional arguments; nullish coalescing operator is present here to appease typechecker */
    () => [isNative ? getNativeTokenDBAddress(chain) : tokenAddress ?? '', toHistoryDuration(timePeriod)],
    [chain, isNative, timePeriod, tokenAddress]
  )

  const parsedQs = useParsedQueryString()

  const parsedInputTokenAddress: string | undefined = useMemo(() => {
    return typeof parsedQs.inputCurrency === 'string' ? (parsedQs.inputCurrency as string) : undefined
  }, [parsedQs])

  const { data: tokenQuery } = useTokenQuery({
    variables: {
      address: detailedTokenAddress,
      chain,
    },
    errorPolicy: 'all',
  })

  const { data: tokenPriceQuery } = useTokenPriceQuery({
    variables: {
      address: detailedTokenAddress,
      chain,
      duration,
    },
    errorPolicy: 'all',
  })

  // Saves already-loaded chart data into state to display while tokenPriceQuery is undefined timePeriod input changes
  const [currentPriceQuery, setCurrentPriceQuery] = useState(tokenPriceQuery)
  useEffect(() => {
    if (tokenPriceQuery) setCurrentPriceQuery(tokenPriceQuery)
  }, [setCurrentPriceQuery, tokenPriceQuery])

  if (!tokenQuery) return <TokenDetailsPageSkeleton />

  return (
    <TokenDetails
      urlAddress={tokenAddress}
      chain={chain}
      tokenQuery={tokenQuery}
      tokenPriceQuery={currentPriceQuery}
      onChangeTimePeriod={setTimePeriod}
      inputTokenAddress={parsedInputTokenAddress}
    />
  )
}
