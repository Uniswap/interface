import { Trans } from '@lingui/macro'
import { Trace } from '@uniswap/analytics'
import { InterfaceModalName } from '@uniswap/analytics-events'
import { isAddress } from 'ethers/lib/utils'
import { Portal } from 'nft/components/common/Portal'
import { Row } from 'nft/components/Flex'
import { Overlay } from 'nft/components/modals/Overlay'
import { ProfileMethod, useIsMobile, useNFTList, useSellAsset } from 'nft/hooks'
import { ListingStatus } from 'nft/types'
import { pluralize } from 'nft/utils'
import { useEffect, useReducer, useRef } from 'react'
import { X } from 'react-feather'
import { useIsDarkMode } from 'state/user/hooks'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { Z_INDEX } from 'theme/zIndex'
import { shortenAddress } from 'utils'

import { ListModalSection, Section, SectionHeaderOnly } from './ListModalSection'

const ListModalWrapper = styled.div<{ isMobile: boolean }>`
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: ${({ isMobile }) => (isMobile ? '300px' : '420px')};
  z-index: ${Z_INDEX.modal};
  background: ${({ theme }) => theme.backgroundSurface};
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  box-shadow: ${({ theme }) => theme.deepShadow};
  padding: 20px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 640px;
`

const TitleRow = styled(Row)`
  justify-content: space-between;
  margin-bottom: 8px;
`

const SuccessImage = styled.img<{ numImages: number }>`
  width: calc(${({ numImages }) => (numImages > 1 ? (numImages > 2 ? '33%' : '50%') : '100%')} - 16px);
  border-radius: 12px;
`

const AnimationNFTDiv = styled.div`
  height: 420px;
  width: 100%
  z-index: 1;
  position relative;
  top: 0;
  left: 0;
  overflow: hidden;
`

const AnimationNft = styled.img<{ cardRight: boolean }>`
  border-radius: 12px;
  width: 64px;
  z-index: 1;
  position: relative;
  top: -64px;
  left: ${({ cardRight }) => (cardRight ? '200px' : '100px')};

  animation: moveNFT 2s;
  animation-iteration-count: infinite;
  animation-delay: 2s;

  @keyframes moveNFT {
    0% {
      transform: translate3d(0, 0, 0);
      opacity: 0;
    }
    10% {
      opacity: 1;
    }
    50% {
      opacity: 0.9;
    }
    100% {
      transform: translate3d(0, 360px, 0);
      opacity: 0;
    }
  }
`

const SigningAnimation = styled.video`
  position: relative;
  width: calc(100% + 48px);
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  bottom: 0;
  left: 0;
  margin-left: -24px;
  margin-bottom: -24px;
  margin-top: -420px;
  z-index: 0;
`

