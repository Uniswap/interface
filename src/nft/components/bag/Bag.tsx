import { BigNumber } from '@ethersproject/bignumber'
import { formatEther } from '@ethersproject/units'
import { sendAnalyticsEvent } from '@uniswap/analytics'
import { NFTEventName } from '@uniswap/analytics-events'
import { useWeb3React } from '@web3-react/core'
import { NftListV2Variant, useNftListV2Flag } from 'featureFlags/flags/nftListV2'
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
import { BagItem, BagItemStatus, BagStatus, BagView, ProfilePageStateType, RouteResponse, TxStateType } from 'nft/types'
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
import { Z_INDEX } from 'theme/zIndex'
import shallow from 'zustand/shallow'

import * as styles from './Bag.css'
import { BagContent } from './BagContent'
import { BagHeader } from './BagHeader'
import EmptyState from './EmptyContent'
import { ProfileBagContent } from './profile/ProfileBagContent'
import { SaveForLaterContent } from './SaveForLaterContent'

export const BAG_WIDTH = 320
export const XXXL_BAG_WIDTH = 360

interface SeparatorProps {
  top?: boolean
  show?: boolean
}

const BagContainer = styled.div<{ raiseZIndex: boolean }>`
  position: fixed;
  display: flex;
  flex-direction: column;
  top: 88px;
  right: 20px;
  width: ${BAG_WIDTH}px;
  height: calc(100vh - 108px);
  background: ${({ theme }) => theme.backgroundSurface};
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 16px;
  box-shadow: ${({ theme }) => theme.shallowShadow};
  z-index: ${({ raiseZIndex }) => (raiseZIndex ? Z_INDEX.modalOverTooltip : 3)};

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    right: 0px;
    top: 0px;
    width: 100%;
    height: 100%;
    border-radius: 0px;
    border: none;
  }

  @media only screen and (min-width: ${({ theme }) => `${theme.breakpoint.xxxl}px`}) {
    width: ${XXXL_BAG_WIDTH}px;
  }
`

const DetailsPageBackground = styled.div`
  position: fixed;
  background: rgba(0, 0, 0, 0.7);
  top: 0px;
  width: 100%;
  height: 100%;
`

