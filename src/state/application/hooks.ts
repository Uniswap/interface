import { useCallback, useMemo, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import dayjs from 'dayjs'

import { exchangeCient } from 'apollo/client'
import { ETH_PRICE, TOKEN_DERIVED_ETH } from 'apollo/queries'
import { ChainId } from 'libs/sdk/src'
import { KNC } from '../../constants'
import { useActiveWeb3React } from '../../hooks'
import { AppDispatch, AppState } from '../index'
import {
  addPopup,
  ApplicationModal,
  PopupContent,
  removePopup,
  setOpenModal,
  updateETHPrice,
  updateKNCPrice
} from './actions'
import { getPercentChange, getBlockFromTimestamp } from 'utils'

export function useBlockNumber(): number | undefined {
  const { chainId } = useActiveWeb3React()

  return useSelector((state: AppState) => state.application.blockNumber[chainId ?? -1])
}

export function useModalOpen(modal: ApplicationModal): boolean {
  const openModal = useSelector((state: AppState) => state.application.openModal)
  return openModal === modal
}

export function useToggleModal(modal: ApplicationModal): () => void {
  const open = useModalOpen(modal)
  const dispatch = useDispatch<AppDispatch>()
  return useCallback(() => dispatch(setOpenModal(open ? null : modal)), [dispatch, modal, open])
}

export function useOpenModal(modal: ApplicationModal): () => void {
  const dispatch = useDispatch<AppDispatch>()
  return useCallback(() => dispatch(setOpenModal(modal)), [dispatch, modal])
}

export function useCloseModals(): () => void {
  const dispatch = useDispatch<AppDispatch>()
  return useCallback(() => dispatch(setOpenModal(null)), [dispatch])
}

export function useWalletModalToggle(): () => void {
  return useToggleModal(ApplicationModal.WALLET)
}

export function useToggleSettingsMenu(): () => void {
  return useToggleModal(ApplicationModal.SETTINGS)
}

export function useShowClaimPopup(): boolean {
  return useModalOpen(ApplicationModal.CLAIM_POPUP)
}

export function useToggleShowClaimPopup(): () => void {
  return useToggleModal(ApplicationModal.CLAIM_POPUP)
}

export function useToggleSelfClaimModal(): () => void {
  return useToggleModal(ApplicationModal.SELF_CLAIM)
}

export function useToggleDelegateModal(): () => void {
  return useToggleModal(ApplicationModal.DELEGATE)
}

export function useToggleVoteModal(): () => void {
  return useToggleModal(ApplicationModal.VOTE)
}

export function usePoolDetailModalToggle(): () => void {
  return useToggleModal(ApplicationModal.POOL_DETAIL)
}

export function useFarmClaimModalToggle(): () => void {
  return useToggleModal(ApplicationModal.FARM_CLAIM)
}

export function useFarmHistoryModalToggle(): () => void {
  return useToggleModal(ApplicationModal.FARM_HISTORY)
}

export function useFarmStakeModalToggle(): () => void {
  return useToggleModal(ApplicationModal.FARM_STAKE)
}

// returns a function that allows adding a popup
export function useAddPopup(): (content: PopupContent, key?: string) => void {
  const dispatch = useDispatch()

  return useCallback(
    (content: PopupContent, key?: string) => {
      dispatch(addPopup({ content, key }))
    },
    [dispatch]
  )
}

// returns a function that allows removing a popup via its key
export function useRemovePopup(): (key: string) => void {
  const dispatch = useDispatch()
  return useCallback(
    (key: string) => {
      dispatch(removePopup({ key }))
    },
    [dispatch]
  )
}

// get the list of active popups
export function useActivePopups(): AppState['application']['popupList'] {
  const list = useSelector((state: AppState) => state.application.popupList)
  return useMemo(() => list.filter(item => item.show), [list])
}

/**
 * Gets the current price  of ETH, 24 hour price, and % change between them
 */
const getEthPrice = async (chainId?: ChainId) => {
  const utcCurrentTime = dayjs()
  const utcOneDayBack = utcCurrentTime
    .subtract(1, 'day')
    .startOf('minute')
    .unix()

  let ethPrice = 0
  let ethPriceOneDay = 0
  let priceChangeETH = 0

  try {
    const oneDayBlock = await getBlockFromTimestamp(utcOneDayBack, chainId)
    const result = await exchangeCient[chainId as ChainId].query({
      query: ETH_PRICE(),
      fetchPolicy: 'cache-first'
    })
    const resultOneDay = await exchangeCient[chainId as ChainId].query({
      query: ETH_PRICE(oneDayBlock),
      fetchPolicy: 'cache-first'
    })
    const currentPrice = result?.data?.bundles[0]?.ethPrice
    const oneDayBackPrice = resultOneDay?.data?.bundles[0]?.ethPrice

    priceChangeETH = getPercentChange(currentPrice, oneDayBackPrice)
    ethPrice = currentPrice
    ethPriceOneDay = oneDayBackPrice
  } catch (e) {
    console.log(e)
  }

  return [ethPrice, ethPriceOneDay, priceChangeETH]
}

export function useETHPrice(): AppState['application']['ethPrice'] {
  const dispatch = useDispatch()
  const { chainId } = useActiveWeb3React()

  const ethPrice = useSelector((state: AppState) => state.application.ethPrice)

  useEffect(() => {
    async function checkForEthPrice() {
      const [newPrice, oneDayBackPrice, pricePercentChange] = await getEthPrice(chainId as ChainId)
      dispatch(
        updateETHPrice({
          currentPrice: (newPrice ? newPrice : 0).toString(),
          oneDayBackPrice: (oneDayBackPrice ? oneDayBackPrice : 0).toString(),
          pricePercentChange
        })
      )
    }
    checkForEthPrice()
  }, [ethPrice, dispatch, chainId])

  return ethPrice
}

/**
 * Gets the current price of KNC by ETH
 */
const getKNCPriceByETH = async (chainId?: ChainId) => {
  let kncPriceByETH = 0

  try {
    const result = await exchangeCient[chainId as ChainId].query({
      query: TOKEN_DERIVED_ETH(KNC[chainId as ChainId].address),
      fetchPolicy: 'no-cache'
    })

    const derivedETH = result?.data?.tokens[0]?.derivedETH

    kncPriceByETH = parseFloat(derivedETH)
  } catch (e) {
    console.log(e)
  }

  return kncPriceByETH
}

export function useKNCPrice(): AppState['application']['kncPrice'] {
  const dispatch = useDispatch()
  const ethPrice = useETHPrice()
  const { chainId } = useActiveWeb3React()

  const kncPrice = useSelector((state: AppState) => state.application.kncPrice)

  useEffect(() => {
    async function checkForKNCPrice() {
      const kncPriceByETH = await getKNCPriceByETH(chainId)
      const kncPrice = ethPrice.currentPrice && kncPriceByETH * parseFloat(ethPrice.currentPrice)
      dispatch(updateKNCPrice(kncPrice?.toString()))
    }
    checkForKNCPrice()
  }, [kncPrice, dispatch, ethPrice.currentPrice, chainId])

  return kncPrice
}
