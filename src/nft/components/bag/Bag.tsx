import { BigNumber } from '@ethersproject/bignumber'
import { formatEther } from '@ethersproject/units'
import { useWeb3React } from '@web3-react/core'
import { parseEther } from 'ethers/lib/utils'
import { BagFooter } from 'nft/components/bag/BagFooter'
import ListingModal from 'nft/components/bag/profile/ListingModal'
import { Box } from 'nft/components/Box'
import { Portal } from 'nft/components/common/Portal'
import { Center, Column } from 'nft/components/Flex'
import { LargeBagIcon, LargeTagIcon } from 'nft/components/icons'
import { Overlay } from 'nft/components/modals/Overlay'
import { buttonTextMedium, commonButtonStyles, subhead } from 'nft/css/common.css'
import { themeVars } from 'nft/css/sprinkles.css'
import {
  useBag,
  useIsMobile,
  useProfilePageState,
  useSellAsset,
  useSendTransaction,
  useTransactionResponse,
  useWalletBalance,
} from 'nft/hooks'
import { fetchRoute } from 'nft/queries'
import { BagItemStatus, BagStatus, ProfilePageStateType, RouteResponse, TxStateType } from 'nft/types'
import { buildSellObject } from 'nft/utils/buildSellObject'
import { recalculateBagUsingPooledAssets } from 'nft/utils/calcPoolPrice'
import { fetchPrice } from 'nft/utils/fetchPrice'
import { combineBuyItemsWithTxRoute } from 'nft/utils/txRoute/combineItemsWithTxRoute'
import { sortUpdatedAssets } from 'nft/utils/updatedAssets'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import { useLocation } from 'react-router-dom'

import * as styles from './Bag.css'
import { BagContent } from './BagContent'
import { BagHeader } from './BagHeader'
import { ProfileBagContent } from './profile/ProfileBagContent'