const ScrollingIndicator = ({ top, show }: SeparatorProps) => (
  <Box
    marginX="24"
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
    activeBagView,
    setActiveBagView,
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
    removeAssetsFromBag,
  } = useBag((state) => ({ ...state, bagIsLocked: state.isLocked, uncheckedItemsInBag: state.itemsInBag }), shallow)
  const { uncheckedItemsInBag } = useBag(({ itemsInBag }) => ({ uncheckedItemsInBag: itemsInBag }))

  const isProfilePage = useIsNftProfilePage()
  const isDetailsPage = useIsNftDetailsPage()
  const isNFTPage = useIsNftPage()
  const isMobile = useIsMobile()
  const isNftListV2 = useNftListV2Flag() === NftListV2Variant.Enabled

  const sendTransaction = useSendTransaction((state) => state.sendTransaction)
  const transactionState = useSendTransaction((state) => state.state)
  const setTransactionState = useSendTransaction((state) => state.setState)
  const transactionStateRef = useRef(transactionState)
  const [setTransactionResponse] = useTransactionResponse((state) => [state.setTransactionResponse])

  const queryClient = useQueryClient()

  const itemsInBag = useMemo(() => recalculateBagUsingPooledAssets(uncheckedItemsInBag), [uncheckedItemsInBag])

  const [isModalOpen, setModalIsOpen] = useState(false)
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
        item.status !== BagItemStatus.UNAVAILABLE && item.status !== BagItemStatus.SAVED_FOR_LATER
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
      itemsInBag
        .filter((item) => item.status !== BagItemStatus.UNAVAILABLE && item.status !== BagItemStatus.SAVED_FOR_LATER)
        .map((item) => item.asset),
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
    setActiveBagView(isProfilePage ? BagView.SELL : BagView.MAIN)
  }, [setBagExpanded, setActiveBagView, isProfilePage])

  const fetchAssets = async () => {
    const itemsToBuy = itemsInBag
      .filter((item) => item.status !== BagItemStatus.UNAVAILABLE && item.status !== BagItemStatus.SAVED_FOR_LATER)
      .map((item) => item.asset)
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
        ...itemsInBag.filter((item) => item.status === BagItemStatus.SAVED_FOR_LATER),
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
    if (bagIsLocked && !isModalOpen) setModalIsOpen(true)
  }, [bagIsLocked, isModalOpen])

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

  const scrollHandler = (event: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = event.currentTarget.scrollTop
    const containerHeight = event.currentTarget.clientHeight
    const scrollHeight = event.currentTarget.scrollHeight

    setScrollProgress(scrollTop ? ((scrollTop + containerHeight) / scrollHeight) * 100 : 0)
  }

  useEffect(() => {
    setActiveBagView(isProfilePage ? BagView.SELL : BagView.MAIN)
  }, [setActiveBagView, isProfilePage])

  const isSavedForLater = (item: BagItem) => {
    return item.status === BagItemStatus.SAVED_FOR_LATER
  }

  const getNumberOfAssets = () => {
    switch (activeBagView) {
      case BagView.SELL:
        return sellAssets.length
      case BagView.MAIN:
        return itemsInBag.filter((item) => !isSavedForLater(item)).length
      case BagView.SAVE_FOR_LATER:
        return itemsInBag.filter(isSavedForLater).length
      default:
        return 0
    }
  }

  const resetFlow = () => {
    switch (activeBagView) {
      case BagView.SELL:
        resetSellAssets()
        break
      case BagView.MAIN:
        removeAssetsFromBag(itemsInBag.filter((item) => !isSavedForLater(item)).map((item) => item.asset))
        break
      case BagView.SAVE_FOR_LATER:
        removeAssetsFromBag(
          itemsInBag.filter((item) => item.status === BagItemStatus.SAVED_FOR_LATER).map((item) => item.asset)
        )
        break
      default:
        break
    }
  }

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
      <BagContainer data-testid="nft-bag" raiseZIndex={isMobile || isModalOpen}>
        {!(isProfilePage && profilePageState === ProfilePageStateType.LISTING) ? (
          <>
            <BagHeader
              bagViews={isProfilePage ? [BagView.SELL] : [BagView.MAIN, BagView.SAVE_FOR_LATER]}
              activeBagView={activeBagView}
              numberOfAssets={getNumberOfAssets()}
              changeBagView={(view) => setActiveBagView(view)}
              closeBag={handleCloseBag}
              resetFlow={resetFlow}
            />
            <ScrollingIndicator top show={userCanScroll && scrollProgress > 0} />
            {getNumberOfAssets() === 0 ? (
              <EmptyState />
            ) : (
              <>
                <Column ref={scrollRef} className={styles.assetsContainer} onScroll={scrollHandler} gap="12">
                  {
                    {
                      [BagView.SELL]: <ProfileBagContent />,
                      [BagView.MAIN]: <BagContent />,
                      [BagView.SAVE_FOR_LATER]: <SaveForLaterContent />,
                    }[activeBagView]
                  }
                </Column>
                {(activeBagView === BagView.SELL && (
                  <Box
                    marginTop="32"
                    marginX="28"
                    marginBottom="16"
                    paddingY="10"
                    className={`${buttonTextMedium} ${commonButtonStyles}`}
                    backgroundColor="accentAction"
                    color="white"
                    textAlign="center"
                    onClick={() => {
                      ;(isMobile || isNftListV2) && toggleBag()
                      setProfilePageState(ProfilePageStateType.LISTING)
                      sendAnalyticsEvent(NFTEventName.NFT_PROFILE_PAGE_START_SELL, {
                        list_quantity: sellAssets.length,
                        collection_addresses: sellAssets.map((asset) => asset.asset_contract.address),
                        token_ids: sellAssets.map((asset) => asset.tokenId),
                      })
                    }}
                  >
                    Continue
                  </Box>
                )) ||
                  (activeBagView === BagView.MAIN && (
                    <BagFooter
                      totalEthPrice={totalEthPrice}
                      totalUsdPrice={totalUsdPrice}
                      bagStatus={bagStatus}
                      fetchAssets={fetchAssets}
                      eventProperties={eventProperties}
                    />
                  ))}
              </>
            )}
          </>
        ) : (
          <ListingModal />
        )}
      </BagContainer>

      {isDetailsPage ? (
        <DetailsPageBackground onClick={toggleBag} />
      ) : (
        isModalOpen && <Overlay onClick={() => (!bagIsLocked ? setModalIsOpen(false) : undefined)} />
      )}
    </Portal>
  )
}

export default Bag
