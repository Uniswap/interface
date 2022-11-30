import { BigNumber } from '@ethersproject/bignumber'
import { formatEther } from '@ethersproject/units'
import { useWeb3React } from '@web3-react/core'
import { useIsNftDetailsPage, useIsNftPage, useIsNftProfilePage } from 'hooks/useIsNftPage'
import { BagFooter } from 'nft/components/bag/BagFooter'
import ListingModal from 'nft/components/bag/profile/ListingModal'
import { Box } from 'nft/components/Box'
import { Portal } from 'nft/components/common/Portal'
import { Column } from 'nft/components/Flex'
import { Overlay } from 'nft/components/modals/Overlay'
import { buttonTextMedium, commonButtonStyles } from 'nft/css/common.css'
import {
  useBag,
  useIsMobile,
  useProfilePageState,
  useSellAsset,
  useSendTransaction,
  useTransactionResponse,
} from 'nft/hooks'
import { fetchRoute } from 'nft/queries'
import { BagItemStatus, BagStatus, ProfilePageStateType, RouteResponse, TxStateType } from 'nft/types'
import {
  buildSellObject,
  fetchPrice,
  formatAssetEventProperties,
  recalculateBagUsingPooledAssets,
  sortUpdatedAssets,
} from 'nft/utils'
import { combineBuyItemsWithTxRoute } from 'nft/utils/txRoute/combineItemsWithTxRoute'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import styled from 'styled-components/macro'
import shallow from 'zustand/shallow'

import * as styles from './Bag.css'
import { BagContent } from './BagContent'
import { BagHeader } from './BagHeader'
import EmptyState from './EmptyContent'
import { ProfileBagContent } from './profile/ProfileBagContent'

interface SeparatorProps {
  top?: boolean
  show?: boolean
}

const DetailsPageBackground = styled.div`
  position: fixed;
  background: rgba(0, 0, 0, 0.7);
  top: 72px;
  width: 100%;
  height: 100%;
`

const ScrollingIndicator = ({ top, show }: SeparatorProps) => (
  <Box
    marginX="16"
    borderWidth="1px"
    borderStyle="solid"
    borderColor="transparent"
    borderTopColor={top ? 'transparent' : 'backgroundOutline'}
    borderBottomColor={top ? 'backgroundOutline' : 'transparent'}
    opacity={show ? '1' : '0'}
    transition="250"
  />
)

