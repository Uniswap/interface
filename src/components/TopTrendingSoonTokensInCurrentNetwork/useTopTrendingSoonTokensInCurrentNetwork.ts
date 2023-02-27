import { useMemo } from 'react'

import { TRENDING_SOON_MAX_ITEMS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { TrueSightTimeframe } from 'pages/TrueSight'
import useGetTrendingSoonData, { TrueSightTokenData } from 'pages/TrueSight/hooks/useGetTrendingSoonData'

const TOP_TRENDING_TOKENS_MAX_ITEMS = 5

export default function useTopTrendingSoonTokensInCurrentNetwork() {
  const { chainId } = useActiveWeb3React()

  const trendingSoon1dFilter = useMemo(
    () => ({
      selectedNetwork: chainId,
      timeframe: TrueSightTimeframe.ONE_DAY,
      selectedTag: undefined,
      selectedTokenData: undefined,
      isShowTrueSightOnly: false,
    }),
    [chainId],
  )

  // const trendingSoon1wFilter = useMemo(
  //   () => ({
  //     selectedNetwork: chainId,
  //     timeframe: TrueSightTimeframe.ONE_WEEK,
  //     selectedTag: undefined,
  //     selectedTokenData: undefined,
  //     isShowTrueSightOnly: false,
  //   }),
  //   [chainId],
  // )

  const { data: trendingSoon1dData, isLoading: isTrendingSoon1dDataLoading } = useGetTrendingSoonData(
    trendingSoon1dFilter,
    TRENDING_SOON_MAX_ITEMS,
  )

  // const { data: trendingSoon1wData, isLoading: isTrendingSoon1wDataLoading } = useGetTrendingSoonData(
  //   trendingSoon1wFilter,
  //   MAX_TOKENS,
  // )

  // Get the entire token of data 1d, if still not enough, get more of data 1w. Must ensure unique token.
  const trendingSoonTokens = useMemo(() => {
    //   if (isTrendingSoon1dDataLoading || isTrendingSoon1wDataLoading) return []
    if (isTrendingSoon1dDataLoading) return []

    let res: TrueSightTokenData[] = trendingSoon1dData?.tokens ?? []

    res = res.slice(0, TOP_TRENDING_TOKENS_MAX_ITEMS)

    // if (trendingSoon1wData?.tokens?.length && res.length < MAX_TOKENS) {
    //   for (let i = 0; i < trendingSoon1wData.tokens.length; i++) {
    //     if (res.length === TOP_TRENDING_TOKENS_MAX_ITEMS) break
    //
    //     const token = trendingSoon1wData.tokens[i]
    //     const existedTokenIds = res.map(tokenData => tokenData.token_id)
    //
    //     if (!existedTokenIds.includes(token.token_id)) {
    //       res.push(token)
    //     }
    //   }
    // }

    return res
  }, [isTrendingSoon1dDataLoading, trendingSoon1dData])

  return useMemo(
    () => ({
      data: trendingSoonTokens,
      isLoading: isTrendingSoon1dDataLoading,
    }),
    [isTrendingSoon1dDataLoading, trendingSoonTokens],
  )
}