export const ListModal = ({ overlayClick }: { overlayClick: () => void }) => {
  const listings = useNFTList((state) => state.listings)
  const listingCollectionsRequiringApproval = useNFTList((state) => state.collectionsRequiringApproval)
  const listingStatus = useNFTList((state) => state.listingStatus)
  const setListingStatus = useNFTList((state) => state.setListingStatus)
  const [openSection, toggleOpenSection] = useReducer(
    (s) => (s === Section.APPROVE ? Section.SIGN : Section.APPROVE),
    Section.APPROVE
  )
  const sellAssets = useSellAsset((state) => state.sellAssets)
  const clearSellAssets = useSellAsset((state) => state.reset)
  const profileMethod = useSellAsset((state) => state.profileMethod)
  const sendAddress = useSellAsset((state) => state.sendAddress)
  const isListing = profileMethod === ProfileMethod.LIST
  const animationRef = useRef() as React.MutableRefObject<HTMLVideoElement>
  const [animatedNftRight, toggleAnimatedNftRight] = useReducer((s) => !s, true)
  const [animatedNftIndex, updateAnimatedNftIndex] = useReducer((s) => (s === sellAssets.length - 1 ? 0 : (s += 1)), 0)
  const isMobile = useIsMobile()
  const isDarkMode = useIsDarkMode()

  const statusCheckedOverlayClick = () => {
    if (listingStatus === ListingStatus.APPROVED) {
      clearSellAssets()
      setListingStatus(ListingStatus.DEFINED)
      window.location.reload()
    }
    overlayClick()
  }

  useEffect(() => {
    animationRef.current?.play()
    if (listingStatus === ListingStatus.PENDING) {
      setInterval(() => {
        toggleAnimatedNftRight()
        updateAnimatedNftIndex()
      }, 1995)
    }
  }, [listingStatus, animationRef])

  return (
    <Portal>
      <Trace modal={InterfaceModalName.NFT_LISTING}>
        <ListModalWrapper isMobile={isMobile}>
          {listingStatus !== ListingStatus.APPROVED ? (
            listingStatus === ListingStatus.PENDING && profileMethod === ProfileMethod.BURN && !isMobile ? (
              <>
                <AnimationNFTDiv>
                  <AnimationNft src={sellAssets[animatedNftIndex].imageUrl} cardRight={animatedNftRight} />
                </AnimationNFTDiv>
                <SigningAnimation ref={animationRef} loop>
                  <source src={`/nft/${isDarkMode ? 'D' : 'L'}- Fire Only.mp4`} type="video/mp4" />{' '}
                </SigningAnimation>
              </>
            ) : (
              <>
                <TitleRow>
                  <ThemedText.HeadlineSmall lineHeight="28px">
                    <Trans>
                      {isListing ? 'List' : profileMethod === ProfileMethod.SEND ? 'Send' : 'Burn'} NFT
                      {pluralize(sellAssets.length)}
                    </Trans>
                  </ThemedText.HeadlineSmall>
                  <X size={24} cursor="pointer" onClick={statusCheckedOverlayClick} />
                </TitleRow>
                <ListModalSection
                  sectionType={Section.APPROVE}
                  active={openSection === Section.APPROVE}
                  content={listingCollectionsRequiringApproval}
                  toggleSection={toggleOpenSection}
                />
                {isListing && (
                  <ListModalSection
                    sectionType={Section.SIGN}
                    active={openSection === Section.SIGN}
                    content={listings}
                    toggleSection={toggleOpenSection}
                  />
                )}
                {!isListing && <SectionHeaderOnly active={openSection === Section.SIGN} />}
              </>
            )
          ) : (
            <>
              <TitleRow>
                <ThemedText.HeadlineSmall lineHeight="28px">
                  Successfully{' '}
                  <Trans>
                    {isListing ? 'listed' : profileMethod === ProfileMethod.SEND ? 'sent' : 'burnt'}
                    {sellAssets.length > 1 ? ` ${sellAssets.length}` : ''} NFT
                    {pluralize(sellAssets.length)}!
                  </Trans>
                </ThemedText.HeadlineSmall>
                <X size={24} cursor="pointer" onClick={statusCheckedOverlayClick} />
              </TitleRow>
              <Row flexWrap="wrap" gap="12" justifyContent="center" overflowY="scroll" marginBottom="16">
                {sellAssets.map((asset) => (
                  <SuccessImage
                    src={asset.imageUrl}
                    key={asset?.asset_contract?.address ?? '' + asset?.tokenId}
                    numImages={sellAssets.length}
                  />
                ))}
              </Row>
              {profileMethod === ProfileMethod.SEND && (
                <Row gap="8" justifyContent="flex-end" marginRight="16" height="full">
                  <ThemedText.BodyPrimary fontWeight="600" style={{ whiteSpace: 'nowrap', flexShrink: '0' }}>
                    Sent to:&nbsp;
                  </ThemedText.BodyPrimary>
                  <ThemedText.BodyPrimary
                    color="textSecondary"
                    style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}
                  >
                    {isAddress(sendAddress) ? shortenAddress(sendAddress) : sendAddress}{' '}
                  </ThemedText.BodyPrimary>
                </Row>
              )}
            </>
          )}
        </ListModalWrapper>
      </Trace>
      <Overlay onClick={statusCheckedOverlayClick} />
    </Portal>
  )
}
