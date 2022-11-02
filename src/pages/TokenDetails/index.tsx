import { filterTimeAtom } from 'components/Tokens/state'
import TokenDetails from 'components/Tokens/TokenDetails'
import { TokenDetailsPageSkeleton } from 'components/Tokens/TokenDetails/Skeleton'
import { NATIVE_CHAIN_ID, nativeOnChain } from 'constants/tokens'
import { TokenPriceQuery } from 'graphql/data/__generated__/TokenPriceQuery.graphql'
import { TokenQuery } from 'graphql/data/__generated__/TokenQuery.graphql'
import { tokenQuery } from 'graphql/data/Token'
import { tokenPriceQuery } from 'graphql/data/TokenPrice'
import { CHAIN_NAME_TO_CHAIN_ID, TimePeriod, toHistoryDuration, validateUrlChainParam } from 'graphql/data/util'
import { useAtomValue } from 'jotai/utils'
import { Suspense, useCallback, useEffect, useMemo } from 'react'
import { useQueryLoader } from 'react-relay'
import { useParams } from 'react-router-dom'

export default function TokenDetailsPage() {
  const [tokenQueryReference, loadTokenQuery] = useQueryLoader<TokenQuery>(tokenQuery)
  const [priceQueryReference, loadPriceQuery] = useQueryLoader<TokenPriceQuery>(tokenPriceQuery)

  const { tokenAddress, chainName } = useParams<{ tokenAddress?: string; chainName?: string }>()
  const chain = validateUrlChainParam(chainName)
  const pageChainId = CHAIN_NAME_TO_CHAIN_ID[chain]
  const nativeCurrency = nativeOnChain(pageChainId)
  const isNative = tokenAddress === NATIVE_CHAIN_ID
  const timePeriod = useAtomValue(filterTimeAtom)
  const contract = useMemo(
    () => ({ address: isNative ? nativeCurrency.wrapped.address : tokenAddress ?? '', chain }),
    [chain, isNative, nativeCurrency.wrapped.address, tokenAddress]
  )

  useEffect(() => {
    loadTokenQuery({ contract })
    loadPriceQuery({ contract, duration: toHistoryDuration(timePeriod) })
  }, [contract, loadPriceQuery, loadTokenQuery, timePeriod])

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
        tokenQueryReference={tokenQueryReference}
        priceQueryReference={priceQueryReference}
        refetchTokenPrices={refetchTokenPrices}
      />
    </Suspense>
  )
}
