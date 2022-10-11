import { ZERO } from '@kyberswap/ks-sdk-classic'
import { Fraction } from '@kyberswap/ks-sdk-core'
import axios from 'axios'
import { parseUnits } from 'ethers/lib/utils'
import JSBI from 'jsbi'
import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory, useLocation } from 'react-router-dom'
import useSWR from 'swr'
import useSWRImmutable from 'swr/immutable'

import { CAMPAIGN_LEADERBOARD_ITEM_PER_PAGE, RESERVE_USD_DECIMALS, SWR_KEYS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { AppPaths } from 'pages/App'
import {
  CampaignData,
  CampaignLeaderboard,
  CampaignLeaderboardRanking,
  CampaignLeaderboardReward,
  CampaignLuckyWinner,
  CampaignState,
  CampaignStatus,
  RewardDistribution,
  setCampaignData,
  setLoadingCampaignData,
  setLoadingCampaignDataError,
  setLoadingSelectedCampaignLeaderboard,
  setLoadingSelectedCampaignLuckyWinners,
  setSelectedCampaign,
  setSelectedCampaignLeaderboard,
  setSelectedCampaignLuckyWinners,
} from 'state/campaigns/actions'
import { AppState } from 'state/index'
import { SerializedToken } from 'state/user/actions'
import { getCampaignIdFromSlug, getSlugUrlCampaign } from 'utils/campaign'

const MAXIMUM_ITEMS_PER_REQUEST = 10000

const getCampaignStatus = ({ endTime, startTime }: CampaignData) => {
  const now = Date.now()
  return endTime <= now ? CampaignStatus.ENDED : startTime >= now ? CampaignStatus.UPCOMING : CampaignStatus.ONGOING
}

const formatLeaderboardData = (data: CampaignLeaderboard) => {
  const leaderboard: CampaignLeaderboard = {
    ...data,
    rankings: data.rankings
      ? data.rankings.map(
          (item: any): CampaignLeaderboardRanking => ({
            userAddress: item.userAddress,
            totalPoint: item.totalPoint,
            rankNo: item.rankNo,
            rewardAmount: new Fraction(
              item.rewardAmount || ZERO,
              JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(item?.token?.decimals ?? 18)),
            ),
            rewardAmountUsd: new Fraction(
              parseUnits(item?.rewardAmountUSD?.toString() || '0', RESERVE_USD_DECIMALS).toString(),
              JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(RESERVE_USD_DECIMALS)),
            ),
            rewardInUSD: item.rewardInUSD,
            token: item.token,
          }),
        )
      : [],
    rewards: data.rewards
      ? data.rewards.map(
          (item: any): CampaignLeaderboardReward => ({
            rewardAmount: new Fraction(
              item.RewardAmount,
              JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(item?.Token?.decimals ?? 18)),
            ),
            ref: item.Ref,
            claimed: item.Claimed,
            token: item.Token,
          }),
        )
      : [],
  }
  return leaderboard
}

const fetchLeaderBoard = ({
  pageNumber,
  userAddress,
  lookupAddress,
  campaignId,
}: {
  pageNumber: number
  userAddress: string
  lookupAddress: string
  campaignId: number
}) => {
  return axios({
    method: 'GET',
    url: SWR_KEYS.getLeaderboard(campaignId),
    params: {
      pageSize: CAMPAIGN_LEADERBOARD_ITEM_PER_PAGE,
      pageNumber,
      userAddress,
      lookupAddress,
      eligibleOnly: true,
    },
  }).then(({ data }) => formatLeaderboardData(data.data))
}

const LEADERBOARD_DEFAULT: CampaignLeaderboard = {
  finalizedAt: 0,
  distributedRewardsAt: 0,
  userRank: 0,
  numberOfEligibleParticipants: 0,
  rankings: [],
  rewards: [],
}

