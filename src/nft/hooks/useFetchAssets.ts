import { BigNumber } from '@ethersproject/bignumber'
import { useWeb3React } from '@web3-react/core'
import { GqlRoutingVariant, useGqlRoutingFlag } from 'featureFlags/flags/gqlRouting'
import { useNftRouteLazyQuery } from 'graphql/data/__generated__/types-and-hooks'
import { fetchRoute } from 'nft/queries'
import { BagItemStatus, BagStatus } from 'nft/types'
import {
  buildNftTradeInputFromBagItems,
  buildSellObject,
  recalculateBagUsingPooledAssets,
  sortUpdatedAssets,
} from 'nft/utils'
import { getNextBagState, getPurchasableAssets } from 'nft/utils/bag'
import { buildRouteResponse } from 'nft/utils/nftRoute'
import { compareAssetsWithTransactionRoute } from 'nft/utils/txRoute/combineItemsWithTxRoute'
import { useCallback, useMemo } from 'react'
import { useQueryClient } from 'react-query'
import shallow from 'zustand/shallow'

import { useBag } from './useBag'
import { usePurchaseAssets } from './usePurchaseAssets'
import { useTokenInput } from './useTokenInput'

export function useFetchAssets(): () => Promise<void> {
  const { account } = useWeb3React()
  const usingGqlRouting = useGqlRoutingFlag() === GqlRoutingVariant.Enabled

  const {
    itemsInBag: uncheckedItemsInBag,
    setBagStatus,
    didOpenUnavailableAssets,
    setDidOpenUnavailableAssets,
    isLocked: bagIsLocked,
    setLocked: setBagLocked,
    setItemsInBag,
  } = useBag(
    ({
      itemsInBag,
      setBagStatus,
      didOpenUnavailableAssets,
      setDidOpenUnavailableAssets,
      isLocked,
      setLocked,
      setItemsInBag,
    }) => ({
      itemsInBag,
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
  const itemsInBag = useMemo(() => recalculateBagUsingPooledAssets(uncheckedItemsInBag), [uncheckedItemsInBag])

  const queryClient = useQueryClient()
  const [fetchGqlRoute] = useNftRouteLazyQuery()
  const purchaseAssets = usePurchaseAssets()

  const resetStateBeforeFetch = useCallback(() => {
    didOpenUnavailableAssets && setDidOpenUnavailableAssets(false)
    !bagIsLocked && setBagLocked(true)
    setBagStatus(BagStatus.FETCHING_ROUTE)
  }, [bagIsLocked, didOpenUnavailableAssets, setBagLocked, setBagStatus, setDidOpenUnavailableAssets])

  return useCallback(async () => {
    resetStateBeforeFetch()

    if (usingGqlRouting) {
      fetchGqlRoute({
        variables: {
          senderAddress: account ? account : '',
          nftTrades: buildNftTradeInputFromBagItems(itemsInBag),
          tokenTrades: tokenTradeInput ? tokenTradeInput : undefined,
        },
        onCompleted: (data) => {
          if (!data.nftRoute || !data.nftRoute.route) {
            setBagStatus(BagStatus.ADDING_TO_BAG)
            setBagLocked(false)
            return
          }

          const wishAssetsToBuy = getPurchasableAssets(itemsInBag)
          const purchasingWithErc20 = !!tokenTradeInput
          const { route, routeResponse } = buildRouteResponse(data.nftRoute, purchasingWithErc20)

          const { newBagItems, nextBagStatus } = getNextBagState(wishAssetsToBuy, route, purchasingWithErc20)

          setItemsInBag(newBagItems)
          setBagStatus(nextBagStatus)

          if (nextBagStatus === BagStatus.CONFIRMING_IN_WALLET) {
            purchaseAssets(routeResponse, wishAssetsToBuy, purchasingWithErc20)
            setBagLocked(true)
            return
          }

          setBagLocked(false)
        },
      })
    } else {
      try {
        const assetsToBuy = getPurchasableAssets(itemsInBag)
        const ethSellObject = buildSellObject(
          assetsToBuy
            .reduce((ethTotal, asset) => ethTotal.add(BigNumber.from(asset.priceInfo.ETHPrice)), BigNumber.from(0))
            .toString()
        )
        const routeData = await queryClient.fetchQuery(['assetsRoute', ethSellObject, assetsToBuy, account], () =>
          fetchRoute({
            toSell: [ethSellObject],
            toBuy: assetsToBuy,
            senderAddress: account ?? '',
          })
        )

        const { updatedAssets } = compareAssetsWithTransactionRoute(assetsToBuy, routeData.route)

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
            purchaseAssets(routeData, assetsToBuy)
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
  }, [
    account,
    fetchGqlRoute,
    itemsInBag,
    purchaseAssets,
    queryClient,
    resetStateBeforeFetch,
    setBagLocked,
    setBagStatus,
    setItemsInBag,
    tokenTradeInput,
    usingGqlRouting,
  ])
}
