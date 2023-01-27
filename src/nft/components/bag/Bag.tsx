import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import type { JsonRpcSigner } from '@ethersproject/providers'
import { formatEther } from '@ethersproject/units'
import { Trans } from '@lingui/macro'
import { ItemType } from '@opensea/seaport-js/lib/constants'
import { sendAnalyticsEvent } from '@uniswap/analytics'
import { NFTEventName } from '@uniswap/analytics-events'
import { useWeb3React } from '@web3-react/core'
import { NftListV2Variant, useNftListV2Flag } from 'featureFlags/flags/nftListV2'
import useENSAddress from 'hooks/useENSAddress'
import { useIsNftDetailsPage, useIsNftPage, useIsNftProfilePage } from 'hooks/useIsNftPage'
import { BagFooter } from 'nft/components/bag/BagFooter'
import ListingModal from 'nft/components/bag/profile/ListingModal'
import { Box } from 'nft/components/Box'
import { Portal } from 'nft/components/common/Portal'
import { Column, Row } from 'nft/components/Flex'
import { Overlay } from 'nft/components/modals/Overlay'
import { buttonTextMedium, commonButtonStyles } from 'nft/css/common.css'
import {
  ProfileMethod,
  useBag,
  useIsMobile,
  useNFTList,
  useProfilePageState,
  useSellAsset,
  useSendTransaction,
  useTransactionResponse,
} from 'nft/hooks'
import { fetchRoute } from 'nft/queries'
import { OPENSEA_DEFAULT_CROSS_CHAIN_CONDUIT_KEY } from 'nft/queries/openSea'
import {
  AssetRow,
  BagItemStatus,
  BagStatus,
  ListingStatus,
  ProfilePageStateType,
  RouteResponse,
  TxStateType,
  WalletAsset,
} from 'nft/types'
import {
  approveCollection,
  buildSellObject,
  delay,
  fetchPrice,
  formatAssetEventProperties,
  recalculateBagUsingPooledAssets,
  sortUpdatedAssets,
} from 'nft/utils'
import { combineBuyItemsWithTxRoute } from 'nft/utils/txRoute/combineItemsWithTxRoute'
import { Dispatch, FormEvent, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { Z_INDEX } from 'theme/zIndex'
import { isAddress } from 'utils'
import shallow from 'zustand/shallow'

import ERC721 from '../../../abis/erc721.json'
import OpenseaTransferHelperAbi from '../../../abis/opensea-transfer-helper.json'
import {
  OpenseaTransferHelper as OpenseaTransferHelperContext,
  UnsellableLossBurn as UnsellableLossBurnContext,
} from '../../../abis/types/index'
import UnsellableLossBurnAbi from '../../../abis/unsellable-loss-burn.json'
import { Checkbox } from '../layout/Checkbox'
import { ListModal } from '../profile/list/Modal/ListModal'
import * as styles from './Bag.css'
import { BagContent } from './BagContent'
import { BagHeader } from './BagHeader'
import EmptyState from './EmptyContent'
import { ProfileBagContent } from './profile/ProfileBagContent'
import { updateStatus } from './profile/utils'

export const BAG_WIDTH = 320
export const XXXL_BAG_WIDTH = 360
export const SEND_CONTRACT_ADDRESS = '0x0000000000c2d145a2526bd8c716263bfebe1a72'
export const SEND_CONTRACT_CONDUIT_ADDRESS = '0x1e0049783f008a0085193e00003d00cd54003c71'
export const LOSSBURN_CONTRACT_ADDRESS = '0x2e5749c2ffe9d4299d8eea18f90e5f6f00adf8b0'
export const BURN_ADDRESS = '0x0000000000000000000000000000000000000000'
export const BURN_ADDRESS_HAYDEN = '0x50EC05ADe8280758E2077fcBC08D878D4aef79C3'

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

async function sendAssets(
  assets: WalletAsset[],
  signer: JsonRpcSigner,
  setListingStatus: (status: ListingStatus) => void,
  sendAddress: string,
  fakeForDemo = false
) {
  setListingStatus(ListingStatus.SIGNING)

  // TODO: remove delay when not testing
  if (fakeForDemo) {
    await delay(2000)
    setListingStatus(ListingStatus.PENDING)
    await delay(10000)
    setListingStatus(ListingStatus.APPROVED)
    return
  }
  setListingStatus(ListingStatus.PENDING)

  try {
    // TODO: add 1155s. assumption is currently made that the assets inputed are all ERC-721s
    if (assets.length == 1) {
      const asset = assets[0]
      const collectionAddress = asset.asset_contract.address
      const tokenId = asset.tokenId
      if (!collectionAddress || !tokenId) {
        setListingStatus(ListingStatus.REJECTED)
        return
      }
      const contract = new Contract(collectionAddress, ERC721, signer)
      const signerAddress = await signer.getAddress()
      await contract['safeTransferFrom(address,address,uint256)'](signerAddress, sendAddress, tokenId)
      setListingStatus(ListingStatus.APPROVED)
    } else if (assets.length > 1) {
      const contract = new Contract(
        SEND_CONTRACT_ADDRESS,
        OpenseaTransferHelperAbi,
        signer
      ) as OpenseaTransferHelperContext

      const items: {
        items: any[]
        recipient: string
        validateERC721Receiver: boolean
      }[] = [
        {
          items: [],
          recipient: sendAddress,
          validateERC721Receiver: true,
        },
      ]

      for (const asset of assets) {
        const collectionAddress = asset.asset_contract.address
        const tokenId = asset.tokenId
        if (!collectionAddress || !tokenId) {
          continue
        }

        items[0].items.push([ItemType.ERC721, collectionAddress, BigNumber.from(tokenId), BigNumber.from(1)])
      }

      await contract.bulkTransfer(items, OPENSEA_DEFAULT_CROSS_CHAIN_CONDUIT_KEY)
      setListingStatus(ListingStatus.APPROVED)
    }
  } catch (error) {
    if (error.code === 4001) setListingStatus(ListingStatus.REJECTED)
    else setListingStatus(ListingStatus.FAILED)
  }
}

async function lossBurnAssets(
  assets: WalletAsset[],
  signer: JsonRpcSigner,
  setListingStatus: (status: ListingStatus) => void,
  fakeForDemo = false
) {
  setListingStatus(ListingStatus.SIGNING)

  // TODO: remove delay when not testing
  if (fakeForDemo) {
    await delay(2000)
    setListingStatus(ListingStatus.PENDING)
    await delay(10000)
    setListingStatus(ListingStatus.APPROVED)
    return
  }
  setListingStatus(ListingStatus.PENDING)

  if (assets.length < 50) {
    const contract = new Contract(LOSSBURN_CONTRACT_ADDRESS, UnsellableLossBurnAbi, signer) as UnsellableLossBurnContext
    const addresses: string[] = []
    const tokens: BigNumber[] = []
    const amts: BigNumber[] = []
    for (const asset of assets) {
      const collectionAddress = asset.asset_contract.address
      const tokenId = asset.tokenId
      if (!collectionAddress || !tokenId) {
        continue
      }
      addresses.push(collectionAddress)
      tokens.push(BigNumber.from(tokenId))
      amts.push(BigNumber.from(1))
    }
    const options = { value: ethers.utils.parseEther('1.0') }
    await contract.sellNfts(addresses, tokens, amts, options)
    setListingStatus(ListingStatus.APPROVED)
  } else {
    setListingStatus(ListingStatus.REJECTED)
  }
}

const Bag = () => {
  const { account, provider } = useWeb3React()

  const { resetSellAssets, sellAssets, profileMethod } = useSellAsset(
    ({ reset, sellAssets, profileMethod }) => ({
      resetSellAssets: reset,
      sellAssets,
      profileMethod,
    }),
    shallow
  )

  const { profilePageState, setProfilePageState } = useProfilePageState(
    ({ setProfilePageState, state }) => ({
      profilePageState: state,
      setProfilePageState,
    }),
    shallow
  )
  const [isCheckboxSelected, toggleCheckboxSelected] = useReducer((state) => !state, false)
  const sendAddressInput = useSellAsset((state) => state.sendAddress)
  const setSendAddressInput = useSellAsset((state) => state.setSendAddress)
  const [hovered, toggleHover] = useReducer((state) => !state, false)
  const lookup = useENSAddress(sendAddressInput)
  const [showListModal, toggleShowListModal] = useReducer((s) => !s, false)
  const setListingStatus = useNFTList((state) => state.setListingStatus)
  const setCollectionsRequiringApproval = useNFTList((state) => state.setCollectionsRequiringApproval)
  const collectionsRequiringApproval = useNFTList((state) => state.collectionsRequiringApproval)

  const sendAddress = useMemo(
    () => (isAddress(sendAddressInput) ? sendAddressInput : lookup.address ?? ''),
    [lookup.address, sendAddressInput]
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
  } = useBag(
    (state) => ({
      ...state,
      bagIsLocked: state.isLocked,
      uncheckedItemsInBag: state.itemsInBag,
    }),
    shallow
  )
  const { uncheckedItemsInBag } = useBag(({ itemsInBag }) => ({
    uncheckedItemsInBag: itemsInBag,
  }))

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
        ...fetchedUnchangedAssets.map((unchangedAsset) => ({
          asset: unchangedAsset,
          status: BagItemStatus.REVIEWED,
        })),
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

  let profileButtonText
  switch (profileMethod) {
    case ProfileMethod.BURN:
      profileButtonText = <Trans>Burn NFTs</Trans>
      break
    case ProfileMethod.SEND:
      profileButtonText = <Trans>Send NFTs</Trans>
      break
    default:
      profileButtonText = <Trans>List NFTs</Trans>
  }

  const handleProfileClick = async () => {
    if (disableProfileButton) return

    const fakeForDemo = false // TODO: remove this when not faking success

    switch (profileMethod) {
      // case ProfileMethod.BURN:
      //   toggleShowListModal()
      //   if (provider) {
      //     for (const collection of collectionsRequiringApproval) {
      //       if (collection.collectionAddress) {
      //         await approveCollection(
      //           SEND_CONTRACT_CONDUIT_ADDRESS,
      //           collection.collectionAddress,
      //           provider.getSigner(),
      //           (newStatus: ListingStatus) =>
      //             updateStatus({
      //               listing: collection,
      //               newStatus,
      //               rows: collectionsRequiringApproval,
      //               setRows: setCollectionsRequiringApproval as Dispatch<AssetRow[]>,
      //             }),
      //           fakeForDemo
      //         )
      //       }
      //     }
      //     await sendAssets(sellAssets, provider.getSigner(), setListingStatus, BURN_ADDRESS_HAYDEN, fakeForDemo)
      //   }
      //   break
      case ProfileMethod.BURN:
        toggleShowListModal()
        if (provider) {
          // for (const collection of collectionsRequiringApproval) {
          //   if (collection.collectionAddress) {
          //     await approveCollection(
          //       SEND_CONTRACT_CONDUIT_ADDRESS,
          //       collection.collectionAddress,
          //       provider.getSigner(),
          //       (newStatus: ListingStatus) =>
          //         updateStatus({
          //           listing: collection,
          //           newStatus,
          //           rows: collectionsRequiringApproval,
          //           setRows: setCollectionsRequiringApproval as Dispatch<AssetRow[]>,
          //         }),
          //       fakeForDemo
          //     )
          //   }
          // }
          await lossBurnAssets(sellAssets, provider.getSigner(), setListingStatus, fakeForDemo)
        }
        break
      case ProfileMethod.SEND:
        toggleShowListModal()
        if (provider) {
          for (const collection of collectionsRequiringApproval) {
            if (collection.collectionAddress) {
              await approveCollection(
                SEND_CONTRACT_CONDUIT_ADDRESS,
                collection.collectionAddress,
                provider.getSigner(),
                (newStatus: ListingStatus) =>
                  updateStatus({
                    listing: collection,
                    newStatus,
                    rows: collectionsRequiringApproval,
                    setRows: setCollectionsRequiringApproval as Dispatch<AssetRow[]>,
                  }),
                fakeForDemo
              )
            }
          }
          await sendAssets(sellAssets, provider.getSigner(), setListingStatus, sendAddress, fakeForDemo)
        }
        break
      default:
        ;(isMobile || isNftListV2) && toggleBag()
        setProfilePageState(ProfilePageStateType.LISTING)
        sendAnalyticsEvent(NFTEventName.NFT_PROFILE_PAGE_START_SELL, {
          list_quantity: sellAssets.length,
          collection_addresses: sellAssets.map((asset) => asset.asset_contract.address),
          token_ids: sellAssets.map((asset) => asset.tokenId),
        })
    }
  }

  const disableProfileButton =
    (profileMethod === ProfileMethod.BURN && !isCheckboxSelected) ||
    (profileMethod === ProfileMethod.SEND && !sendAddress)

  return (
    <>
      <Portal>
        <BagContainer data-testid="nft-bag" raiseZIndex={isMobile || isModalOpen}>
          {!(isProfilePage && profilePageState === ProfilePageStateType.LISTING) ? (
            <>
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
                <Column marginTop={profileMethod === ProfileMethod.LIST ? '32' : '16'} marginX="28">
                  {profileMethod === ProfileMethod.BURN && (
                    <Row justifyContent="space-between" onMouseEnter={toggleHover} onMouseLeave={toggleHover}>
                      <ThemedText.Caption color="textSecondary">
                        <Trans>
                          I understand that burning NFTs
                          <br />
                          results in permanent loss of the NFTs
                        </Trans>
                      </ThemedText.Caption>
                      <Checkbox hovered={hovered} checked={isCheckboxSelected} onClick={toggleCheckboxSelected}>
                        <span />
                      </Checkbox>
                    </Row>
                  )}
                  {profileMethod === ProfileMethod.SEND && (
                    <Column gap="8">
                      <Row
                        borderColor={{ default: 'backgroundOutline', focus: 'accentAction' }}
                        borderWidth="1.5px"
                        borderStyle="solid"
                        height="44"
                        borderRadius="12"
                        padding="12"
                        backgroundColor="backgroundSurface"
                        gap="4"
                      >
                        <ThemedText.BodySmall fontWeight="600" flexShrink="0">
                          <Trans>To:&nbsp;</Trans>
                        </ThemedText.BodySmall>
                        <Box
                          as="input"
                          fontSize="14"
                          border="none"
                          backgroundColor="backgroundSurface"
                          color={{ placeholder: 'textTertiary', default: 'textPrimary' }}
                          value={sendAddressInput}
                          placeholder="0x50ec... or destination.eth"
                          onChange={(e: FormEvent<HTMLInputElement>) => {
                            setSendAddressInput(e.currentTarget.value)
                          }}
                        />
                      </Row>
                      <ThemedText.Caption color="textSecondary">
                        <Trans>
                          Items sent to an incorrect address may not be
                          <br />
                          recovered, double check before sending.
                        </Trans>
                      </ThemedText.Caption>
                    </Column>
                  )}
                  <Box
                    marginTop="8"
                    marginBottom="16"
                    paddingY="10"
                    className={`${buttonTextMedium} ${commonButtonStyles}`}
                    backgroundColor="accentAction"
                    color="white"
                    textAlign="center"
                    onClick={handleProfileClick}
                    disabled={disableProfileButton}
                    opacity={disableProfileButton ? '0.4' : '1'}
                    style={{ cursor: disableProfileButton ? 'auto' : 'pointer', userSelect: 'none' }}
                  >
                    {profileButtonText}
                  </Box>
                </Column>
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
      {showListModal && (
        <>
          <ListModal overlayClick={toggleShowListModal} />
        </>
      )}
    </>
  )
}

export default Bag