export default function CampaignsUpdater(): null {
  const dispatch = useDispatch()
  const { account } = useActiveWeb3React()
  const { pathname } = useLocation()
  const isCampaignPage = pathname.startsWith(AppPaths.CAMPAIGN)

  /**********************CAMPAIGN DATA**********************/
  const refLeaderboardData = useRef<{ [key: string]: CampaignLeaderboard }>({})

  const {
    data: campaignData,
    isValidating: isLoadingCampaignData,
    error: loadingCampaignDataError,
  } = useSWR<CampaignData[]>(isCampaignPage ? [SWR_KEYS.getListCampaign, account] : null, async () => {
    const { data: response } = await axios({
      method: 'GET',
      url: SWR_KEYS.getListCampaign,
      params: {
        limit: MAXIMUM_ITEMS_PER_REQUEST,
        offset: 0,
        userAddress: account,
      },
    })

    // each of campaign: fetch leaderboard once to display claim button if eligible, and cache that leaderboard
    const promises = response.data.map((campaignInfo: CampaignData) => {
      const leaderboardCache = refLeaderboardData.current[campaignInfo.id]
      if (!account) return Promise.resolve(campaignInfo)
      return leaderboardCache
        ? Promise.resolve({
            ...campaignInfo,
            leaderboard: leaderboardCache,
          })
        : new Promise(resolve => {
            fetchLeaderBoard({
              campaignId: campaignInfo.id,
              pageNumber: 1,
              userAddress: account?.toLowerCase() ?? '',
              lookupAddress: selectedCampaignLeaderboardLookupAddress.toLowerCase(),
            })
              .then(leaderboard => {
                refLeaderboardData.current[campaignInfo.id] = leaderboard // cache it
                resolve({
                  ...campaignInfo,
                  leaderboard,
                })
              })
              .catch(() => resolve(campaignInfo))
          })
    })

    const listCampaignWithLeaderboard = await Promise.all(promises)

    const campaigns: CampaignData[] = listCampaignWithLeaderboard
      .map(item => ({ ...item, startTime: item.startTime * 1000, endTime: item.endTime * 1000 }))
      .sort((a: CampaignData, b: CampaignData) => {
        const a_status = getCampaignStatus(a)
        const b_status = getCampaignStatus(b)
        const STATUS_PRIORITY = Object.values(CampaignStatus)
        const a_status_index = STATUS_PRIORITY.indexOf(a_status)
        const b_status_index = STATUS_PRIORITY.indexOf(b_status)
        if (a_status_index !== b_status_index) return a_status_index - b_status_index
        if (a.startTime !== b.startTime) return b.startTime - a.startTime
        return b.endTime - a.endTime
      })
    const formattedCampaigns: CampaignData[] = campaigns.map((campaign: any) => {
      const rewardDistribution: RewardDistribution[] = []
      if (campaign.rewardDistribution.single) {
        campaign.rewardDistribution.single.forEach(
          ({
            amount,
            rank,
            token,
            rewardInUSD,
          }: {
            amount: string
            rank: number
            token: SerializedToken
            rewardInUSD: boolean
          }) => {
            rewardDistribution.push({
              type: 'Single',
              amount,
              rank,
              token,
              rewardInUSD,
            })
          },
        )
      }
      if (campaign.rewardDistribution.range) {
        campaign.rewardDistribution.range.forEach(
          ({
            from,
            to,
            amount,
            token,
            rewardInUSD,
          }: {
            from: number
            to: number
            amount: string
            token: SerializedToken
            rewardInUSD: boolean
          }) => {
            rewardDistribution.push({
              type: 'Range',
              from,
              to,
              amount,
              token,
              rewardInUSD,
            })
          },
        )
      }
      if (campaign.rewardDistribution.random) {
        campaign.rewardDistribution.random.forEach(
          ({
            from,
            to,
            amount,
            numberOfWinners,
            token,
            rewardInUSD,
          }: {
            from: number
            to: number
            amount: string
            numberOfWinners: number
            token: SerializedToken
            rewardInUSD: boolean
          }) => {
            rewardDistribution.push({
              type: 'Random',
              from,
              to,
              amount,
              nWinners: numberOfWinners,
              token,
              rewardInUSD,
            })
          },
        )
      }
      if (campaign?.userInfo?.tradingVolume) campaign.userInfo.tradingVolume = Number(campaign.userInfo.tradingVolume)

      return {
        ...campaign,
        rewardDistribution,
        status: getCampaignStatus(campaign),
        eligibleTokens: campaign.eligibleTokens.map(
          ({ chainId, name, symbol, address, logoURI, decimals }: SerializedToken) => {
            return {
              chainId,
              name,
              symbol,
              address,
              logoURI,
              decimals,
            }
          },
        ),
      }
    })
    return formattedCampaigns
  })

  const slug = pathname.replace(AppPaths.CAMPAIGN, '')
  const qs = useParsedQueryString()
  const selectedCampaignId = qs.selectedCampaignId || getCampaignIdFromSlug(slug)

  const history = useHistory()
  useEffect(() => {
    dispatch(setCampaignData({ campaigns: campaignData ?? [] }))
    if (campaignData && campaignData.length) {
      if (selectedCampaignId === undefined) {
        history.push(getSlugUrlCampaign(campaignData[0]))
      } else {
        const selectedCampaign = campaignData.find(campaign => campaign.id.toString() === selectedCampaignId)
        if (selectedCampaign) {
          dispatch(setSelectedCampaign({ campaign: selectedCampaign }))
        } else {
          history.push(getSlugUrlCampaign(campaignData[0]))
        }
      }
    }
  }, [campaignData, dispatch, selectedCampaignId, history])

  useEffect(() => {
    dispatch(setLoadingCampaignData(isLoadingCampaignData))
  }, [dispatch, isLoadingCampaignData])

  useEffect(() => {
    dispatch(setLoadingCampaignDataError(loadingCampaignDataError))
  }, [dispatch, loadingCampaignDataError])

  const selectedCampaign = useSelector((state: AppState) => state.campaigns.selectedCampaign)

  /**********************CAMPAIGN LEADERBOARD**********************/

  const { selectedCampaignLeaderboardPageNumber, selectedCampaignLeaderboardLookupAddress } = useSelector(
    (state: AppState) => state.campaigns,
  )

  const { data: leaderboard, isValidating: isLoadingLeaderboard } = useSWRImmutable(
    selectedCampaign
      ? [
          selectedCampaign,
          SWR_KEYS.getLeaderboard(selectedCampaign.id),
          selectedCampaignLeaderboardPageNumber,
          selectedCampaignLeaderboardLookupAddress,
          account,
        ]
      : null,
    async () => {
      if (!selectedCampaign) {
        return LEADERBOARD_DEFAULT
      }

      try {
        return fetchLeaderBoard({
          campaignId: selectedCampaign.id,
          pageNumber: selectedCampaignLeaderboardPageNumber,
          userAddress: account?.toLowerCase() ?? '',
          lookupAddress: selectedCampaignLeaderboardLookupAddress.toLowerCase(),
        })
      } catch (err) {
        console.error(err)
        return LEADERBOARD_DEFAULT
      }
    },
  )

  useEffect(() => {
    if (leaderboard) {
      dispatch(setSelectedCampaignLeaderboard({ leaderboard }))
    }
  }, [dispatch, leaderboard])

  useEffect(() => {
    dispatch(setLoadingSelectedCampaignLeaderboard(isLoadingLeaderboard))
  }, [dispatch, isLoadingLeaderboard])

  /**********************CAMPAIGN LUCKY WINNERS**********************/

  const { selectedCampaignLuckyWinnersPageNumber, selectedCampaignLuckyWinnersLookupAddress } = useSelector(
    (state: AppState) => state.campaigns,
  )

  const { data: luckyWinners, isValidating: isLoadingLuckyWinners } = useSWRImmutable(
    selectedCampaign
      ? [
          selectedCampaign,
          SWR_KEYS.getLuckyWinners(selectedCampaign.id),
          selectedCampaignLuckyWinnersPageNumber,
          selectedCampaignLuckyWinnersLookupAddress,
        ]
      : null,
    async () => {
      if (selectedCampaign === undefined || selectedCampaign.campaignState === CampaignState.CampaignStateReady)
        return []

      try {
        const response = await axios({
          method: 'GET',
          url: SWR_KEYS.getLuckyWinners(selectedCampaign.id),
          params: {
            pageSize: CAMPAIGN_LEADERBOARD_ITEM_PER_PAGE,
            pageNumber: selectedCampaignLuckyWinnersPageNumber,
            lookupAddress: selectedCampaignLuckyWinnersLookupAddress.toLowerCase(),
          },
        })
        const data = response.data.data
        const luckyWinners: CampaignLuckyWinner[] = data.map(
          (item: any): CampaignLuckyWinner => ({
            userAddress: item.userAddress,
            rewardAmount: new Fraction(
              item.rewardAmount,
              JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(item?.token?.decimals ?? 18)),
            ),
            token: item.token,
          }),
        )
        return luckyWinners
      } catch (err) {
        console.error(err)
        return []
      }
    },
  )

  useEffect(() => {
    if (luckyWinners !== undefined) {
      dispatch(setSelectedCampaignLuckyWinners({ luckyWinners: luckyWinners }))
    }
  }, [dispatch, luckyWinners])

  useEffect(() => {
    dispatch(setLoadingSelectedCampaignLuckyWinners(isLoadingLuckyWinners))
  }, [dispatch, isLoadingLuckyWinners])

  return null
}
