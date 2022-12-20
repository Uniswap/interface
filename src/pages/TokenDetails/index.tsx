import TokenDetails from 'components/Tokens/TokenDetails'
import { TokenDetailsPageSkeleton } from 'components/Tokens/TokenDetails/Skeleton'
import { NATIVE_CHAIN_ID, nativeOnChain } from 'constants/tokens'
import { useTokenPriceQuery, useTokenQuery } from 'graphql/data/__generated__/types-and-hooks'
import { CHAIN_NAME_TO_CHAIN_ID, TimePeriod, toHistoryDuration, validateUrlChainParam } from 'graphql/data/util'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { useMemo } from 'react'
import { useParams } from 'react-router-dom'

export const pageTimePeriodAtom = atomWithStorage<TimePeriod>('tokenDetailsTimePeriod', TimePeriod.DAY)

export default function TokenDetailsPage() {
  const { tokenAddress, chainName } = useParams<{ tokenAddress?: string; chainName?: string }>()
  const chain = validateUrlChainParam(chainName)
  const pageChainId = CHAIN_NAME_TO_CHAIN_ID[chain]
  const isNative = tokenAddress === NATIVE_CHAIN_ID
  const [timePeriod, setTimePeriod] = useAtom(pageTimePeriodAtom)
  const [contract, duration] = useMemo(
    () => [
      { address: isNative ? nativeOnChain(pageChainId).wrapped.address : tokenAddress ?? '', chain },
      toHistoryDuration(timePeriod),
    ],
    [chain, isNative, pageChainId, timePeriod, tokenAddress]
  )

  const { data: tokenQuery, loading: tokenQueryLoading } = useTokenQuery({
    variables: {
      contract,
    },
  })

  const { data: tokenPriceQuery } = useTokenPriceQuery({
    variables: {
      contract,
      duration,
    },
  })

  if (!tokenQuery || tokenQueryLoading) return <TokenDetailsPageSkeleton />

  return (
    <TokenDetails
      urlAddress={tokenAddress}
      chain={chain}
      tokenQuery={tokenQuery}
      tokenPriceQuery={tokenPriceQuery}
      onChangeTimePeriod={setTimePeriod}
    />
  )
}
