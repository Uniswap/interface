import { t } from '@lingui/macro'
import { Currency } from '@uniswap/sdk-core'
import { parseRemoteActivities, parseRemoteActivity } from 'components/AccountDrawer/MiniPortfolio/Activity/parseRemote'
import { Activity, ActivityMap } from 'components/AccountDrawer/MiniPortfolio/Activity/types'
import {
  ActivityQuery,
  TokenTransferPartsFragment,
  TransactionType,
  useActivityQuery,
} from 'graphql/data/__generated__/types-and-hooks'
import { AssetActivityDetails } from 'graphql/data/activity'
import { gqlToCurrency } from 'graphql/data/util'
import { useMemo } from 'react'
import { isSameAddress } from 'utils/addresses'
import { useFormatter } from 'utils/formatNumbers'

// Mock data for friends' activity.
export const friendsActivity = [
  {
    ensName: 'friend1.eth',
    address: '0x24791Cac57BF48328D9FE103Ce402Cfe4c0D8b07',
    description: 'Minted Azuki #2214',
    timestamp: Date.now(), // 1 hour ago
    image:
      'https://cdn.center.app/1/0xED5AF388653567Af2F388E6224dC7C4b3241C544/2214/92acd1de09f0f5e1c12a4f1b47306a8f7393f4053a32b439f5fc7ba8b797961e.png',
  },
  {
    address: '0x24791Cac57BF48328D9FE103Ce402Cfe4c0D8b07',
    description: 'Swapped 0.1 ETH for 100 DAI',
    timestamp: Date.now() - 1000 * 60 * 5, // 5 min ago
  },
  {
    ensName: 'friend1.eth',
    address: '0x24791Cac57BF48328D9FE103Ce402Cfe4c0D8b07',
    description: 'Swapped 0.1 ETH for 100 DAI',
    timestamp: Date.now() - 1000 * 60 * 60 * 5, // 5 hours ago
  },
  // More activities...
]

enum JudgmentalTransaction {
  GOT_RUGGED,
  APED_INTO,
  DUMPED,
  STILL_HODLING,
  GAINS,
}

const JudgmentalTransactionTitleTable: { [key in JudgmentalTransaction]: string } = {
  [JudgmentalTransaction.GOT_RUGGED]: t`Got rugged by`,
  [JudgmentalTransaction.APED_INTO]: t`Aped into`,
  [JudgmentalTransaction.DUMPED]: t`Dumped`,
  [JudgmentalTransaction.STILL_HODLING]: t`Is still hodling`,
  [JudgmentalTransaction.GAINS]: t`Made gains on`,
}

function getProfit(buysAndSells: ReturnType<typeof useAllFriendsBuySells>['judgementalActivityMap'][string][string]) {
  const { buys, sells, currentBalanceUSD } = buysAndSells
  let profit = currentBalanceUSD

  for (const buy of buys) {
    profit -= buy.USDValue
  }

  for (const sell of sells) {
    profit += sell.USDValue
  }

  // console.log('cartcrom', buysAndSells, tokenName, profit)
  return profit
}

export type JudgementalActivity = {
  negative: boolean
  isJudgmental: boolean
  owner: string
  description: string
  currency: Currency
  timestamp: number
  profit: number
  activities: Activity[]
}

export function useFeed(accounts: string[], filterAddress?: string) {
  const { judgementalActivityMap: friendsBuysAndSells, normalActivityMap } = useAllFriendsBuySells(accounts)

  return useMemo(() => {
    const feed: (JudgementalActivity | Activity)[] = filterAddress
      ? []
      : (Object.values(normalActivityMap ?? {}) as Activity[]).slice(0, 40)

    for (const friend in friendsBuysAndSells) {
      const friendsTradedTokens = friendsBuysAndSells[friend]
      console.log('cartcrom', friendsTradedTokens)
      for (const tokenAddress in friendsTradedTokens) {
        if (filterAddress && !isSameAddress(tokenAddress, filterAddress)) continue
        const { currentBalanceUSD, currency, activities } = friendsTradedTokens[tokenAddress]
        const userSold = currentBalanceUSD === 0
        const profit = getProfit(friendsTradedTokens[tokenAddress])

        // if (friend === '0x0938a82F93D5DAB110Dc6277FC236b5b082DC10F') console.log('cartcrom', { profit, tokenAddress })

        const feedItemBase = { isJudgmental: true, owner: friend, timeStamp: Date.now(), currency, profit } // TODO(now) use time relevant to transaction
        if (profit < -100) {
          feed.push({
            ...feedItemBase,
            description: JudgmentalTransactionTitleTable[JudgmentalTransaction.GOT_RUGGED],
            timestamp: Math.max(...(activities.map((a) => a.timestamp) ?? Date.now() / 1000)),
            activities,
            negative: true,
          })
        } else if (profit > 200) {
          feed.push({
            ...feedItemBase,
            description: JudgmentalTransactionTitleTable[JudgmentalTransaction.GAINS],
            timestamp: Math.max(...(activities.map((a) => a.timestamp) ?? Date.now() / 1000)),
            activities,
            negative: false,
          })
        }
      }
    }
    return feed.sort((a, b) => b.timestamp - a.timestamp)
  }, [filterAddress, friendsBuysAndSells, normalActivityMap])

  // console.log('cartcrom', feed)
}