const Bag = () => {
  const { account, provider } = useWeb3React()

  const { resetSellAssets, sellAssets } = useSellAsset(
    ({ reset, sellAssets }) => ({
      resetSellAssets: reset,
      sellAssets,
    }),
    shallow
  )

  const { profilePageState, setProfilePageState } = useProfilePageState(
    ({ setProfilePageState, state }) => ({ profilePageState: state, setProfilePageState }),
    shallow
  )

  const {
    bagStatus,
    setBagStatus,
    didOpenUnavailableAssets,
    setDidOpenUnavailableAssets,
    bagIsLocked,
    setLocked,
    reset,
    setItemsInBag,
    bagExpanded,
    toggleBag,
    setTotalEthPrice,
    setTotalUsdPrice,
    setBagExpanded,
  } = useBag((state) => ({ ...state, bagIsLocked: state.isLocked, uncheckedItemsInBag: state.itemsInBag }), shallow)
  const { uncheckedItemsInBag } = useBag(({ itemsInBag }) => ({ uncheckedItemsInBag: itemsInBag }))

  const isProfilePage = useIsNftProfilePage()
  const isDetailsPage = useIsNftDetailsPage()
  const isNFTPage = useIsNftPage()
  const isMobile = useIsMobile()

  const sendTransaction = useSendTransaction((state) => state.sendTransaction)
  const transactionState = useSendTransaction((state) => state.state)
  const setTransactionState = useSendTransaction((state) => state.setState)
  const transactionStateRef = useRef(transactionState)
  const [setTransactionResponse] = useTransactionResponse((state) => [state.setTransactionResponse])

  const queryClient = useQueryClient()

  const itemsInBag = useMemo(() => recalculateBagUsingPooledAssets(uncheckedItemsInBag), [uncheckedItemsInBag])

  const [isOpen, setModalIsOpen] = useState(false)
  const [userCanScroll, setUserCanScroll] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const scrollRef = (node: HTMLDivElement) => {
    if (node !== null) {
      const canScroll = node.scrollHeight > node.clientHeight
      canScroll !== userCanScroll && setUserCanScroll(canScroll)
    }
  }

  const { data: fetchedPriceData } = useQuery(['fetchPrice', {}], () => fetchPrice(), {})

  const { totalEthPrice, totalUsdPrice } = useMemo(() => {
    const totalEthPrice = itemsInBag.reduce(
      (total, item) =>
        item.status !== BagItemStatus.UNAVAILABLE
          ? total.add(
              BigNumber.from(
                item.asset.updatedPriceInfo ? item.asset.updatedPriceInfo.ETHPrice : item.asset.priceInfo.ETHPrice
              )
            )
          : total,
      BigNumber.from(0)
    )
    const totalUsdPrice = fetchedPriceData ? parseFloat(formatEther(totalEthPrice)) * fetchedPriceData : undefined

    return { totalEthPrice, totalUsdPrice }
  }, [itemsInBag, fetchedPriceData])

  const purchaseAssets = async (routingData: RouteResponse) => {
    if (!provider || !routingData) return
    const purchaseResponse = await sendTransaction(
      provider?.getSigner(),
      itemsInBag.filter((item) => item.status !== BagItemStatus.UNAVAILABLE).map((item) => item.asset),
      routingData
    )
    if (
      purchaseResponse &&
      (transactionStateRef.current === TxStateType.Success || transactionStateRef.current === TxStateType.Failed)
    ) {
      setLocked(false)
      setModalIsOpen(false)
      setTransactionResponse(purchaseResponse)
      setBagExpanded({ bagExpanded: false })
      reset()
    }
  }

  const handleCloseBag = useCallback(() => {
    setBagExpanded({ bagExpanded: false, manualClose: true })
  }, [setBagExpanded])

  const fetchAssets = async () => {
    const itemsToBuy = itemsInBag.filter((item) => item.status !== BagItemStatus.UNAVAILABLE).map((item) => item.asset)
    const ethSellObject = buildSellObject(
      itemsToBuy
        .reduce((ethTotal, asset) => ethTotal.add(BigNumber.from(asset.priceInfo.ETHPrice)), BigNumber.from(0))
        .toString()
    )

    didOpenUnavailableAssets && setDidOpenUnavailableAssets(false)
    !bagIsLocked && setLocked(true)
    setBagStatus(BagStatus.FETCHING_ROUTE)
    try {
      const data = await queryClient.fetchQuery(['assetsRoute', ethSellObject, itemsToBuy, account], () =>
        fetchRoute({
          toSell: [ethSellObject],
          toBuy: itemsToBuy,
          senderAddress: account ?? '',
        })
      )

      const updatedAssets = combineBuyItemsWithTxRoute(itemsToBuy, data.route)

      const fetchedPriceChangedAssets = updatedAssets.filter((asset) => asset.updatedPriceInfo).sort(sortUpdatedAssets)
      const fetchedUnavailableAssets = updatedAssets.filter((asset) => asset.isUnavailable)
      const fetchedUnchangedAssets = updatedAssets.filter((asset) => !asset.updatedPriceInfo && !asset.isUnavailable)
      const hasReviewedAssets = fetchedUnchangedAssets.length > 0
      const hasAssetsInReview = fetchedPriceChangedAssets.length > 0
      const hasUnavailableAssets = fetchedUnavailableAssets.length > 0
      const hasAssets = hasReviewedAssets || hasAssetsInReview || hasUnavailableAssets
      const shouldReview = hasAssetsInReview || hasUnavailableAssets

      setItemsInBag([
        ...fetchedUnavailableAssets.map((unavailableAsset) => ({
          asset: unavailableAsset,
          status: BagItemStatus.UNAVAILABLE,
        })),
        ...fetchedPriceChangedAssets.map((changedAsset) => ({
          asset: changedAsset,
          status: BagItemStatus.REVIEWING_PRICE_CHANGE,
        })),
        ...fetchedUnchangedAssets.map((unchangedAsset) => ({ asset: unchangedAsset, status: BagItemStatus.REVIEWED })),
      ])
      setLocked(false)

      if (hasAssets) {
        if (!shouldReview) {
          purchaseAssets(data)
          setBagStatus(BagStatus.CONFIRMING_IN_WALLET)
        } else if (!hasAssetsInReview) setBagStatus(BagStatus.CONFIRM_REVIEW)
        else {
          setBagStatus(BagStatus.IN_REVIEW)
        }
      } else {
        setBagStatus(BagStatus.ADDING_TO_BAG)
      }
    } catch (error) {
      setBagStatus(BagStatus.ADDING_TO_BAG)
    }
  }

  useEffect(() => {
    useSendTransaction.subscribe((state) => (transactionStateRef.current = state.state))
  }, [])

  useEffect(() => {
    if (bagIsLocked && !isOpen) setModalIsOpen(true)
  }, [bagIsLocked, isOpen])

  useEffect(() => {
    if (transactionStateRef.current === TxStateType.Confirming) setBagStatus(BagStatus.PROCESSING_TRANSACTION)
    if (transactionStateRef.current === TxStateType.Denied || transactionStateRef.current === TxStateType.Invalid) {
      if (transactionStateRef.current === TxStateType.Invalid) setBagStatus(BagStatus.WARNING)
      else setBagStatus(BagStatus.CONFIRM_REVIEW)
      setTransactionState(TxStateType.New)

      setLocked(false)
      setModalIsOpen(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionStateRef.current])

  useEffect(() => {
    setTotalEthPrice(totalEthPrice)
    setTotalUsdPrice(totalUsdPrice)
  }, [totalEthPrice, totalUsdPrice, setTotalEthPrice, setTotalUsdPrice])

  const hasAssetsToShow = itemsInBag.length > 0

  const scrollHandler = (event: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = event.currentTarget.scrollTop
    const containerHeight = event.currentTarget.clientHeight
    const scrollHeight = event.currentTarget.scrollHeight

    setScrollProgress(scrollTop ? ((scrollTop + containerHeight) / scrollHeight) * 100 : 0)
  }

  const isBuyingAssets = itemsInBag.length > 0
  const isSellingAssets = sellAssets.length > 0

  const shouldRenderEmptyState = Boolean(
    (!isProfilePage && !isBuyingAssets && bagStatus === BagStatus.ADDING_TO_BAG) || (isProfilePage && !isSellingAssets)
  )

  const eventProperties = useMemo(
    () => ({
      usd_value: totalUsdPrice,
      ...formatAssetEventProperties(itemsInBag.map((item) => item.asset)),
    }),
    [itemsInBag, totalUsdPrice]
  )

  if (!bagExpanded || !isNFTPage) {
    return null
  }

  return (
    <Portal>
      {!(isProfilePage && profilePageState === ProfilePageStateType.LISTING) ? (
        <Column zIndex={isMobile || isOpen ? 'modalOverTooltip' : '3'} className={styles.bagContainer}>
          <BagHeader
            numberOfAssets={isProfilePage ? sellAssets.length : itemsInBag.length}
            closeBag={handleCloseBag}
            resetFlow={isProfilePage ? resetSellAssets : reset}
            isProfilePage={isProfilePage}
          />
          {shouldRenderEmptyState && <EmptyState />}
          <ScrollingIndicator top show={userCanScroll && scrollProgress > 0} />
          <Column ref={scrollRef} className={styles.assetsContainer} onScroll={scrollHandler} gap="12">
            {isProfilePage ? <ProfileBagContent /> : <BagContent />}
          </Column>
          {hasAssetsToShow && !isProfilePage && (
            <BagFooter
              totalEthPrice={totalEthPrice}
              totalUsdPrice={totalUsdPrice}
              bagStatus={bagStatus}
              fetchAssets={fetchAssets}
              eventProperties={eventProperties}
            />
          )}
          {isSellingAssets && isProfilePage && (
            <Box
              marginTop="32"
              marginX="28"
              paddingY="10"
              className={`${buttonTextMedium} ${commonButtonStyles}`}
              backgroundColor="accentAction"
              color="white"
              textAlign="center"
              onClick={() => {
                isMobile && toggleBag()
                setProfilePageState(ProfilePageStateType.LISTING)
              }}
            >
              Continue
            </Box>
          )}
        </Column>
      ) : (
        <Column zIndex={isMobile || isOpen ? 'modalOverTooltip' : '3'} className={styles.bagContainer}>
          <ListingModal />
        </Column>
      )}

      {isDetailsPage ? (
        <DetailsPageBackground onClick={toggleBag} />
      ) : (
        isOpen && <Overlay onClick={() => (!bagIsLocked ? setModalIsOpen(false) : undefined)} />
      )}
    </Portal>
  )
}

export default Bag
