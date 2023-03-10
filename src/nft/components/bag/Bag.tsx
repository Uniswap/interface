import { BigNumber } from '@ethersproject/bignumber'
import { Trans } from '@lingui/macro'
import { sendAnalyticsEvent } from '@uniswap/analytics'
import { NFTEventName } from '@uniswap/analytics-events'
import { useWeb3React } from '@web3-react/core'
import { GqlRoutingVariant, useGqlRoutingFlag } from 'featureFlags/flags/gqlRouting'
import { useNftRouteLazyQuery } from 'graphql/data/__generated__/types-and-hooks'
import { useIsNftDetailsPage, useIsNftPage, useIsNftProfilePage } from 'hooks/useIsNftPage'
import { BagFooter } from 'nft/components/bag/BagFooter'
import { Box } from 'nft/components/Box'
import { Portal } from 'nft/components/common/Portal'
import { Column } from 'nft/components/Flex'
import { Overlay } from 'nft/components/modals/Overlay'
import {
  useBag,
  useIsMobile,
  useProfilePageState,
  useSellAsset,
  useSendTransaction,
  useTransactionResponse,
} from 'nft/hooks'
import { useTokenInput } from 'nft/hooks/useTokenInput'
import { fetchRoute } from 'nft/queries'
import { BagItemStatus, BagStatus, ProfilePageStateType, RouteResponse, TxStateType } from 'nft/types'
import {
  buildNftTradeInputFromBagItems,
  buildSellObject,
  formatAssetEventProperties,
  recalculateBagUsingPooledAssets,
  sortUpdatedAssets,
} from 'nft/utils'
import { buildRouteResponse } from 'nft/utils/nftRoute'
import { combineBuyItemsWithTxRoute } from 'nft/utils/txRoute/combineItemsWithTxRoute'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from 'react-query'
import styled from 'styled-components/macro'
import { Z_INDEX } from 'theme/zIndex'
import shallow from 'zustand/shallow'

import * as styles from './Bag.css'
import { BagContent } from './BagContent'
import { BagHeader } from './BagHeader'
import EmptyState from './EmptyContent'
import { ProfileBagContent } from './profile/ProfileBagContent'

export const BAG_WIDTH = 320
export const XXXL_BAG_WIDTH = 360

interface SeparatorProps {
  top?: boolean
  show?: boolean
}