// function getJudgmentalTransactionTitle(tx: TransactionDetails): string {
//   const changes: Readonly<TokenTransfer[]> = tx.assetChanges
//   for (const c of changes) {
//     if (c.transactedValue && c.transactedValue.value > 500) {
//       // fixme is value in bips? or usd?
//       return JudgmentalTransactionTitleTable[JudgmentalTransaction.APED_INTO]
//     }
//   }
// }

function assetIsEthStablecoin(symbol: string) {
  return symbol === 'USDT' || symbol === 'USDC' || symbol === 'DAI' || symbol === 'ETH' || symbol === 'WETH'
}

/* Returns allFriendsActivities in shape of [friend1Portfolio, friend2Portfolio]. Each portfolio contains attribute ownerAddress */
function useAllFriendsActivites(accounts: string[]): {
  allFriendsActivities?: ActivityQuery
  loading: boolean
  refetch: () => Promise<any>
} {
  // const followingAccounts = useFollowedAccounts()
  const {
    data: allFriendsActivities,
    loading,
    refetch,
  } = useActivityQuery({
    variables: { accounts },
    errorPolicy: 'all',
    fetchPolicy: 'cache-first',
  })
  return { allFriendsActivities, loading, refetch }
}

type BuySellMap = {
  [ownerAddress: string]: {
    [tokenAddress: string]: {
      currency: Currency
      buys: SwapInfo[]
      sells: SwapInfo[]
      activities: Activity[]
      currentBalanceUSD: number
    }
  }
}

type SwapInfo = {
  type: 'buy' | 'sell'
  inputToken: Currency
  outputToken: Currency
  txHash: string
  quantity: number
  USDValue: number
}

