import { t } from '@lingui/macro'
import { ActivityQuery, TransactionType, useActivityQuery } from 'graphql/data/__generated__/types-and-hooks'
import { AssetActivity, AssetActivityDetails } from 'graphql/data/activity'
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
  console.log('allfriends', allFriendsActivities)
  return { allFriendsActivities, loading, refetch }
}

// Returns all activites by ownerAddress : tokenId : [buys & sells]
export function useAllFriendsBuySells() {
  const { allFriendsActivities, loading } = useAllFriendsActivites()
  const map: {
    [ownerAddress: string]: {
      [tokenId: string]: {
        buys: AssetActivity[]
        sells: AssetActivity[]
      }
    }
  } = {}
  if (loading) return map

  allFriendsActivities?.portfolios?.map((portfolio) => {
    const buySells: {
      [tokenId: string]: {
        buys: AssetActivity[]
        sells: AssetActivity[]
      }
    } = {}

    portfolio.assetActivities &&
      portfolio.assetActivities.forEach((tx: AssetActivity) => {
        const details: AssetActivityDetails = tx.details
        if (details.__typename === 'TransactionDetails' && details.type === TransactionType.Swap) {
          details.assetChanges.forEach((assetChange) => {
            if (assetChange.__typename === 'TokenTransfer') {
              if (
                assetChange.asset.symbol === 'ETH' ||
                assetChange.asset.symbol === 'WETH' ||
                assetChange.asset.symbol === 'DAI' ||
                assetChange.asset.symbol === 'USDT' ||
                assetChange.asset.symbol === 'USDC' // is eth or stablecoin
              ) {
                if (!buySells[assetChange.asset.id]) {
                  buySells[assetChange.asset.id] = { buys: [], sells: [] }
                }
                if (assetChange.direction === 'IN') {
                  buySells[assetChange.asset.id].buys.push(tx)
                } else {
                  buySells[assetChange.asset.id].sells.push(tx)
                }
              }
            }
          })
        }
      })
    map[portfolio.ownerAddress] = buySells
  })
  return map
}
