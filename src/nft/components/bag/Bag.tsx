import { Trans } from '@lingui/macro'
import { sendAnalyticsEvent } from '@uniswap/analytics'
import { NFTEventName } from '@uniswap/analytics-events'
import { useIsNftDetailsPage, useIsNftPage, useIsNftProfilePage } from 'hooks/useIsNftPage'
import { BagFooter } from 'nft/components/bag/BagFooter'
import { Box } from 'nft/components/Box'
import { Portal } from 'nft/components/common/Portal'
import { Column } from 'nft/components/Flex'
import { Overlay } from 'nft/components/modals/Overlay'
import { useBag, useIsMobile, useProfilePageState, useSellAsset } from 'nft/hooks'
import { BagStatus, ProfilePageStateType } from 'nft/types'
import { formatAssetEventProperties, recalculateBagUsingPooledAssets } from 'nft/utils'
import { useCallback, useEffect, useMemo, useState } from 'react'
import styled from 'styled-components/macro'
import { Z_INDEX } from 'theme/zIndex'
import { shallow } from 'zustand/shallow'

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
  const { resetSellAssets, sellAssets } = useSellAsset(
    ({ reset, sellAssets }) => ({
      resetSellAssets: reset,
      sellAssets,
    }),
    shallow
  )

  const { setProfilePageState } = useProfilePageState(({ setProfilePageState }) => ({ setProfilePageState }))

  const { bagStatus, bagIsLocked, reset, bagExpanded, toggleBag, setBagExpanded } = useBag(
    (state) => ({ ...state, bagIsLocked: state.isLocked, uncheckedItemsInBag: state.itemsInBag }),
    shallow
  )
  const { uncheckedItemsInBag } = useBag(({ itemsInBag }) => ({ uncheckedItemsInBag: itemsInBag }))

  const isProfilePage = useIsNftProfilePage()
  const isDetailsPage = useIsNftDetailsPage()
  const isNFTPage = useIsNftPage()
  const isMobile = useIsMobile()

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

  const handleCloseBag = useCallback(() => {
    setBagExpanded({ bagExpanded: false, manualClose: true })
  }, [setBagExpanded])

  useEffect(() => {
    if (bagIsLocked && !isModalOpen) setModalIsOpen(true)
  }, [bagIsLocked, isModalOpen])

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
          <BagFooter setModalIsOpen={setModalIsOpen} eventProperties={eventProperties} />
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
