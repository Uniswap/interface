import { t } from '@lingui/macro'
import {
  ActivityQuery,
  AssetChange,
  TransactionDetails,
  TransactionType,
  useActivityQuery,
} from 'graphql/data/__generated__/types-and-hooks'
import { AssetActivityDetails } from 'graphql/data/activity'
import { useFollowedAccounts } from 'pages/Profile'

// Mock data for friends' activity. Should be type Activity[]
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
}
const JudgmentalTransactionTitleTable: { [key in JudgmentalTransaction]: string } = {
  [JudgmentalTransaction.GOT_RUGGED]: t`Got rugged by`,
  [JudgmentalTransaction.APED_INTO]: t`Aped into`,
  [JudgmentalTransaction.DUMPED]: t`Dumped`,
  [JudgmentalTransaction.STILL_HODLING]: t`Is still hodling`,
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
function useAllFriendsActivites(): {
  allFriendsActivities?: ActivityQuery
  loading: boolean
  refetch: () => Promise<any>
} {
  const followingAccounts = useFollowedAccounts()
  const {
    data: allFriendsActivities,
    loading,
    refetch,
  } = useActivityQuery({
    variables: { accounts: followingAccounts },
    errorPolicy: 'all',
    fetchPolicy: 'cache-first',
  })
  return { allFriendsActivities, loading, refetch }
}

// Returns all activites by ownerAddress : tokenId : [buys & sells]
export function useAllFriendsBuySells() {
  const { allFriendsActivities, loading } = useAllFriendsActivites()
  const map: {
    [ownerAddress: string]: {
      [tokenAddress: string]: {
        buys: TransactionDetails[]
        sells: TransactionDetails[]
      }
    }
  } = {}
  if (loading) return map

  allFriendsActivities?.portfolios?.map((portfolio) => {
    const buySells: {
      [tokenAddress: string]: {
        buys: TransactionDetails[]
        sells: TransactionDetails[]
      }
    } = {}

    for (const tx of portfolio.assetActivities ?? []) {
      const details: AssetActivityDetails = tx.details
      if (details.__typename === 'TransactionDetails' && details.type === TransactionType.Swap) {
        const transfers = details.assetChanges.filter((c) => c.__typename === 'TokenTransfer')
        if (transfers.length == 2) {
          // lol make our lives easier, ignore refund exact swaps for now
          for (let i = 0; i < 2; i++) {
            const assetChange = transfers[i]
            const otherAssetChange = transfers[i === 1 ? 0 : 1] as AssetChange
            if (assetChange.__typename === 'TokenTransfer' && otherAssetChange.__typename === 'TokenTransfer') {
              if (
                assetIsEthStablecoin(assetChange.asset.symbol ?? '') &&
                !assetIsEthStablecoin(otherAssetChange.asset.symbol ?? '')
              ) {
                const otherAssetAddress = otherAssetChange.asset.address ?? 'Other'

                if (!buySells[otherAssetAddress]) {
                  buySells[otherAssetAddress] = { buys: [], sells: [] }
                }
                if (assetChange.direction === 'OUT') {
                  // if stablecoin goes out, it's a buy
                  buySells[otherAssetAddress].buys.push(details as TransactionDetails)
                } else {
                  buySells[otherAssetAddress].sells.push(details as TransactionDetails)
                }
                continue
              }
            }
          }
        }
      }
    }
    map[portfolio.ownerAddress] = buySells
  })
  return map
}
