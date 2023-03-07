import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { ChainId, NativeCurrency, Token } from '@kyberswap/ks-sdk-core'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useDeepCompareEffect } from 'react-use'

import { ETH_PRICE, PROMM_ETH_PRICE, TOKEN_DERIVED_ETH } from 'apollo/queries'
import { isPopupCanShow, useAckAnnouncement } from 'components/Announcement/helper'
import {
  PopupContent,
  PopupContentAnnouncement,
  PopupContentSimple,
  PopupContentTxn,
  PopupItemType,
  PopupType,
} from 'components/Announcement/type'
import { OUTSITE_FARM_REWARDS_QUERY, ZERO_ADDRESS } from 'constants/index'
import { KNC } from 'constants/tokens'
import { VERSION } from 'constants/v2'
import { useActiveWeb3React } from 'hooks/index'
import { useKyberswapConfig } from 'hooks/useKyberswapConfig'
import { useAppSelector } from 'state/hooks'
import { AppDispatch, AppState } from 'state/index'
import { getBlockFromTimestamp, getPercentChange } from 'utils'

import {
  ApplicationModal,
  addPopup,
  closeModal,
  removePopup,
  setOpenModal,
  updateETHPrice,
  updateKNCPrice,
  updatePrommETHPrice,
} from './actions'

export function useBlockNumber(): number | undefined {
  const { chainId } = useActiveWeb3React()

  return useSelector((state: AppState) => state.application.blockNumber[chainId])
}

