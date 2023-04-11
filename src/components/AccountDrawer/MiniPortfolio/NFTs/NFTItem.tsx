import { sendAnalyticsEvent, useTrace } from '@uniswap/analytics'
import { InterfaceElementName, SharedEventName } from '@uniswap/analytics-events'
import { useToggleAccountDrawer } from 'components/AccountDrawer'
import Column from 'components/Column'
import Row from 'components/Row'
import { Box } from 'nft/components/Box'
import { NftCard } from 'nft/components/card'
import { detailsHref } from 'nft/components/card/utils'
import { VerifiedIcon } from 'nft/components/icons'
import { WalletAsset } from 'nft/types'
import { floorFormatter } from 'nft/utils'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

const FloorPrice = styled(Row)`
  opacity: 0;

  // prevent empty whitespace from collapsing line height to maintain
  // consistent spacing below rows
  white-space: pre;
`

const NFTContainer = styled(Column)`
  gap: 8px;
  min-height: 150px;

  &:hover {
    ${FloorPrice} {
      opacity: 1;
    }
  }
`
const NFTCollectionName = styled(ThemedText.BodySmall)`
  white-space: pre;
  text-overflow: ellipsis;
  overflow: hidden;
`

export function NFT({
  asset,
  mediaShouldBePlaying,
  setCurrentTokenPlayingMedia,
}: {
  asset: WalletAsset
  mediaShouldBePlaying: boolean
  setCurrentTokenPlayingMedia: (tokenId: string | undefined) => void
}) {
  const toggleWalletDrawer = useToggleAccountDrawer()
  const navigate = useNavigate()
  const trace = useTrace()

  const navigateToNFTDetails = () => {
    toggleWalletDrawer()
    navigate(detailsHref(asset))
  }

  return (
    <NFTContainer>
      <NftCard
        asset={asset}
        hideDetails
        display={{ disabledInfo: true }}
        isSelected={false}
        isDisabled={false}
        onCardClick={navigateToNFTDetails}
        sendAnalyticsEvent={() =>
          sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
            element: InterfaceElementName.MINI_PORTFOLIO_NFT_ITEM,
            collection_name: asset.collection?.name,
            collection_address: asset.collection?.address,
            token_id: asset.tokenId,
            ...trace,
          })
        }
        mediaShouldBePlaying={mediaShouldBePlaying}
        setCurrentTokenPlayingMedia={setCurrentTokenPlayingMedia}
        testId="mini-portfolio-nft"
      />
      <NFTDetails asset={asset} />
    </NFTContainer>
  )
}

function NFTDetails({ asset }: { asset: WalletAsset }) {
  return (
    <Box overflow="hidden" width="full" flexWrap="nowrap">
      <Row gap="4px">
        <NFTCollectionName>{asset.asset_contract.name}</NFTCollectionName>
        {asset.collectionIsVerified && <Verified />}
      </Row>
      <FloorPrice>
        <ThemedText.Caption color="textSecondary">
          {asset.floorPrice ? `${floorFormatter(asset.floorPrice)} ETH` : ' '}
        </ThemedText.Caption>
      </FloorPrice>
    </Box>
  )
}

const BADGE_SIZE = '18px'
function Verified() {
  return (
    <Row width="unset" flexShrink="0">
      <VerifiedIcon height={BADGE_SIZE} width={BADGE_SIZE} />
    </Row>
  )
}
