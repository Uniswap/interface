import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import {
  setSelectedCampaignLeaderboardLookupAddress,
  setSelectedCampaignLeaderboardPageNumber,
  setSelectedCampaignLuckyWinnersLookupAddress,
} from 'state/campaigns/actions'
import { AppState } from 'state/index'

export function useSelectedCampaignLeaderboardPageNumberManager() {
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

  return useMemo(
    () => [selectedCampaignLeaderboardPageNumber, updateSelectedCampaignLeaderboardPageNumberCallback] as const,
    [selectedCampaignLeaderboardPageNumber, updateSelectedCampaignLeaderboardPageNumberCallback],
  )
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