export const useCloseModal = (modal: ApplicationModal) => {
  const dispatch = useDispatch<AppDispatch>()

  const onCloseModal = useCallback(() => {
    dispatch(closeModal(modal))
  }, [dispatch, modal])

  return onCloseModal
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

export function useToggleNotificationCenter() {
  const toggleNotificationCenter = useToggleModal(ApplicationModal.NOTIFICATION_CENTER)
  const clearAllPopup = useRemoveAllPopupByType()
  return useCallback(() => {
    toggleNotificationCenter()
    clearAllPopup(PopupType.TOP_RIGHT)
  }, [clearAllPopup, toggleNotificationCenter])
}

export function useOpenModal(modal: ApplicationModal): () => void {
  const dispatch = useDispatch<AppDispatch>()
  return useCallback(() => dispatch(setOpenModal(modal)), [dispatch, modal])
}

export function useNetworkModalToggle(): () => void {
  return useToggleModal(ApplicationModal.NETWORK)
}

export function useOpenNetworkModal(): () => void {
  return useOpenModal(ApplicationModal.NETWORK)
}

export function useWalletModalToggle(): () => void {
  return useToggleModal(ApplicationModal.WALLET)
}

export function useToggleTransactionSettingsMenu(): () => void {
  return useToggleModal(ApplicationModal.TRANSACTION_SETTINGS)
}

export function useToggleYourCampaignTransactionsModal(): () => void {
  return useToggleModal(ApplicationModal.YOUR_CAMPAIGN_TRANSACTIONS)
}

export function usePoolDetailModalToggle(): () => void {
  return useToggleModal(ApplicationModal.POOL_DETAIL)
}

export function useSelectCampaignModalToggle(): () => void {
  return useToggleModal(ApplicationModal.SELECT_CAMPAIGN)
}

export function useRegisterCampaignCaptchaModalToggle(): () => void {
  return useToggleModal(ApplicationModal.REGISTER_CAMPAIGN_CAPTCHA)
}

export function useRegisterCampaignSuccessModalToggle(): () => void {
  return useToggleModal(ApplicationModal.REGISTER_CAMPAIGN_SUCCESS)
}

export function useTrueSightNetworkModalToggle(): () => void {
  return useToggleModal(ApplicationModal.TRUESIGHT_NETWORK)
}

export function useNotificationModalToggle(): () => void {
  return useToggleModal(ApplicationModal.NOTIFICATION_SUBSCRIPTION)
}

export function useToggleEthPowAckModal(): () => void {
  return useToggleModal(ApplicationModal.ETH_POW_ACK)
}

// returns a function that allows adding a popup
export function useAddPopup(): (
  content: PopupContent,
  popupType: PopupType,
  key?: string,
  removeAfterMs?: number | null,
) => void {
  const dispatch = useDispatch()

  return useCallback(
    (content: PopupContent, popupType: PopupType, key?: string, removeAfterMs?: number | null) => {
      dispatch(addPopup({ content, key, popupType, removeAfterMs }))
    },
    [dispatch],
  )
}

// simple notify with text and description
export const useNotify = () => {
  const addPopup = useAddPopup()
  return useCallback(
    (data: PopupContentSimple, removeAfterMs: number | null | undefined = 4000) => {
      addPopup(data, PopupType.SIMPLE, data.title + Math.random(), removeAfterMs)
    },
    [addPopup],
  )
}

// popup notify transaction
export const useTransactionNotify = () => {
  const addPopup = useAddPopup()
  return useCallback(
    (data: PopupContentTxn) => {
      addPopup(data, PopupType.TRANSACTION, data.hash)
    },
    [addPopup],
  )
}

// returns a function that allows removing a popup via its key
export function useRemovePopup() {
  const dispatch = useDispatch()
  const { ackAnnouncement } = useAckAnnouncement()
  return useCallback(
    (popup: PopupItemType) => {
      const { key, popupType, content } = popup
      if ([PopupType.CENTER, PopupType.SNIPPET, PopupType.TOP_RIGHT, PopupType.TOP_BAR].includes(popupType)) {
        ackAnnouncement((content as PopupContentAnnouncement).metaMessageId)
      }
      dispatch(removePopup({ key }))
    },
    [dispatch, ackAnnouncement],
  )
}

export function useRemoveAllPopupByType() {
  const data = useActivePopups()
  const removePopup = useRemovePopup()

  return useCallback(
    (typesRemove: PopupType) => {
      const { snippetPopups, centerPopups, topPopups, topRightPopups } = data

      const map: Record<PopupType, PopupItemType[]> = {
        [PopupType.SNIPPET]: snippetPopups,
        [PopupType.CENTER]: centerPopups,
        [PopupType.TOP_BAR]: topPopups,
        [PopupType.TOP_RIGHT]: topRightPopups,
        [PopupType.SIMPLE]: topRightPopups,
        [PopupType.TRANSACTION]: topRightPopups,
      }
      const popups: PopupItemType[] = map[typesRemove] ?? []
      popups.forEach(removePopup)
    },
    [data, removePopup],
  )
}

// get the list of active popups
export function useActivePopups() {
  const popups = useSelector(
    (state: AppState) => state.application.popupList,
  ) as PopupItemType<PopupContentAnnouncement>[]
  const { announcementsAckMap } = useAckAnnouncement()
  const { chainId } = useActiveWeb3React()

  return useMemo(() => {
    const topRightPopups = popups.filter(e =>
      [PopupType.SIMPLE, PopupType.TOP_RIGHT, PopupType.TRANSACTION].includes(e.popupType),
    )

    const topPopups = popups.filter(
      e => e.popupType === PopupType.TOP_BAR && isPopupCanShow(e, announcementsAckMap, chainId),
    )
    const snippetPopups = popups.filter(
      e => e.popupType === PopupType.SNIPPET && isPopupCanShow(e, announcementsAckMap, chainId),
    )

    const centerPopups = popups.filter(
      e => e.popupType === PopupType.CENTER && isPopupCanShow(e, announcementsAckMap, chainId),
    )
    return {
      topPopups,
      centerPopups,
      topRightPopups,
      snippetPopups,
    }
  }, [popups, announcementsAckMap, chainId])
}

/**
 * Gets the current price  of ETH, 24 hour price, and % change between them
 */
export const getEthPrice = async (
  chainId: ChainId,
  apolloClient: ApolloClient<NormalizedCacheObject>,
  blockClient: ApolloClient<NormalizedCacheObject>,
) => {
  const utcCurrentTime = dayjs()
  const utcOneDayBack = utcCurrentTime.subtract(1, 'day').startOf('minute').unix()

  let ethPrice = 0
  let ethPriceOneDay = 0
  let priceChangeETH = 0

  try {
    const oneDayBlock = await getBlockFromTimestamp(utcOneDayBack, chainId, blockClient)
    const result = await apolloClient.query({
      query: ETH_PRICE(),
      fetchPolicy: 'network-only',
    })

    const resultOneDay = await apolloClient.query({
      query: ETH_PRICE(oneDayBlock),
      fetchPolicy: 'network-only',
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

const getPrommEthPrice = async (
  chainId: ChainId,
  apolloClient: ApolloClient<NormalizedCacheObject>,
  blockClient: ApolloClient<NormalizedCacheObject>,
) => {
  const utcCurrentTime = dayjs()
  const utcOneDayBack = utcCurrentTime.subtract(1, 'day').startOf('minute').unix()

  let ethPrice = 0
  let ethPriceOneDay = 0
  let priceChangeETH = 0

  try {
    const oneDayBlock = await getBlockFromTimestamp(utcOneDayBack, chainId, blockClient)
    const result = await apolloClient.query({
      query: PROMM_ETH_PRICE(),
      fetchPolicy: 'network-only',
    })

    const resultOneDay = await apolloClient.query({
      query: PROMM_ETH_PRICE(oneDayBlock),
      fetchPolicy: 'network-only',
    })
    const currentPrice = result?.data?.bundles[0]?.ethPriceUSD
    const oneDayBackPrice = resultOneDay?.data?.bundles[0]?.ethPriceUSD

    priceChangeETH = getPercentChange(currentPrice, oneDayBackPrice)
    ethPrice = currentPrice
    ethPriceOneDay = oneDayBackPrice
  } catch (e) {
    console.log(e)
  }

  return [ethPrice, ethPriceOneDay, priceChangeETH]
}

export function useETHPrice(version: string = VERSION.CLASSIC): AppState['application']['ethPrice'] {
  const dispatch = useDispatch()
  const { isEVM, chainId } = useActiveWeb3React()
  const { elasticClient, classicClient, blockClient } = useKyberswapConfig()

  const ethPrice = useSelector((state: AppState) =>
    version === VERSION.ELASTIC ? state.application.prommEthPrice : state.application.ethPrice,
  )

  useEffect(() => {
    if (!isEVM) return

    async function checkForEthPrice() {
      const [newPrice, oneDayBackPrice, pricePercentChange] = await (version === VERSION.ELASTIC
        ? getPrommEthPrice(chainId, elasticClient, blockClient)
        : getEthPrice(chainId, classicClient, blockClient))

      dispatch(
        version === VERSION.ELASTIC
          ? updatePrommETHPrice({
              currentPrice: (newPrice ? newPrice : 0).toString(),
              oneDayBackPrice: (oneDayBackPrice ? oneDayBackPrice : 0).toString(),
              pricePercentChange,
            })
          : updateETHPrice({
              currentPrice: (newPrice ? newPrice : 0).toString(),
              oneDayBackPrice: (oneDayBackPrice ? oneDayBackPrice : 0).toString(),
              pricePercentChange,
            }),
      )
    }
    checkForEthPrice()
  }, [dispatch, chainId, version, isEVM, elasticClient, classicClient, blockClient])

  return ethPrice
}

/**
 * Gets the current price of KNC by ETH
 */
export const getKNCPriceByETH = async (chainId: ChainId, apolloClient: ApolloClient<NormalizedCacheObject>) => {
  let kncPriceByETH = 0

  try {
    const result = await apolloClient.query({
      query: TOKEN_DERIVED_ETH(KNC[chainId].address),
      fetchPolicy: 'no-cache',
    })

    const derivedETH = result?.data?.tokens[0]?.derivedETH

    kncPriceByETH = parseFloat(derivedETH) || 0
  } catch (e) {
    console.log(e)
  }

  return kncPriceByETH
}

export function useKNCPrice(): AppState['application']['kncPrice'] {
  const dispatch = useDispatch()
  const ethPrice = useETHPrice()
  const { isEVM, chainId } = useActiveWeb3React()
  const blockNumber = useBlockNumber()
  const { classicClient } = useKyberswapConfig()

  const kncPrice = useSelector((state: AppState) => state.application.kncPrice)

  useEffect(() => {
    if (!isEVM) return
    async function checkForKNCPrice() {
      const kncPriceByETH = await getKNCPriceByETH(chainId, classicClient)
      const kncPrice = ethPrice.currentPrice && kncPriceByETH * parseFloat(ethPrice.currentPrice)
      dispatch(updateKNCPrice(kncPrice?.toString()))
    }
    checkForKNCPrice()
  }, [kncPrice, dispatch, ethPrice.currentPrice, isEVM, classicClient, chainId, blockNumber])

  return kncPrice
}

/**
 * Gets the current price of KNC by ETH
 */
const getTokenPriceByETH = async (tokenAddress: string, apolloClient: ApolloClient<NormalizedCacheObject>) => {
  let tokenPriceByETH = 0

  try {
    const result = await apolloClient.query({
      query: TOKEN_DERIVED_ETH(tokenAddress),
      fetchPolicy: 'no-cache',
    })

    const derivedETH = result?.data?.tokens[0]?.derivedETH

    tokenPriceByETH = parseFloat(derivedETH)

    const temp = OUTSITE_FARM_REWARDS_QUERY[tokenAddress]
    if (temp) {
      const res = await fetch(temp.subgraphAPI, {
        method: 'POST',
        body: JSON.stringify({
          query: temp.query,
        }),
      }).then(res => res.json())

      const derivedETH = res?.data?.tokens[0]?.derivedBNB

      tokenPriceByETH = parseFloat(derivedETH)
    }
  } catch (e) {
    console.log(e)
  }

  return tokenPriceByETH
}

const cache: { [key: string]: number } = {}

export function useTokensPrice(tokens: (Token | NativeCurrency | null | undefined)[], version?: string): number[] {
  const ethPrice = useETHPrice(version)

  const { chainId, isEVM } = useActiveWeb3React()
  const [prices, setPrices] = useState<number[]>([])
  const { elasticClient, classicClient } = useKyberswapConfig()

  useDeepCompareEffect(() => {
    if (!isEVM) return
    const client = version !== VERSION.ELASTIC ? classicClient : elasticClient

    async function checkForTokenPrice() {
      const tokensPrice = tokens.map(async token => {
        if (!token) {
          return 0
        }

        if (!ethPrice?.currentPrice) {
          return 0
        }

        if (token.isNative || token?.address === ZERO_ADDRESS) {
          return parseFloat(ethPrice.currentPrice)
        }

        const key = `${token.address}_${chainId}_${version}`
        if (cache[key]) return cache[key]

        const tokenPriceByETH = await getTokenPriceByETH(token?.address, client)
        const tokenPrice = tokenPriceByETH * parseFloat(ethPrice.currentPrice)

        if (tokenPrice) cache[key] = tokenPrice

        return tokenPrice || 0
      })

      const result = await Promise.all(tokensPrice)

      setPrices(result)
    }

    checkForTokenPrice()
  }, [ethPrice.currentPrice, chainId, isEVM, elasticClient, classicClient, tokens, version])

  return prices
}

export const useServiceWorkerRegistration = () => {
  return useAppSelector(state => state.application.serviceWorkerRegistration)
}
