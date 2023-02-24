import { BigNumber } from '@ethersproject/bignumber'
import { useWeb3React } from '@web3-react/core'
import { GqlRoutingVariant, useGqlRoutingFlag } from 'featureFlags/flags/gqlRouting'
import { useNftRouteLazyQuery } from 'graphql/data/__generated__/types-and-hooks'
import { fetchRoute } from 'nft/queries'
import { BagItem, BagItemStatus, BagStatus, RouteResponse } from 'nft/types'
import { buildNftTradeInputFromBagItems, buildSellObject, sortUpdatedAssets } from 'nft/utils'
import { buildRouteResponse } from 'nft/utils/nftRoute'
import { combineBuyItemsWithTxRoute } from 'nft/utils/txRoute/combineItemsWithTxRoute'
import { useCallback } from 'react'
import { useQueryClient } from 'react-query'
import shallow from 'zustand/shallow'

import { useBag } from './useBag'
import { useTokenInput } from './useTokenInput'

// eslint-disable-next-line import/no-unused-modules
export function useFetchAssets(
  itemsInBag: BagItem[],
  purchaseAssets: (routingData: RouteResponse, purchasingWithErc20: boolean) => Promise<void>
) {
  const { account } = useWeb3React()
  const usingGqlRouting = useGqlRoutingFlag() === GqlRoutingVariant.Enabled

  const {
    setBagStatus,
    didOpenUnavailableAssets,
    setDidOpenUnavailableAssets,
    isLocked: bagIsLocked,
    setLocked: setBagLocked,
    setItemsInBag,
  } = useBag(
    ({ setBagStatus, didOpenUnavailableAssets, setDidOpenUnavailableAssets, isLocked, setLocked, setItemsInBag }) => ({
      setBagStatus,
      didOpenUnavailableAssets,
      setDidOpenUnavailableAssets,
      isLocked,
      setLocked,
      setItemsInBag,
    }),
    shallow
  )
  const tokenTradeInput = useTokenInput((state) => state.tokenTradeInput)

  const queryClient = useQueryClient()
  const [fetchGqlRoute] = useNftRouteLazyQuery()

  return useCallback(async () => {
    const itemsToBuy = itemsInBag.filter((item) => item.status !== BagItemStatus.UNAVAILABLE).map((item) => item.asset)
    const ethSellObject = buildSellObject(
      itemsToBuy
        .reduce((ethTotal, asset) => ethTotal.add(BigNumber.from(asset.priceInfo.ETHPrice)), BigNumber.from(0))
        .toString()
    )

    didOpenUnavailableAssets && setDidOpenUnavailableAssets(false)
    !bagIsLocked && setBagLocked(true)
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
              setBagLocked(false)
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

            setBagLocked(shouldLock)
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
        setBagLocked(false)

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
  }, [
    account,
    bagIsLocked,
    didOpenUnavailableAssets,
    fetchGqlRoute,
    itemsInBag,
    purchaseAssets,
    queryClient,
    setBagLocked,
    setBagStatus,
    setDidOpenUnavailableAssets,
    setItemsInBag,
    tokenTradeInput,
    usingGqlRouting,
  ])
}