// Returns all activites by ownerAddress : tokenId : [buys & sells]
function useAllFriendsBuySells(accounts: string[]): {
  judgementalActivityMap: BuySellMap
  normalActivityMap?: ActivityMap
} {
  const { allFriendsActivities, loading } = useAllFriendsActivites(accounts)
  const { formatNumberOrString } = useFormatter()

  return useMemo(() => {
    const normalActivityMap = parseRemoteActivities(formatNumberOrString, allFriendsActivities)
    const map: BuySellMap = {}
    if (loading) return { judgementalActivityMap: {}, normalActivityMap: {} }

    const friendBalanceMap = allFriendsActivities?.portfolios?.reduce((acc, curr) => {
      if (!curr) return acc
      if (!acc[curr.ownerAddress]) acc[curr.ownerAddress] = {}

      curr.tokenBalances?.forEach((balance) => {
        acc[curr.ownerAddress][balance.token?.address ?? 'NATIVE'] = balance.denominatedValue?.value ?? 0
      }, {})

      return acc
    }, {} as { [ownerAddress: string]: { [tokenAddress: string]: number } })

    allFriendsActivities?.portfolios?.map((portfolio) => {
      const buySells: BuySellMap[string] = {}

      for (const tx of portfolio.assetActivities ?? []) {
        const details: AssetActivityDetails = tx.details
        if (details.__typename === 'TransactionDetails' && details.type === TransactionType.Swap) {
          const transfers = details.assetChanges.filter(
            (c) => c.__typename === 'TokenTransfer'
          ) as TokenTransferPartsFragment[]

          const sent = transfers.find((t) => t.direction === 'OUT')
          // Any leftover native token is refunded on exact_out swaps where the input token is native
          const refund = transfers.find(
            (t) => t.direction === 'IN' && t.asset.id === sent?.asset.id && t.asset.standard === 'NATIVE'
          )
          const received = transfers.find((t) => t.direction === 'IN' && t !== refund)

          const sentCurrency = sent?.asset ? gqlToCurrency(sent?.asset) : undefined
          const receivedCurrency = received?.asset ? gqlToCurrency(received?.asset) : undefined
          if (!sentCurrency || !receivedCurrency || !received || !sent) continue

          // if sent is ethstablecoin, received is not ==> IS BUY
          if (assetIsEthStablecoin(sent?.asset.symbol ?? '') && !assetIsEthStablecoin(received?.asset.symbol ?? '')) {
            const swapInfo = {
              type: 'buy',
              inputToken: sentCurrency,
              outputToken: receivedCurrency,
              txHash: details.hash,
              quantity: Number(received.quantity),
              USDValue: sent.transactedValue?.value ?? 0,
              activity: parseRemoteActivity(tx, portfolio.ownerAddress, formatNumberOrString),
            } as const
            const receivedAssetAddress = received.asset.address ?? 'Other'
            if (!buySells[receivedAssetAddress]) {
              buySells[receivedAssetAddress] = {
                currency: receivedCurrency,
                buys: [],
                sells: [],
                activities: [],
                currentBalanceUSD: friendBalanceMap?.[portfolio.ownerAddress][receivedAssetAddress] ?? 0,
              }
            }
            buySells[receivedAssetAddress].buys.push(swapInfo)
            const activity = parseRemoteActivity(tx, portfolio.ownerAddress, formatNumberOrString)
            if (activity) buySells[receivedAssetAddress].activities.push(activity)
          } else if (
            sent &&
            received &&
            assetIsEthStablecoin(received?.asset.symbol ?? '') &&
            !assetIsEthStablecoin(sent?.asset.symbol ?? '')
          ) {
            const swapInfo = {
              type: 'sell',
              inputToken: sentCurrency,
              outputToken: receivedCurrency,
              txHash: details.hash,
              quantity: Number(sent.quantity),
              USDValue: received.transactedValue?.value ?? 0,
            } as const
            const sentAssetAddress = sent.asset.address ?? 'Other'
            if (!buySells[sentAssetAddress]) {
              buySells[sentAssetAddress] = {
                currency: sentCurrency,
                buys: [],
                sells: [],
                activities: [],
                currentBalanceUSD: friendBalanceMap?.[portfolio.ownerAddress][sentAssetAddress] ?? 0,
              }
            }
            buySells[sentAssetAddress].sells.push(swapInfo)
            const activity = parseRemoteActivity(tx, portfolio.ownerAddress, formatNumberOrString)
            if (activity) buySells[sentAssetAddress].activities.push(activity)
          }
          // if sent is not & received is ethstablecoin => iS SELL

          // if (transfers.length == 2) {
          //   // lol make our lives easier, ignore refund exact swaps for now
          //   for (let i = 0; i < 2; i++) {
          //     const assetChange = transfers[i]
          //     const otherAssetChange = transfers[i === 1 ? 0 : 1] as AssetChange
          //     if (assetChange.__typename === 'TokenTransfer' && otherAssetChange.__typename === 'TokenTransfer') {
          //       if (
          //         assetIsEthStablecoin(assetChange.asset.symbol ?? '') &&
          //         !assetIsEthStablecoin(otherAssetChange.asset.symbol ?? '')
          //       ) {
          //         const otherAssetAddress = otherAssetChange.asset.address ?? 'Other'

          //         if (!buySells[otherAssetAddress]) {
          //           buySells[otherAssetAddress] = {
          //             buys: [],
          //             sells: [],
          //             currentBalanceUSD: friendBalanceMap?.[portfolio.ownerAddress][otherAssetAddress] ?? 0,
          //           }
          //         }
          //         if (assetChange.direction === 'OUT') {
          //           // if stablecoin goes out, it's a buy
          //           const swapInfo = {
          //             type: 'buy',
          //             inputToken: assetChange.asset.symbol ?? '',
          //             outputToken: otherAssetChange.asset.symbol ?? '',
          //             txHash: details.hash,
          //             quantity: Number(otherAssetChange.quantity),
          //             USDValue: assetChange.transactedValue?.value ?? 0,
          //           } as const
          //           buySells[otherAssetAddress].buys.push(swapInfo)
          //         } else {
          //           const swapInfo = {
          //             type: 'sell',
          //             inputToken: otherAssetChange.asset.symbol ?? '',
          //             outputToken: assetChange.asset.symbol ?? '',
          //             txHash: details.hash,
          //             quantity: Number(otherAssetChange.quantity),
          //             USDValue: assetChange.transactedValue?.value ?? 0,
          //           } as const
          //           buySells[otherAssetAddress].sells.push(swapInfo)
          //         }
          //         continue
          //       }
          //     }
          //   }
          // }
        }
      }
      map[portfolio.ownerAddress] = buySells
    })
    return { judgementalActivityMap: map, normalActivityMap }
  }, [allFriendsActivities, formatNumberOrString, loading])
}
