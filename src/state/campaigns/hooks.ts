import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory } from 'react-router'

import { NETWORKS_INFO } from 'constants/networks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import {
  setClaimingCampaignRewardId,
  setRecaptchaCampaignId,
  setRecaptchaCampaignLoading,
  setSelectedCampaignLeaderboardLookupAddress,
  setSelectedCampaignLeaderboardPageNumber,
  setSelectedCampaignLuckyWinnersLookupAddress,
  setSelectedCampaignLuckyWinnersPageNumber,
} from 'state/campaigns/actions'
import { AppState } from 'state/index'

export function useSelectedCampaignLeaderboardPageNumberManager(): [number, (page: number) => void] {
  const selectedCampaignLeaderboardPageNumber = useSelector(
    (state: AppState) => state.campaigns.selectedCampaignLeaderboardPageNumber,
  )
  const dispatch = useDispatch()

  const updateSelectedCampaignLeaderboardPageNumberCallback = useCallback(
    (newPageNumber: number) => {
      dispatch(setSelectedCampaignLeaderboardPageNumber(newPageNumber))
    },
    [dispatch],
  )

  return [selectedCampaignLeaderboardPageNumber, updateSelectedCampaignLeaderboardPageNumberCallback]
}

export function useSelectedCampaignLuckyWinnerPageNumber(): [number, (page: number) => void] {
  const page = useSelector((state: AppState) => state.campaigns.selectedCampaignLuckyWinnersPageNumber)
  const dispatch = useDispatch()

  const setPage = useCallback(
    (newPageNumber: number) => {
      dispatch(setSelectedCampaignLuckyWinnersPageNumber(newPageNumber))
    },
    [dispatch],
  )

  return [page, setPage]
}

export function useSelectedCampaignLeaderboardLookupAddressManager() {
  const selectedCampaignLeaderboardLookupAddress = useSelector(
    (state: AppState) => state.campaigns.selectedCampaignLeaderboardLookupAddress,
  )
  const dispatch = useDispatch()

  const updateSelectedCampaignLeaderboardLookupAddressCallback = useCallback(
    (newLookupAddress: string) => {
      dispatch(setSelectedCampaignLeaderboardLookupAddress(newLookupAddress))
    },
    [dispatch],
  )

  return useMemo(
    () => [selectedCampaignLeaderboardLookupAddress, updateSelectedCampaignLeaderboardLookupAddressCallback] as const,
    [selectedCampaignLeaderboardLookupAddress, updateSelectedCampaignLeaderboardLookupAddressCallback],
  )
}

export function useSelectedCampaignLuckyWinnersLookupAddressManager() {
  const selectedCampaignLuckyWinnersLookupAddress = useSelector(
    (state: AppState) => state.campaigns.selectedCampaignLuckyWinnersLookupAddress,
  )
  const dispatch = useDispatch()

  const updateSelectedCampaignLuckyWinnersLookupAddressCallback = useCallback(
    (newLookupAddress: string) => {
      dispatch(setSelectedCampaignLuckyWinnersLookupAddress(newLookupAddress))
    },
    [dispatch],
  )

  return useMemo(
    () => [selectedCampaignLuckyWinnersLookupAddress, updateSelectedCampaignLuckyWinnersLookupAddressCallback] as const,
    [selectedCampaignLuckyWinnersLookupAddress, updateSelectedCampaignLuckyWinnersLookupAddressCallback],
  )
}

export function useRecaptchaCampaignManager() {
  const recaptchaCampaign = useSelector((state: AppState) => state.campaigns.recaptchaCampaign)
  const dispatch = useDispatch()

  const updateRecaptchaCampaignId = useCallback(
    (id: number | undefined) => {
      dispatch(setRecaptchaCampaignId(id))
    },
    [dispatch],
  )

  const updateRecaptchaCampaignLoading = useCallback(
    (loading: boolean) => {
      dispatch(setRecaptchaCampaignLoading(loading))
    },
    [dispatch],
  )

  return useMemo(
    () => [recaptchaCampaign, updateRecaptchaCampaignId, updateRecaptchaCampaignLoading] as const,
    [recaptchaCampaign, updateRecaptchaCampaignId, updateRecaptchaCampaignLoading],
  )
}

export function useSwapNowHandler() {
  const { mixpanelHandler } = useMixpanel()
  const selectedCampaign = useSelector((state: AppState) => state.campaigns.selectedCampaign)
  const history = useHistory()

  return useCallback(
    (chainId: ChainId) => {
      mixpanelHandler(MIXPANEL_TYPE.CAMPAIGN_SWAP_NOW_CLICKED, { campaign_name: selectedCampaign?.name })
      let path = `/swap/${NETWORKS_INFO[chainId].route}`
      if (selectedCampaign?.eligibleTokens?.length) {
        const firstTokenOfChain = selectedCampaign.eligibleTokens.find(token => token.chainId === chainId)
        if (firstTokenOfChain) {
          path += '&outputCurrency=' + firstTokenOfChain.address
        }
      }
      history.push(path)
    },
    [history, mixpanelHandler, selectedCampaign],
  )
}

export function useSetClaimingCampaignRewardId(): [number | null, (id: number | null) => void] {
  const { claimingCampaignRewardId } = useSelector((state: AppState) => state.campaigns)
  const dispatch = useDispatch()

  const setClaimingRewardId = useCallback(
    (id: number | null) => {
      dispatch(setClaimingCampaignRewardId(id))
    },
    [dispatch],
  )

  return [claimingCampaignRewardId, setClaimingRewardId]
}