const BagContainer = styled.div<{ raiseZIndex: boolean; isProfilePage: boolean }>`
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
  z-index: ${({ raiseZIndex, isProfilePage }) =>
    raiseZIndex ? (isProfilePage ? Z_INDEX.modalOverTooltip : Z_INDEX.modalBackdrop - 1) : 3};

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

const ContinueButton = styled.div`
  background: ${({ theme }) => theme.accentAction};
  color: ${({ theme }) => theme.accentTextLightPrimary};
  margin: 32px 28px 16px;
  padding: 10px 0px;
  border-radius: 12px;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  cursor: pointer;
  transition: ${({ theme }) => theme.transition.duration.medium};

  :hover {
    opacity: ${({ theme }) => theme.opacity.hover};
  }
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

  const { setProfilePageState } = useProfilePageState(({ setProfilePageState }) => ({ setProfilePageState }))

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
    setBagExpanded,
  } = useBag((state) => ({ ...state, bagIsLocked: state.isLocked, uncheckedItemsInBag: state.itemsInBag }), shallow)
  const { uncheckedItemsInBag } = useBag(({ itemsInBag }) => ({ uncheckedItemsInBag: itemsInBag }))

  const isProfilePage = useIsNftProfilePage()
  const isDetailsPage = useIsNftDetailsPage()
  const isNFTPage = useIsNftPage()
  const isMobile = useIsMobile()
  const usingGqlRouting = useGqlRoutingFlag() === GqlRoutingVariant.Enabled

  const sendTransaction = useSendTransaction((state) => state.sendTransaction)
  const transactionState = useSendTransaction((state) => state.state)
  const setTransactionState = useSendTransaction((state) => state.setState)
  const transactionStateRef = useRef(transactionState)
  const [setTransactionResponse] = useTransactionResponse((state) => [state.setTransactionResponse])
  const tokenTradeInput = useTokenInput((state) => state.tokenTradeInput)

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

  const { totalEthPrice } = useMemo(() => {
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

    return { totalEthPrice }
  }, [itemsInBag])

  const purchaseAssets = async (routingData: RouteResponse, purchasingWithErc20: boolean) => {
    if (!provider || !routingData) return
    const purchaseResponse = await sendTransaction(
      provider?.getSigner(),
      itemsInBag.filter((item) => item.status !== BagItemStatus.UNAVAILABLE).map((item) => item.asset),
      routingData,
      purchasingWithErc20
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

  const [fetchGqlRoute] = useNftRouteLazyQuery()

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
      if (usingGqlRouting) {
        fetchGqlRoute({
          variables: {
            senderAddress: usingGqlRouting && account ? account : '',
            nftTrades: usingGqlRouting ? buildNftTradeInputFromBagItems(itemsInBag) : [],
            tokenTrades: tokenTradeInput ? tokenTradeInput : undefined,
          },
          onCompleted: (data) => {
            if (!data.nftRoute || !data.nftRoute.route) {
              setBagStatus(BagStatus.ADDING_TO_BAG)
              setLocked(false)
              return
            }

            const purchasingWithErc20 = !!tokenTradeInput
            const { route, routeResponse } = buildRouteResponse(data.nftRoute, purchasingWithErc20)

            const { hasPriceAdjustment, updatedAssets } = combineBuyItemsWithTxRoute(itemsToBuy, route)
            const shouldRefetchCalldata = hasPriceAdjustment && purchasingWithErc20

            const fetchedPriceChangedAssets = updatedAssets
              .filter((asset) => asset.updatedPriceInfo)
              .sort(sortUpdatedAssets)
            const fetchedUnavailableAssets = updatedAssets.filter((asset) => asset.isUnavailable)
            const fetchedUnchangedAssets = updatedAssets.filter(
              (asset) => !asset.updatedPriceInfo && !asset.isUnavailable
            )
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
              ...fetchedUnchangedAssets.map((unchangedAsset) => ({
                asset: unchangedAsset,
                status: BagItemStatus.REVIEWED,
              })),
            ])

            let shouldLock = false

            if (hasAssets) {
              if (!shouldReview) {
                if (shouldRefetchCalldata) {
                  setBagStatus(BagStatus.CONFIRM_QUOTE)
                } else {
                  purchaseAssets(routeResponse, purchasingWithErc20)
                  setBagStatus(BagStatus.CONFIRMING_IN_WALLET)
                  shouldLock = true
                }
              } else if (!hasAssetsInReview) setBagStatus(BagStatus.CONFIRM_REVIEW)
              else {
                setBagStatus(BagStatus.IN_REVIEW)
              }
            } else {
              setBagStatus(BagStatus.ADDING_TO_BAG)
            }

            setLocked(shouldLock)
          },
        })
      } else {
        const routeData = await queryClient.fetchQuery(['assetsRoute', ethSellObject, itemsToBuy, account], () =>
          fetchRoute({
            toSell: [ethSellObject],
            toBuy: itemsToBuy,
            senderAddress: account ?? '',
          })
        )

        const { updatedAssets } = combineBuyItemsWithTxRoute(itemsToBuy, routeData.route)

        const fetchedPriceChangedAssets = updatedAssets
          .filter((asset) => asset.updatedPriceInfo)
          .sort(sortUpdatedAssets)
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
          ...fetchedUnchangedAssets.map((unchangedAsset) => ({
            asset: unchangedAsset,
            status: BagItemStatus.REVIEWED,
          })),
        ])
        setLocked(false)

        if (hasAssets) {
          if (!shouldReview) {
            purchaseAssets(routeData, false)
            setBagStatus(BagStatus.CONFIRMING_IN_WALLET)
          } else if (!hasAssetsInReview) setBagStatus(BagStatus.CONFIRM_REVIEW)
          else {
            setBagStatus(BagStatus.IN_REVIEW)
          }
        } else {
          setBagStatus(BagStatus.ADDING_TO_BAG)
        }
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
  }, [totalEthPrice, setTotalEthPrice])

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
      ...formatAssetEventProperties(itemsInBag.map((item) => item.asset)),
    }),
    [itemsInBag]
  )

  if (!bagExpanded || !isNFTPage) {
    return null
  }

  return (
    <Portal>
      <BagContainer data-testid="nft-bag" raiseZIndex={isMobile || isModalOpen} isProfilePage={isProfilePage}>
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
          <BagFooter totalEthPrice={totalEthPrice} fetchAssets={fetchAssets} eventProperties={eventProperties} />
        )}
        {isSellingAssets && isProfilePage && (
          <ContinueButton
            onClick={() => {
              toggleBag()
              setProfilePageState(ProfilePageStateType.LISTING)
              sendAnalyticsEvent(NFTEventName.NFT_PROFILE_PAGE_START_SELL, {
                list_quantity: sellAssets.length,
                collection_addresses: sellAssets.map((asset) => asset.asset_contract.address),
                token_ids: sellAssets.map((asset) => asset.tokenId),
              })
            }}
          >
            <Trans>Continue</Trans>
          </ContinueButton>
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
