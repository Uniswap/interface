import { useWeb3React } from '@web3-react/core'
import { useNftRouteLazyQuery } from 'graphql/data/__generated__/types-and-hooks'
import { BagStatus, GenieAsset } from 'nft/types'
import {
  buildNftTradeInput,
  buildNftTradeInputFromBagItems,
  filterUpdatedAssetsByState,
  recalculateBagUsingPooledAssets,
} from 'nft/utils'
import { getNextBagState, getPurchasableAssets } from 'nft/utils/bag'
import { buildRouteResponse } from 'nft/utils/nftRoute'
import { compareAssetsWithTransactionRoute } from 'nft/utils/txRoute/combineItemsWithTxRoute'
import { useCallback, useMemo, useState } from 'react'
import { shallow } from 'zustand/shallow'

import { useBag } from './useBag'
import { usePurchaseAssets } from './usePurchaseAssets'
import { useTokenInput } from './useTokenInput'

export function useFetchAssets(): () => Promise<void> {
  const { account } = useWeb3React()

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

  const [fetchGqlRoute] = useNftRouteLazyQuery()
  const purchaseAssets = usePurchaseAssets()

  const resetStateBeforeFetch = useCallback(() => {
    didOpenUnavailableAssets && setDidOpenUnavailableAssets(false)
    !bagIsLocked && setBagLocked(true)
    setBagStatus(BagStatus.FETCHING_ROUTE)
  }, [bagIsLocked, didOpenUnavailableAssets, setBagLocked, setBagStatus, setDidOpenUnavailableAssets])

  return useCallback(async () => {
    resetStateBeforeFetch()

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
  }, [
    account,
    fetchGqlRoute,
    itemsInBag,
    purchaseAssets,
    resetStateBeforeFetch,
    setBagLocked,
    setBagStatus,
    setItemsInBag,
    tokenTradeInput,
  ])
}

export const useBuyAssetCallback = () => {
  const { account } = useWeb3React()
  const [fetchGqlRoute] = useNftRouteLazyQuery()
  const purchaseAssets = usePurchaseAssets()

  const [isLoading, setIsLoading] = useState(false)

  const fetchAndPurchaseSingleAsset = useCallback(
    async (asset: GenieAsset) => {
      setIsLoading(true)

      fetchGqlRoute({
        variables: {
          senderAddress: account ? account : '',
          nftTrades: buildNftTradeInput([asset]),
          tokenTrades: undefined,
        },
        pollInterval: 0,
        fetchPolicy: 'no-cache',
        onCompleted: (data) => {
          setIsLoading(false)

          if (!data.nftRoute || !data.nftRoute.route) {
            return
          }

          const { route, routeResponse } = buildRouteResponse(data.nftRoute, false)
          const { updatedAssets } = compareAssetsWithTransactionRoute([asset], route)
          const { priceChanged, unavailable } = filterUpdatedAssetsByState(updatedAssets)
          const invalidData = priceChanged.length > 0 || unavailable.length > 0

          if (invalidData) {
            return
          }

          purchaseAssets(routeResponse, updatedAssets, false)
        },
      })
    },
    [account, fetchGqlRoute, purchaseAssets]
  )

  return useMemo(() => ({ fetchAndPurchaseSingleAsset, isLoading }), [fetchAndPurchaseSingleAsset, isLoading])
}
