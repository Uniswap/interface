import { NFTEventName } from '@uniswap/analytics-events'
import { useIsMobile } from 'hooks/screenSize/useIsMobile'
import { PageType, useIsPage } from 'hooks/useIsPage'
import { BagContent } from 'nft/components/bag/BagContent'
import { BagFooter } from 'nft/components/bag/BagFooter'
import { BagHeader } from 'nft/components/bag/BagHeader'
import EmptyState from 'nft/components/bag/EmptyContent'
import { ProfileBagContent } from 'nft/components/bag/profile/ProfileBagContent'
import { Portal } from 'nft/components/common/Portal'
import { Overlay } from 'nft/components/modals/Overlay'
import { useBag, useProfilePageState, useSellAsset, useSubscribeScrollState } from 'nft/hooks'
import { BagStatus, ProfilePageStateType } from 'nft/types'
import { formatAssetEventProperties, recalculateBagUsingPooledAssets } from 'nft/utils'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Trans } from 'react-i18next'
import { Z_INDEX } from 'theme/zIndex'
import { Button, Flex, useScrollbarStyles } from 'ui/src'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'

export const BAG_WIDTH = 320
export const XXXL_BAG_WIDTH = 360

const Bag = () => {
  const { resetSellAssets, sellAssets } = useSellAsset(({ reset, sellAssets }) => ({
    resetSellAssets: reset,
    sellAssets,
  }))

  const { setProfilePageState } = useProfilePageState(({ setProfilePageState }) => ({ setProfilePageState }))

  const { bagStatus, bagIsLocked, reset, bagExpanded, toggleBag, setBagExpanded } = useBag((state) => ({
    ...state,
    bagIsLocked: state.isLocked,
    uncheckedItemsInBag: state.itemsInBag,
  }))
  const { uncheckedItemsInBag } = useBag(({ itemsInBag }) => ({ uncheckedItemsInBag: itemsInBag }))

  const isProfilePage = useIsPage(PageType.NFTS_PROFILE)
  const isDetailsPage = useIsPage(PageType.NFTS_DETAILS)
  const isNFTPage = useIsPage(PageType.NFTS)
  const isMobile = useIsMobile()

  const itemsInBag = useMemo(() => recalculateBagUsingPooledAssets(uncheckedItemsInBag), [uncheckedItemsInBag])

  const [isModalOpen, setModalIsOpen] = useState(false)
  const { userCanScroll, scrollRef, scrollProgress, scrollHandler } = useSubscribeScrollState()
  const scrollbarStyles = useScrollbarStyles()

  const handleCloseBag = useCallback(() => {
    setBagExpanded({ bagExpanded: false, manualClose: true })
  }, [setBagExpanded])

  useEffect(() => {
    if (bagIsLocked && !isModalOpen) {
      setModalIsOpen(true)
    }
  }, [bagIsLocked, isModalOpen])

  const hasAssetsToShow = itemsInBag.length > 0
  const isBuyingAssets = itemsInBag.length > 0
  const isSellingAssets = sellAssets.length > 0

  const shouldRenderEmptyState = Boolean(
    (!isProfilePage && !isBuyingAssets && bagStatus === BagStatus.ADDING_TO_BAG) || (isProfilePage && !isSellingAssets),
  )

  const eventProperties = useMemo(
    () => ({
      ...formatAssetEventProperties(itemsInBag.map((item) => item.asset)),
    }),
    [itemsInBag],
  )

  if (!bagExpanded || !isNFTPage) {
    return null
  }

  return (
    <Portal>
      <Flex
        top={88}
        right={20}
        width={XXXL_BAG_WIDTH}
        height="calc(100vh - 108px)"
        backgroundColor="$surface1"
        borderColor="$surface3"
        borderWidth={1}
        borderRadius="$rounded16"
        shadowColor="$surface3"
        shadowRadius={10}
        shadowOpacity={0.04}
        zIndex={isMobile || isModalOpen ? (isProfilePage ? Z_INDEX.modalOverTooltip : Z_INDEX.modalBackdrop - 1) : 3}
        $md={{
          right: 0,
          width: '100%',
          height: '100%',
          borderWidth: 0,
          borderRadius: '$none',
        }}
        $xxl={{
          width: BAG_WIDTH,
        }}
        $platform-web={{
          position: 'fixed',
        }}
      >
        <BagHeader
          numberOfAssets={isProfilePage ? sellAssets.length : itemsInBag.length}
          closeBag={handleCloseBag}
          resetFlow={isProfilePage ? resetSellAssets : reset}
          isProfilePage={isProfilePage}
        />
        {shouldRenderEmptyState && <EmptyState />}
        <Flex
          mx="$spacing24"
          borderWidth={1}
          borderColor="$transparent"
          borderTopColor={userCanScroll && scrollProgress > 0 ? '$surface3' : 'transparent'}
          borderBottomColor="transparent"
          opacity={userCanScroll && scrollProgress > 0 ? 1 : 0}
          animation="fast"
        />
        {/* Tamagui flex components don't allow custom scroll handlers */}
        {/* eslint-disable-next-line react/forbid-elements */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            overflowY: 'auto',
            paddingLeft: '20px',
            paddingRight: '20px',
            ...scrollbarStyles,
          }}
          ref={scrollRef}
          onScroll={scrollHandler}
        >
          {isProfilePage ? <ProfileBagContent /> : <BagContent />}
        </div>
        {hasAssetsToShow && !isProfilePage && (
          <BagFooter setModalIsOpen={setModalIsOpen} eventProperties={eventProperties} />
        )}
        {isSellingAssets && isProfilePage && (
          <Button
            size="large"
            emphasis="primary"
            mx="$spacing28"
            my="$spacing16"
            mt="$spacing32"
            onPress={() => {
              toggleBag()
              setProfilePageState(ProfilePageStateType.LISTING)
              sendAnalyticsEvent(NFTEventName.NFT_PROFILE_PAGE_START_SELL, {
                list_quantity: sellAssets.length,
                collection_addresses: sellAssets.map((asset) => asset.asset_contract.address),
                token_ids: sellAssets.map((asset) => asset.tokenId),
              })
            }}
          >
            <Trans i18nKey="common.button.continue" />
          </Button>
        )}
      </Flex>

      {isDetailsPage ? (
        <Flex
          backgroundColor="rgba(0, 0, 0, 0.7)"
          top={0}
          width="100%"
          height="100%"
          onPress={toggleBag}
          $platform-web={{
            position: 'fixed',
          }}
        />
      ) : (
        isModalOpen && <Overlay onClick={() => (!bagIsLocked ? setModalIsOpen(false) : undefined)} />
      )}
    </Portal>
  )
}

export default Bag
