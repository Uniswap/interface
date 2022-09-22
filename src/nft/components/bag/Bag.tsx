import { BigNumber } from '@ethersproject/bignumber'
import { formatEther } from '@ethersproject/units'
import { useWeb3React } from '@web3-react/core'
import { parseEther } from 'ethers/lib/utils'
import { BagFooter } from 'nft/components/bag/BagFooter'
import { BagRow, PriceChangeBagRow, UnavailableAssetsHeaderRow } from 'nft/components/bag/BagRow'
import { Box } from 'nft/components/Box'
import { Portal } from 'nft/components/common/Portal'
import { Center, Column, Row } from 'nft/components/Flex'
import { BagCloseIcon, LargeBagIcon } from 'nft/components/icons'
import { Overlay } from 'nft/components/modals/Overlay'
import { subhead } from 'nft/css/common.css'
import { themeVars } from 'nft/css/sprinkles.css'
import { useBag, useIsMobile, useWalletBalance } from 'nft/hooks'
import { fetchRoute } from 'nft/queries'
import { BagItemStatus, BagStatus } from 'nft/types'
import { buildSellObject } from 'nft/utils/buildSellObject'
import { recalculateBagUsingPooledAssets } from 'nft/utils/calcPoolPrice'
import { fetchPrice } from 'nft/utils/fetchPrice'
import { roundAndPluralize } from 'nft/utils/roundAndPluralize'
import { combineBuyItemsWithTxRoute } from 'nft/utils/txRoute/combineItemsWithTxRoute'
import { sortUpdatedAssets } from 'nft/utils/updatedAssets'
import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import { useLocation } from 'react-router-dom'

import * as styles from './Bag.css'

const EmptyState = () => {
  return (
    <Center height="full">
      <Column gap="12">
        <Center>
          <LargeBagIcon color={themeVars.colors.textTertiary} />
        </Center>
        <Column gap="16">
          <Center className={subhead} style={{ lineHeight: '24px' }}>
            Your bag is empty
          </Center>
          <Center fontSize="12" fontWeight="normal" color="textSecondary" style={{ lineHeight: '16px' }}>
            Selected NFTs will appear here
          </Center>
        </Column>
      </Column>
    </Center>
  )
}

interface SeparatorProps {
  top?: boolean
  show?: boolean
}

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

interface BagHeaderProps {
  numberOfAssets: number
  toggleBag: () => void
  resetFlow: () => void
}

const BagHeader = ({ numberOfAssets, toggleBag, resetFlow }: BagHeaderProps) => {
  return (
    <Column gap="4" paddingX="32" marginBottom="20">
      <Row className={styles.header}>
        My bag
        <Box display="flex" padding="2" color="textSecondary" cursor="pointer" onClick={toggleBag}>
          <BagCloseIcon />
        </Box>
      </Row>
      {numberOfAssets > 0 && (
        <Box fontSize="14" fontWeight="normal" style={{ lineHeight: '20px' }} color="textPrimary">
          {roundAndPluralize(numberOfAssets, 'NFT')} ·{' '}
          <Box
            as="span"
            className={styles.clearAll}
            onClick={() => {
              resetFlow()
            }}
          >
            Clear all
          </Box>
        </Box>
      )}
    </Column>
  )
}

