import { filterTimeAtom } from 'components/Tokens/state'
import TokenDetails from 'components/Tokens/TokenDetails'
import { TokenDetailsPageSkeleton } from 'components/Tokens/TokenDetails/Skeleton'
import { NATIVE_CHAIN_ID, nativeOnChain } from 'constants/tokens'
import { TokenQuery, tokenQuery } from 'graphql/data/Token'
import { TokenPriceQuery, tokenPriceQuery } from 'graphql/data/TokenPrice'
import { CHAIN_NAME_TO_CHAIN_ID, TimePeriod, toHistoryDuration, validateUrlChainParam } from 'graphql/data/util'
import { useAtomValue } from 'jotai/utils'
import { Suspense, useCallback, useEffect, useMemo } from 'react'
import { useQueryLoader } from 'react-relay'
import { useParams } from 'react-router-dom'

export default function TokenDetailsPage() {
  const { tokenAddress, chainName } = useParams<{ tokenAddress?: string; chainName?: string }>()
  const chain = validateUrlChainParam(chainName)
  const pageChainId = CHAIN_NAME_TO_CHAIN_ID[chain]
  const isNative = tokenAddress === NATIVE_CHAIN_ID
  const timePeriod = useAtomValue(filterTimeAtom)
  const [contract, duration] = useMemo(
    () => [
      { address: isNative ? nativeOnChain(pageChainId).wrapped.address : tokenAddress ?? '', chain },
      toHistoryDuration(timePeriod),
    ],
    [chain, isNative, pageChainId, timePeriod, tokenAddress]
  )

  const [tokenQueryReference, loadTokenQuery] = useQueryLoader<TokenQuery>(tokenQuery)
  const [priceQueryReference, loadPriceQuery] = useQueryLoader<TokenPriceQuery>(tokenPriceQuery)

  useEffect(() => {
    loadTokenQuery({ contract })
    loadPriceQuery({ contract, duration })
  }, [contract, duration, loadPriceQuery, loadTokenQuery, timePeriod])

  const refetchTokenPrices = useCallback(
    (t: TimePeriod) => {
      loadPriceQuery({ contract, duration: toHistoryDuration(t) })
    },
    [contract, loadPriceQuery]
  )

  if (!tokenQueryReference) {
    return <TokenDetailsPageSkeleton />
  }

  return (
    <Suspense fallback={<TokenDetailsPageSkeleton />}>
      <TokenDetails
        urlAddress={tokenAddress}
        chain={chain}
        tokenQueryReference={tokenQueryReference}
        priceQueryReference={priceQueryReference}
        refetchTokenPrices={refetchTokenPrices}
      />
    </Suspense>
  )
}
