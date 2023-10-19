// import { ChainId } from '@uniswap/sdk'
// import { Token } from '@uniswap/sdk'
// import { ChainId } from '@pollum-io/smart-order-router'
import { FarmingType } from 'components/Farm/constants'
// import { useDefaultActiveTokens } from 'hooks/Tokens'
// import { GlobalValue } from 'constants/index'
// import { OLD_DQUICK } from 'constants/v3/addresses'
// import { useTokens } from 'hooks/Tokens'
// import { FarmingType } from 'models/enums'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

// import { FarmListInfo, StakingBasic, StakingRaw } from 'types/farms'
// import { Token } from 'types/v3'
import { AppState } from '../types'
import { updateV3Stake } from './actions'

// import { getTokenFromAddress } from 'utils'

// import { updateV3Stake } from './actions'

// export class WrappedStakingInfo implements StakingBasic {
//   public readonly stakingInfo: StakingRaw
//   public readonly chainId: ChainId
//   public readonly stakingRewardAddress: string
//   public readonly pair: string
//   public readonly rate: number
//   public readonly tokens: [Token, Token]
//   public readonly ended: boolean
//   public readonly lp: string
//   public readonly name: string
//   public readonly baseToken: Token
//   public readonly rewardToken: Token

//   constructor(stakingInfo: StakingRaw, tokenAddressMap: TokenAddressMap, farmTokens: Token[], chainId: ChainId) {
//     this.stakingInfo = stakingInfo
//     //TODO: Support Multichain
//     this.chainId = chainId
//     this.stakingRewardAddress = stakingInfo.stakingRewardAddress
//     this.rate = stakingInfo.rate
//     this.ended = stakingInfo.ended
//     this.pair = stakingInfo.pair
//     this.lp = stakingInfo.lp
//     this.name = stakingInfo.name

//     this.baseToken = getTokenFromAddress(stakingInfo.baseToken, chainId, tokenAddressMap, farmTokens)
//     this.tokens = [
//       getTokenFromAddress(stakingInfo.tokens[0], chainId, tokenAddressMap, farmTokens),
//       getTokenFromAddress(stakingInfo.tokens[1], chainId, tokenAddressMap, farmTokens),
//     ]
//     this.rewardToken = stakingInfo.rewardToken
//       ? getTokenFromAddress(stakingInfo.rewardToken, chainId, tokenAddressMap, farmTokens)
//       : OLD_DQUICK[chainId]
//   }
// }

// export type StakingInfoAddressMap = Readonly<{
//   [chainId in ChainId]: Readonly<{
//     [stakingInfoAddress: string]: WrappedStakingInfo
//   }>
// }>

/**
 * An empty result, useful as a default.
 */
// const EMPTY_LIST: StakingInfoAddressMap = {
//   [ChainId.ROLLUX]: {},
//   [ChainId.ROLLUX_TANENBAUM]: {},
// }

// const farmCache: WeakMap<FarmListInfo, StakingInfoAddressMap> | null =
//   typeof WeakMap !== 'undefined' ? new WeakMap<FarmListInfo, StakingInfoAddressMap>() : null

// export function listToFarmMap(
//   list: FarmListInfo,
//   tokenAddressMap: TokenAddressMap,
//   farmTokens: Token[]
// ): StakingInfoAddressMap {
//   const result = farmCache?.get(list)
//   if (result) return result

//   const map = list.active.concat(list.closed).reduce<StakingInfoAddressMap>(
//     (stakingInfoMap, stakingInfo) => {
//       const wrappedStakingInfo = new WrappedStakingInfo(stakingInfo, tokenAddressMap, farmTokens, ChainId.MATIC)
//       if (stakingInfoMap[wrappedStakingInfo.chainId][wrappedStakingInfo.stakingRewardAddress] !== undefined)
//         throw Error('Duplicate farms.')
//       return {
//         ...stakingInfoMap,
//         [wrappedStakingInfo.chainId]: {
//           ...stakingInfoMap[wrappedStakingInfo.chainId],
//           [wrappedStakingInfo.stakingRewardAddress]: wrappedStakingInfo,
//         },
//       }
//     },
//     { ...EMPTY_LIST }
//   )
//   farmCache?.set(list, map)
//   return map
// }

// export function useFarmList(url: string | undefined): StakingInfoAddressMap {
//   const farms = useSelector<AppState, AppState['farms']['byUrl']>((state) => state.farms.byUrl)

//   const tokenMap = useDefaultActiveTokens()
//   const current = url ? farms[url]?.current : null
//   const farmTokenAddresses =
//     current && tokenMap
//       ? current.active
//           .concat(current.closed)
//           .map((item) => [item.baseToken, item.tokens[0], item.tokens[1], item.rewardToken])
//           .flat()
//           .filter((item) => !!item)
//           .filter((address) => !tokenMap[ChainId.ROLLUX][address])
//           .filter(
//             (address) =>
//               !GlobalValue.tokens.COMMON[ChainId.ROLLUX].find(
//                 (token) => token.address.toLowerCase() === address.toLowerCase()
//               )
//           )
//           .filter(
//             (addr, ind, self) => self.findIndex((address) => address.toLowerCase() === addr.toLowerCase()) === ind
//           )
//       : []

//   const farmTokens = useTokens(farmTokenAddresses)
//   return useMemo(() => {
//     if (!current || !tokenMap || farmTokens?.length !== farmTokenAddresses.length) return EMPTY_LIST
//     try {
//       return listToFarmMap(current, tokenMap, farmTokens ?? [])
//     } catch (error) {
//       console.error('Could not show token list due to error', error)
//       return EMPTY_LIST
//     }
//   }, [current, farmTokens, farmTokenAddresses.length, tokenMap])
// }

// export function useDefaultFarmList(): StakingInfoAddressMap {
//   return useFarmList(process.env.REACT_APP_STAKING_LIST_DEFAULT_URL)
// }

// returns all downloaded current lists
// export function useAllFarms(): FarmListInfo[] {
//   const farms = useSelector<AppState, AppState['farms']['byUrl']>((state) => state.farms.byUrl)

//   return useMemo(
//     () =>
//       Object.keys(farms)
//         .map((url) => farms[url].current)
//         .filter((l): l is FarmListInfo => Boolean(l)),
//     [farms]
//   )
// }

export function useV3StakeData() {
  const v3Stake = useSelector<AppState, AppState['farms']['v3Stake']>((state) => state.farms.v3Stake)

  const dispatch = useDispatch()
  const _updateV3Stake = useCallback(
    (v3Stake: {
      txType?: string
      txHash?: string
      txConfirmed?: boolean
      selectedTokenId?: string
      selectedFarmingType?: FarmingType | null
      txError?: string
    }) => {
      dispatch(updateV3Stake(v3Stake))
    },
    [dispatch]
  )

  return { v3Stake, updateV3Stake: _updateV3Stake }
}