const Bag = () => {
  const { account } = useWeb3React()
  const bagStatus = useBag((s) => s.bagStatus)
  const setBagStatus = useBag((s) => s.setBagStatus)
  const markAssetAsReviewed = useBag((s) => s.markAssetAsReviewed)
  const didOpenUnavailableAssets = useBag((s) => s.didOpenUnavailableAssets)
  const setDidOpenUnavailableAssets = useBag((s) => s.setDidOpenUnavailableAssets)
  const bagIsLocked = useBag((s) => s.isLocked)
  const setLocked = useBag((s) => s.setLocked)
  const reset = useBag((s) => s.reset)
  const uncheckedItemsInBag = useBag((s) => s.itemsInBag)
  const setItemsInBag = useBag((s) => s.setItemsInBag)
  const removeAssetFromBag = useBag((s) => s.removeAssetFromBag)
  const bagExpanded = useBag((s) => s.bagExpanded)
  const toggleBag = useBag((s) => s.toggleBag)

  const { address, balance: balanceInEth, provider } = useWalletBalance()
  const isConnected = !!provider && !!address

  const { pathname } = useLocation()
  const isNFTSellPage = pathname.startsWith('/nfts/sell')
  const isNFTPage = pathname.startsWith('/nfts')
  const shouldShowBag = isNFTPage && !isNFTSellPage
  const isMobile = useIsMobile()

  const queryClient = useQueryClient()

  const itemsInBag = useMemo(() => {
    return recalculateBagUsingPooledAssets(uncheckedItemsInBag)
  }, [uncheckedItemsInBag])

  const ethSellObject = useMemo(
    () =>
      buildSellObject(
        itemsInBag
          .reduce(
            (ethTotal, bagItem) => ethTotal.add(BigNumber.from(bagItem.asset.priceInfo.ETHPrice)),
            BigNumber.from(0)
          )
          .toString()
      ),
    [itemsInBag]
  )

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
  const { data: routingData, refetch } = useQuery(
    ['assetsRoute'],
    () =>
      fetchRoute({
        toSell: [ethSellObject],
        toBuy: itemsInBag.map((item) => item.asset),
        senderAddress: account ?? '',
      }),
    {
      enabled: false,
    }
  )

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

  const { balance, sufficientBalance } = useMemo(() => {
    const balance: BigNumber = parseEther(balanceInEth.toString())
    const sufficientBalance = isConnected ? BigNumber.from(balance).gte(totalEthPrice) : true

    return { balance, sufficientBalance }
  }, [balanceInEth, totalEthPrice, isConnected])

  useEffect(() => {
    if (routingData && bagStatus === BagStatus.FETCHING_ROUTE) {
      const updatedAssets = combineBuyItemsWithTxRoute(
        itemsInBag.map((item) => item.asset),
        routingData.route
      )

      const priceChangedAssets = updatedAssets.filter((asset) => asset.updatedPriceInfo).sort(sortUpdatedAssets)
      const unavailableAssets = updatedAssets.filter((asset) => asset.isUnavailable)
      const unchangedAssets = updatedAssets.filter((asset) => !asset.updatedPriceInfo && !asset.isUnavailable)
      const hasReviewedAssets = unchangedAssets.length > 0
      const hasAssetsInReview = priceChangedAssets.length > 0
      const hasUnavailableAssets = unavailableAssets.length > 0
      const hasAssets = hasReviewedAssets || hasAssetsInReview || hasUnavailableAssets
      const shouldReview = hasAssetsInReview || hasUnavailableAssets

      setItemsInBag([
        ...unavailableAssets.map((unavailableAsset) => ({
          asset: unavailableAsset,
          status: BagItemStatus.UNAVAILABLE,
        })),
        ...priceChangedAssets.map((changedAsset) => ({
          asset: changedAsset,
          status: BagItemStatus.REVIEWING_PRICE_CHANGE,
        })),
        ...unchangedAssets.map((unchangedAsset) => ({ asset: unchangedAsset, status: BagItemStatus.REVIEWED })),
      ])
      setLocked(false)

      if (hasAssets) {
        if (!shouldReview) {
          setBagStatus(BagStatus.CONFIRMING_IN_WALLET)
        } else if (!hasAssetsInReview) setBagStatus(BagStatus.CONFIRM_REVIEW)
        else {
          setBagStatus(BagStatus.IN_REVIEW)
        }
      } else {
        setBagStatus(BagStatus.ADDING_TO_BAG)
      }
    } else if (routingData && bagStatus === BagStatus.FETCHING_FINAL_ROUTE) {
      setBagStatus(BagStatus.CONFIRMING_IN_WALLET)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routingData])

  const { unchangedAssets, priceChangedAssets, unavailableAssets, availableItems } = useMemo(() => {
    const unchangedAssets = itemsInBag
      .filter((item) => item.status === BagItemStatus.ADDED_TO_BAG || item.status === BagItemStatus.REVIEWED)
      .map((item) => item.asset)
    const priceChangedAssets = itemsInBag
      .filter((item) => item.status === BagItemStatus.REVIEWING_PRICE_CHANGE)
      .map((item) => item.asset)
    const unavailableAssets = itemsInBag
      .filter((item) => item.status === BagItemStatus.UNAVAILABLE)
      .map((item) => item.asset)
    const availableItems = itemsInBag.filter((item) => item.status !== BagItemStatus.UNAVAILABLE)

    return { unchangedAssets, priceChangedAssets, unavailableAssets, availableItems }
  }, [itemsInBag])

  useEffect(() => {
    const hasAssetsInReview = priceChangedAssets.length > 0
    const hasUnavailableAssets = unavailableAssets.length > 0
    const hasAssets = itemsInBag.length > 0

    if (bagStatus === BagStatus.ADDING_TO_BAG) {
      isOpen && setModalIsOpen(false)
      queryClient.setQueryData('assetsRoute', undefined)
    }
    if (bagStatus === BagStatus.FETCHING_ROUTE) {
      hasUnavailableAssets && setItemsInBag(itemsInBag.filter((item) => item.status !== BagItemStatus.UNAVAILABLE))
      setLocked(true)
      refetch()
    }
    if (bagStatus === BagStatus.IN_REVIEW && !hasAssetsInReview) {
      queryClient.setQueryData('assetsRoute', undefined)
      if (hasAssets) setBagStatus(BagStatus.CONFIRM_REVIEW)
      else setBagStatus(BagStatus.ADDING_TO_BAG)
    }
    if (bagStatus === BagStatus.FETCHING_FINAL_ROUTE) {
      hasUnavailableAssets && setItemsInBag(itemsInBag.filter((item) => item.status !== BagItemStatus.UNAVAILABLE))
      didOpenUnavailableAssets && setDidOpenUnavailableAssets(false)
      !bagIsLocked && setLocked(true)
      refetch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bagStatus, itemsInBag, priceChangedAssets, unavailableAssets])

  useEffect(() => {
    if (bagIsLocked && !isOpen) setModalIsOpen(true)
  }, [bagIsLocked, isOpen])

  useEffect(() => {
    bagExpanded && toggleBag()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const hasAssetsToShow = itemsInBag.length > 0 || unavailableAssets.length > 0

  const scrollHandler = (event: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = event.currentTarget.scrollTop
    const containerHeight = event.currentTarget.clientHeight
    const scrollHeight = event.currentTarget.scrollHeight

    setScrollProgress(scrollTop ? ((scrollTop + containerHeight) / scrollHeight) * 100 : 0)
  }

  return (
    <>
      {bagExpanded && shouldShowBag ? (
        <Portal>
          <Column className={styles.bagContainer}>
            <BagHeader numberOfAssets={itemsInBag.length} toggleBag={toggleBag} resetFlow={reset} />
            {itemsInBag.length === 0 && bagStatus === BagStatus.ADDING_TO_BAG && <EmptyState />}
            <ScrollingIndicator top show={userCanScroll && scrollProgress > 0} />
            <Column ref={scrollRef} className={styles.assetsContainer} onScroll={scrollHandler} gap="12">
              <Column display={priceChangedAssets.length > 0 || unavailableAssets.length > 0 ? 'flex' : 'none'}>
                {unavailableAssets.length > 0 && (
                  <UnavailableAssetsHeaderRow
                    assets={unavailableAssets}
                    clearUnavailableAssets={() => setItemsInBag(availableItems)}
                    didOpenUnavailableAssets={didOpenUnavailableAssets}
                    setDidOpenUnavailableAssets={setDidOpenUnavailableAssets}
                    isMobile={isMobile}
                  />
                )}
                {priceChangedAssets.map((asset, index) => (
                  <PriceChangeBagRow
                    key={asset.id}
                    asset={asset}
                    markAssetAsReviewed={markAssetAsReviewed}
                    top={index === 0 && unavailableAssets.length === 0}
                    isMobile={isMobile}
                  />
                ))}
              </Column>
              <Column gap="8">
                {unchangedAssets.map((asset) => (
                  <BagRow
                    key={asset.id}
                    asset={asset}
                    removeAsset={removeAssetFromBag}
                    showRemove={true}
                    isMobile={isMobile}
                  />
                ))}
              </Column>
            </Column>
            <ScrollingIndicator show={userCanScroll && scrollProgress < 100} />
            {hasAssetsToShow && (
              <BagFooter
                balance={balance}
                sufficientBalance={sufficientBalance}
                isConnected={isConnected}
                totalEthPrice={totalEthPrice}
                totalUsdPrice={totalUsdPrice}
                bagStatus={bagStatus}
                setBagStatus={setBagStatus}
                fetchReview={() => {
                  setBagStatus(BagStatus.FETCHING_ROUTE)
                }}
                assetsAreInReview={itemsInBag.some((item) => item.status === BagItemStatus.REVIEWING_PRICE_CHANGE)}
              />
            )}
          </Column>
          {isOpen && <Overlay onClick={() => (!bagIsLocked ? setModalIsOpen(false) : undefined)} />}
        </Portal>
      ) : null}
    </>
  )
}

export default Bag
