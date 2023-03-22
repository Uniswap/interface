import Column from 'components/Column'
import Row from 'components/Row'
import { useToggleWalletDrawer } from 'components/WalletDropdown'
import { Box } from 'nft/components/Box'
import { NftCard } from 'nft/components/card'
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
  const toggleWalletDrawer = useToggleWalletDrawer()
  const navigate = useNavigate()

  const navigateToNFTDetails = () => {
    navigate(`/nfts/asset/${asset.asset_contract.address}/${asset.tokenId}`)
    toggleWalletDrawer()
  }

  return (
    <NFTContainer>
      <NftCard
        asset={asset}
        hideDetails
        display={{ disabledInfo: true }}
        isSelected={false}
        isDisabled={false}
        selectAsset={navigateToNFTDetails}
        unselectAsset={() => {
          /* */
        }}
        mediaShouldBePlaying={mediaShouldBePlaying}
        setCurrentTokenPlayingMedia={setCurrentTokenPlayingMedia}
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