const EmptyState = () => {
  const { pathname } = useLocation()
  const isProfilePage = pathname.startsWith('/profile')

  return (
    <Center height="full">
      <Column gap={isProfilePage ? '16' : '12'}>
        <Center>
          {isProfilePage ? (
            <LargeTagIcon color={themeVars.colors.textTertiary} />
          ) : (
            <LargeBagIcon color={themeVars.colors.textTertiary} />
          )}
        </Center>
        {isProfilePage ? (
          <span className={subhead}>No NFTs Selected</span>
        ) : (
          <Column gap="16">
            <Center className={subhead} style={{ lineHeight: '24px' }}>
              Your bag is empty
            </Center>
            <Center fontSize="12" fontWeight="normal" color="textSecondary" style={{ lineHeight: '16px' }}>
              Selected NFTs will appear here
            </Center>
          </Column>
        )}
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

const Bag = () => {
  const { account } = useWeb3React()
  const bagStatus = useBag((s) => s.bagStatus)
  const setBagStatus = useBag((s) => s.setBagStatus)
  const didOpenUnavailableAssets = useBag((s) => s.didOpenUnavailableAssets)
  const setDidOpenUnavailableAssets = useBag((s) => s.setDidOpenUnavailableAssets)
  const bagIsLocked = useBag((s) => s.isLocked)
  const setLocked = useBag((s) => s.setLocked)
  const reset = useBag((s) => s.reset)
  const resetSellAssets = useSellAsset((state) => state.reset)
  const sellAssets = useSellAsset((state) => state.sellAssets)
  const setProfilePageState = useProfilePageState((state) => state.setProfilePageState)
  const profilePageState = useProfilePageState((state) => state.state)
  const uncheckedItemsInBag = useBag((s) => s.itemsInBag)
  const setItemsInBag = useBag((s) => s.setItemsInBag)
  const bagExpanded = useBag((s) => s.bagExpanded)
  const toggleBag = useBag((s) => s.toggleBag)
  const setTotalEthPrice = useBag((s) => s.setTotalEthPrice)
  const setTotalUsdPrice = useBag((s) => s.setTotalUsdPrice)

  const { address, balance: balanceInEth, provider } = useWalletBalance()
  const isConnected = !!provider && !!address

  const { pathname } = useLocation()
  const isProfilePage = pathname.startsWith('/profile')
  const isNFTPage = pathname.startsWith('/nfts')
  const shouldShowBag = isNFTPage || isProfilePage
  const isMobile = useIsMobile()

  const sendTransaction = useSendTransaction((state) => state.sendTransaction)
  const transactionState = useSendTransaction((state) => state.state)
  const setTransactionState = useSendTransaction((state) => state.setState)
  const transactionStateRef = useRef(transactionState)
  const [setTransactionResponse] = useTransactionResponse((state) => [state.setTransactionResponse])

  const queryClient = useQueryClient()

  const itemsInBag = useMemo(() => {
    return recalculateBagUsingPooledAssets(uncheckedItemsInBag)
  }, [uncheckedItemsInBag])

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

  const { balance, sufficientBalance } = useMemo(() => {
    const balance: BigNumber = parseEther(balanceInEth.toString())
    const sufficientBalance = isConnected ? BigNumber.from(balance).gte(totalEthPrice) : true

    return { balance, sufficientBalance }
  }, [balanceInEth, totalEthPrice, isConnected])

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
      bagExpanded && toggleBag()
      reset()
    }
  }

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
    bagExpanded && toggleBag()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

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

  return (
    <>
      {bagExpanded && shouldShowBag ? (
        <Portal>
          <Column zIndex={isMobile || isOpen ? 'modal' : '3'} className={styles.bagContainer}>
            {!(isProfilePage && profilePageState === ProfilePageStateType.LISTING) ? (
              <>
                <BagHeader
                  numberOfAssets={isProfilePage ? sellAssets.length : itemsInBag.length}
                  toggleBag={toggleBag}
                  resetFlow={isProfilePage ? resetSellAssets : reset}
                  isProfilePage={isProfilePage}
                />
                {(!isProfilePage && itemsInBag.length === 0 && bagStatus === BagStatus.ADDING_TO_BAG) ||
                  (isProfilePage && sellAssets.length === 0 && <EmptyState />)}
                <ScrollingIndicator top show={userCanScroll && scrollProgress > 0} />
                <Column ref={scrollRef} className={styles.assetsContainer} onScroll={scrollHandler} gap="12">
                  {isProfilePage ? <ProfileBagContent /> : <BagContent />}
                </Column>
                <ScrollingIndicator show={userCanScroll && scrollProgress < 100} />
                {hasAssetsToShow && !isProfilePage && (
                  <BagFooter
                    balance={balance}
                    sufficientBalance={sufficientBalance}
                    isConnected={isConnected}
                    totalEthPrice={totalEthPrice}
                    totalUsdPrice={totalUsdPrice}
                    bagStatus={bagStatus}
                    fetchAssets={fetchAssets}
                    assetsAreInReview={itemsInBag.some((item) => item.status === BagItemStatus.REVIEWING_PRICE_CHANGE)}
                  />
                )}
                {sellAssets.length !== 0 && isProfilePage && (
                  <Box
                    marginTop="32"
                    marginX="28"
                    paddingY="10"
                    className={`${buttonTextMedium} ${commonButtonStyles}`}
                    backgroundColor="accentAction"
                    textAlign="center"
                    onClick={() => {
                      isMobile && toggleBag()
                      setProfilePageState(ProfilePageStateType.LISTING)
                    }}
                  >
                    Continue
                  </Box>
                )}
              </>
            ) : (
              <ListingModal />
            )}
          </Column>
          {isOpen && <Overlay onClick={() => (!bagIsLocked ? setModalIsOpen(false) : undefined)} />}
        </Portal>
      ) : null}
    </>
  )
}

export default Bag
