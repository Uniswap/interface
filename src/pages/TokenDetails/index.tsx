import TokenDetails from 'components/Tokens/TokenDetails'
import { TokenDetailsPageSkeleton } from 'components/Tokens/TokenDetails/Skeleton'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { useFetchedTokenData } from 'graphql/tokens/TokenData'
import { TimePeriod, toHistoryDuration, validateUrlChainParam } from 'graphql/utils/util'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { useMemo } from 'react'
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
  const [detailedTokenAddress] = useMemo(
    // tokenAddress will always be defined in the path for for this page to render, but useParams will always
    // return optional arguments; nullish coalescing operator is present here to appease typechecker
    () => [isNative ? getNativeTokenDBAddress(chain) : tokenAddress ?? '', toHistoryDuration(timePeriod)],
    [chain, isNative, timePeriod, tokenAddress]
  )

  const { data: tokenData } = useFetchedTokenData([detailedTokenAddress ?? ''])

  if (!tokenData) return <TokenDetailsPageSkeleton />

  return (
    <TokenDetails urlAddress={tokenAddress} chain={chain} tokenData={tokenData[0]} onChangeTimePeriod={setTimePeriod} />
  )
}
